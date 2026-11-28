/*
 * lib/demo/rest.ts: turns the app's database requests into SQL for the
 * demo database that runs in the visitor's own browser (PGlite).
 *
 * Why: request 262 (Anthony, 2026-11-27): the hospital demos have no
 * backend. The app asks Supabase for data with web addresses such as
 * /rest/v1/patients?select=id,full_name&id=eq.4. Supabase answers those with
 * a program called PostgREST. This file does the same job, for the kinds of
 * request this app makes, so every screen works unchanged.
 *
 * How: every request runs inside one transaction, as the role
 * "authenticated" with the signed in person's id in request.jwt.claims,
 * exactly as Supabase does. So the real access rules (RLS) and the real
 * database functions decide everything, as on the live site.
 *
 * Never: run as the database owner for a visitor's request, or build SQL by
 * pasting a visitor's value into it. Values always travel as parameters;
 * names are checked against the database before they are used.
 */

// ===== 1. Shapes =====
// The small part of PGlite this file uses.
export type Db = {
  transaction<T>(run: (tx: Tx) => Promise<T>): Promise<T>
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
}
export type Tx = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
}
export type Answer = { status: number; headers?: Record<string, string>; body: string | null }

// One foreign key: table.cols point at rtable.rcols.
type Fk = { con: string; tbl: string; cols: string[]; rtbl: string; rcols: string[] }
// One database function the app may call.
type Fn = { args: string[]; types: string[]; set: boolean; defaults: number }

// ===== 2. What the database looks like, read once =====
let catalogue: Promise<{ fks: Fk[]; columns: Map<string, string[]>; fns: Map<string, Fn[]> }> | null =
  null

function readCatalogue(db: Db) {
  if (!catalogue) {
    catalogue = (async () => {
      const fks = await db.query<Fk>(`
        select c.conname as con, t.relname as tbl, rt.relname as rtbl,
          array(select a.attname::text from unnest(c.conkey) with ordinality k(n, i)
                join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.n order by k.i) as cols,
          array(select a.attname::text from unnest(c.confkey) with ordinality k(n, i)
                join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.n order by k.i) as rcols
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
        join pg_class rt on rt.oid = c.confrelid
        where c.contype = 'f' and n.nspname = 'public'`)
      const cols = await db.query<{ tbl: string; col: string }>(`
        select c.relname as tbl, a.attname as col from pg_attribute a
        join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'v', 'm') and a.attnum > 0 and not a.attisdropped`)
      const columns = new Map<string, string[]>()
      for (const row of cols.rows) {
        const list = columns.get(row.tbl) ?? []
        list.push(row.col)
        columns.set(row.tbl, list)
      }
      const fnRows = await db.query<{
        name: string
        args: string[] | null
        types: string[]
        set: boolean
        defaults: number
      }>(`
        select p.proname as name, p.proargnames as args, p.proretset as set,
          p.pronargdefaults as defaults,
          array(select format_type(t, null) from unnest(p.proargtypes) t) as types
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'`)
      const fns = new Map<string, Fn[]>()
      for (const row of fnRows.rows) {
        const list = fns.get(row.name) ?? []
        list.push({
          args: (row.args ?? []).slice(0, row.types.length),
          types: row.types,
          set: row.set,
          defaults: row.defaults,
        })
        fns.set(row.name, list)
      }
      return { fks: fks.rows, columns, fns }
    })()
  }
  return catalogue
}

// ===== 3. Small helpers =====
const quote = (name: string) => '"' + name.replace(/"/g, '""') + '"'

// Split "a,b(c,d),e" at the top level commas only.
function splitTop(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quoted = false
  let current = ''
  for (const ch of text) {
    if (ch === '"') quoted = !quoted
    if (!quoted && ch === '(') depth++
    if (!quoted && ch === ')') depth--
    if (!quoted && depth === 0 && ch === ',') {
      parts.push(current)
      current = ''
    } else current += ch
  }
  if (current.trim()) parts.push(current)
  return parts.map((part) => part.trim()).filter(Boolean)
}

// A PostgreSQL error, in the shape supabase-js reads.
export function errorAnswer(error: unknown): Answer {
  const e = error as { code?: string; message?: string; detail?: string; hint?: string }
  const code = e.code ?? 'PGRST000'
  const status =
    code === '42501' ? 403 : code === '23505' || code === '23503' ? 409 : code === 'PGRST116' ? 406 : 400
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      code,
      message: e.message ?? 'Error',
      details: e.detail ?? null,
      hint: e.hint ?? null,
    }),
  }
}

class RestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

// ===== 4. The select list, with linked rows ("embeds") =====
// Builds the SQL column list for "id, full_name, room:rooms(name)" on the
// table known in SQL as `alias`.
type Built = { sql: string; params: unknown[] }

async function selectList(
  db: Db,
  table: string,
  alias: string,
  select: string,
  params: unknown[],
  depth = 0,
): Promise<string> {
  const { fks, columns } = await readCatalogue(db)
  const known = columns.get(table) ?? []
  const items = splitTop(select || '*')
  const out: string[] = []
  for (const item of items) {
    // A linked table: "alias:target!hint(columns)" or "target(columns)".
    const embed = item.match(/^(?:([a-zA-Z0-9_]+):)?([a-zA-Z0-9_]+)(?:!([a-zA-Z0-9_]+))?\((.*)\)$/s)
    if (embed) {
      const [, as, target, hint, inner] = embed
      const name = as ?? target
      const child = `t${depth + 1}_${out.length}`
      // "patients(count)": how many linked rows.
      const link = findLink(fks, table, target, hint, known)
      if (!link) throw new RestError('PGRST200', `No link from ${table} to ${target}`)
      const where = link.cols
        .map((col, i) =>
          link.many
            ? `${child}.${quote(col)} = ${alias}.${quote(link.rcols[i])}`
            : `${child}.${quote(link.rcols[i])} = ${alias}.${quote(col)}`,
        )
        .join(' and ')
      const from = `public.${quote(link.target)} ${child}`
      if (inner.trim() === 'count') {
        out.push(`json_build_array(json_build_object('count', (select count(*) from ${from} where ${where}))) as ${quote(name)}`)
        continue
      }
      const cols = await selectList(db, link.target, child, inner, params, depth + 1)
      out.push(
        link.many
          ? `coalesce((select json_agg(x) from (select ${cols} from ${from} where ${where}) x), '[]'::json) as ${quote(name)}`
          : `(select to_json(x) from (select ${cols} from ${from} where ${where} limit 1) x) as ${quote(name)}`,
      )
      continue
    }
    if (item === '*') {
      out.push(`${alias}.*`)
      continue
    }
    // "alias:column" or "column" or "column::type".
    const plain = item.match(/^(?:([a-zA-Z0-9_]+):)?([a-zA-Z0-9_]+)(?:::([a-z0-9_ ]+))?$/)
    if (!plain) throw new RestError('PGRST100', `Cannot read "${item}"`)
    const [, as, col, cast] = plain
    if (!known.includes(col)) throw new RestError('42703', `column ${table}.${col} does not exist`)
    out.push(`${alias}.${quote(col)}${cast ? '::' + cast : ''} as ${quote(as ?? col)}`)
  }
  return out.join(', ')
}

// Which foreign key joins `table` to `target`? `hint` is the key's name or
// the column on `table` (PostgREST allows both). many: target points at us.
function findLink(fks: Fk[], table: string, target: string, hint: string | undefined, known: string[]) {
  const matches = (fk: Fk) => !hint || fk.con === hint || fk.cols[0] === hint
  // A column name used as the target: "author:written_by(full_name)".
  if (known.includes(target)) {
    const fk = fks.find((f) => f.tbl === table && f.cols[0] === target)
    if (fk) return { target: fk.rtbl, cols: fk.cols, rcols: fk.rcols, many: false }
  }
  const forward = fks.filter((f) => f.tbl === table && f.rtbl === target && matches(f))
  if (forward.length) return { target, cols: forward[0].cols, rcols: forward[0].rcols, many: false }
  const back = fks.filter((f) => f.tbl === target && f.rtbl === table && matches(f))
  if (back.length) return { target, cols: back[0].cols, rcols: back[0].rcols, many: true }
  return null
}

// ===== 5. Filters: id=eq.4, status=in.(a,b), or=(x.eq.1,y.is.null) =====
function parseList(text: string): string[] {
  // "(a,b,"c d")" -> ['a', 'b', 'c d']
  const inner = text.replace(/^\(/, '').replace(/\)$/, '')
  return splitTop(inner).map((v) => v.replace(/^"(.*)"$/s, '$1'))
}

function pgArray(values: string[]): string {
  return '{' + values.map((v) => '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}'
}

function condition(alias: string, col: string, expr: string, params: unknown[], known: string[]): string {
  if (!known.includes(col)) throw new RestError('42703', `column ${col} does not exist`)
  let not = false
  let rest = expr
  if (rest.startsWith('not.')) {
    not = true
    rest = rest.slice(4)
  }
  const dot = rest.indexOf('.')
  const op = dot < 0 ? rest : rest.slice(0, dot)
  const value = dot < 0 ? '' : rest.slice(dot + 1)
  const column = `${alias}.${quote(col)}`
  const add = (v: unknown) => {
    params.push(v)
    return `$${params.length}`
  }
  let sql: string
  switch (op) {
    case 'eq':
      sql = `${column} = ${add(value)}`
      break
    case 'neq':
      sql = `${column} <> ${add(value)}`
      break
    case 'gt':
      sql = `${column} > ${add(value)}`
      break
    case 'gte':
      sql = `${column} >= ${add(value)}`
      break
    case 'lt':
      sql = `${column} < ${add(value)}`
      break
    case 'lte':
      sql = `${column} <= ${add(value)}`
      break
    case 'like':
      sql = `${column}::text like ${add(value.replace(/\*/g, '%'))}`
      break
    case 'ilike':
      sql = `${column}::text ilike ${add(value.replace(/\*/g, '%'))}`
      break
    case 'is': {
      const word = value.toLowerCase()
      if (!['null', 'true', 'false', 'unknown'].includes(word)) throw new RestError('PGRST100', 'Bad is')
      sql = `${column} is ${word}`
      break
    }
    case 'in':
      sql = `${column} = any(${add(pgArray(parseList(value)))})`
      break
    case 'cs':
      sql = `${column} @> ${add(value.startsWith('{') || value.startsWith('[') ? value : pgArray([value]))}`
      break
    case 'cd':
      sql = `${column} <@ ${add(value)}`
      break
    case 'ov':
      sql = `${column} && ${add(value.startsWith('(') ? pgArray(parseList(value)) : value)}`
      break
    default:
      throw new RestError('PGRST100', `Unknown filter ${op}`)
  }
  return not ? `not (${sql})` : sql
}

// "or=(a.eq.1,b.is.null)" and "and=(...)", nested.
function logical(alias: string, kind: 'or' | 'and', text: string, params: unknown[], known: string[]): string {
  const parts = splitTop(text.replace(/^\(/, '').replace(/\)$/, ''))
  const sql = parts.map((part) => {
    const nested = part.match(/^(not\.)?(or|and)(\(.*\))$/s)
    if (nested) {
      const inner = logical(alias, nested[2] as 'or' | 'and', nested[3], params, known)
      return nested[1] ? `not ${inner}` : inner
    }
    const dot = part.indexOf('.')
    return condition(alias, part.slice(0, dot), part.slice(dot + 1), params, known)
  })
  return '(' + sql.join(kind === 'or' ? ' or ' : ' and ') + ')'
}

const NOT_FILTERS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

function whereClause(alias: string, search: URLSearchParams, params: unknown[], known: string[]): string {
  const parts: string[] = []
  for (const [key, value] of search.entries()) {
    if (NOT_FILTERS.has(key)) continue
    if (key.includes('.')) continue // filters on linked tables: not used by this app's screens
    if (key === 'or' || key === 'and') parts.push(logical(alias, key, value, params, known))
    else if (key === 'not.or' || key === 'not.and')
      parts.push('not ' + logical(alias, key.slice(4) as 'or' | 'and', value, params, known))
    else parts.push(condition(alias, key, value, params, known))
  }
  return parts.length ? ' where ' + parts.join(' and ') : ''
}

function orderClause(alias: string, order: string | null, known: string[]): string {
  if (!order) return ''
  const parts = splitTop(order).map((part) => {
    const [col, ...mods] = part.split('.')
    if (!known.includes(col)) throw new RestError('42703', `column ${col} does not exist`)
    const dir = mods.includes('desc') ? ' desc' : ' asc'
    const nulls = mods.includes('nullsfirst') ? ' nulls first' : mods.includes('nullslast') ? ' nulls last' : ''
    return `${alias}.${quote(col)}${dir}${nulls}`
  })
  return ' order by ' + parts.join(', ')
}

// ===== 6. One request =====
export type Request2 = {
  method: string
  path: string // "patients" or "rpc/register_family"
  search: URLSearchParams
  headers: Headers
  body: string | null
}

export async function handleRest(db: Db, claims: string | null, req: Request2): Promise<Answer> {
  try {
    const cat = await readCatalogue(db)
    return await db.transaction(async (tx) => {
      // The signed in person, exactly as Supabase sets them.
      await tx.query(claims ? 'set local role authenticated' : 'set local role anon')
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims ?? ''])
      if (req.path.startsWith('rpc/')) return await rpc(tx, cat.fns, req)
      return await table(db, tx, cat.columns, req)
    })
  } catch (error) {
    return errorAnswer(error)
  }
}

// ===== 7. Tables: read, add, change, remove =====
async function table(db: Db, tx: Tx, columns: Map<string, string[]>, req: Request2): Promise<Answer> {
  const name = req.path
  const known = columns.get(name)
  if (!known) throw new RestError('42P01', `relation public.${name} does not exist`)
  const prefer = req.headers.get('prefer') ?? ''
  const single = (req.headers.get('accept') ?? '').includes('vnd.pgrst.object')
  const select = req.search.get('select') ?? '*'
  const params: unknown[] = []
  let rowsSql: string

  if (req.method === 'GET' || req.method === 'HEAD') {
    const cols = await selectList(db, name, 't0', select, params)
    const where = whereClause('t0', req.search, params, known)
    const order = orderClause('t0', req.search.get('order'), known)
    let limit = req.search.get('limit')
    let offset = req.search.get('offset')
    const range = req.headers.get('range')
    if (range) {
      const [from, to] = range.split('-').map(Number)
      offset = String(from)
      limit = String(to - from + 1)
    }
    const page = (limit ? ` limit ${Number(limit)}` : '') + (offset ? ` offset ${Number(offset)}` : '')
    rowsSql = `select ${cols} from public.${quote(name)} t0${where}${order}${page}`
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (prefer.includes('count=')) {
      const countParams: unknown[] = []
      const countWhere = whereClause('t0', req.search, countParams, known)
      const counted = await tx.query<{ n: number }>(
        `select count(*)::int as n from public.${quote(name)} t0${countWhere}`,
        countParams,
      )
      const n = counted.rows[0].n
      const start = Number(offset ?? 0)
      headers['content-range'] = n === 0 ? `*/0` : `${start}-${start + n - 1}/${n}`
    }
    if (req.method === 'HEAD') return { status: 200, headers, body: null }
    return finish(tx, rowsSql, params, single, headers)
  }

  // The body: one row or a list of rows.
  const parsed = req.body ? JSON.parse(req.body) : {}
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  const wantBack = prefer.includes('return=representation')

  if (req.method === 'POST') {
    const listed = req.search.get('columns')
    const keys = listed
      ? listed.split(',').map((k) => k.replace(/"/g, '').trim())
      : [...new Set(rows.flatMap((row) => Object.keys(row)))]
    for (const key of keys) if (!known.includes(key)) throw new RestError('42703', `column ${key} does not exist`)
    params.push(JSON.stringify(rows))
    const colList = keys.map(quote).join(', ')
    let conflict = ''
    const onConflict = req.search.get('on_conflict')
    if (prefer.includes('resolution=merge-duplicates') || prefer.includes('resolution=ignore-duplicates')) {
      const target = (onConflict ?? 'id').split(',').map((k) => quote(k.trim())).join(', ')
      conflict = prefer.includes('ignore-duplicates')
        ? ` on conflict (${target}) do nothing`
        : ` on conflict (${target}) do update set ` +
          keys.map((k) => `${quote(k)} = excluded.${quote(k)}`).join(', ')
    }
    const insert = `insert into public.${quote(name)} (${colList}) select ${colList} from json_populate_recordset(null::public.${quote(name)}, $1::json)${conflict} returning *`
    if (!wantBack) {
      await tx.query(insert, params)
      return { status: 201, body: null }
    }
    const cols = await selectList(db, name, 't0', select, params)
    return finishWrite(tx, insert, cols, params, single, 201)
  }

  if (req.method === 'PATCH') {
    const values = rows[0] ?? {}
    const keys = Object.keys(values)
    for (const key of keys) if (!known.includes(key)) throw new RestError('42703', `column ${key} does not exist`)
    params.push(JSON.stringify(values))
    const sets = keys
      .map((k) => `${quote(k)} = (json_populate_record(null::public.${quote(name)}, $1::json)).${quote(k)}`)
      .join(', ')
    const where = whereClause('t0', req.search, params, known)
    const update = `update public.${quote(name)} t0 set ${sets}${where} returning t0.*`
    if (!wantBack) {
      await tx.query(update, params)
      return { status: 204, body: null }
    }
    const cols = await selectList(db, name, 't0', select, params)
    return finishWrite(tx, update, cols, params, single, 200)
  }

  if (req.method === 'DELETE') {
    const where = whereClause('t0', req.search, params, known)
    const remove = `delete from public.${quote(name)} t0${where} returning t0.*`
    if (!wantBack) {
      await tx.query(remove, params)
      return { status: 204, body: null }
    }
    const cols = await selectList(db, name, 't0', select, params)
    return finishWrite(tx, remove, cols, params, single, 200)
  }

  throw new RestError('PGRST000', `Method ${req.method} is not supported`)
}

// Turn rows into the JSON supabase-js expects: a list, or one object.
async function finish(
  tx: Tx,
  rowsSql: string,
  params: unknown[],
  single: boolean,
  headers: Record<string, string>,
  status = 200,
): Promise<Answer> {
  const result = await tx.query<{ body: string }>(
    `select coalesce(json_agg(x), '[]'::json)::text as body from (${rowsSql}) x`,
    params,
  )
  const body = result.rows[0].body
  const all = { 'content-type': 'application/json', ...headers }
  if (!single) return { status, headers: all, body }
  const list = JSON.parse(body) as unknown[]
  if (list.length !== 1) {
    throw new RestError('PGRST116', `JSON object requested, multiple (or no) rows returned`)
  }
  return { status, headers: all, body: JSON.stringify(list[0]) }
}

// A save that wants the saved rows back. PostgreSQL only allows a write
// inside WITH at the top of the statement, so the rows are built there.
async function finishWrite(
  tx: Tx,
  write: string,
  cols: string,
  params: unknown[],
  single: boolean,
  status: number,
): Promise<Answer> {
  const result = await tx.query<{ body: string }>(
    `with changed as (${write}), shaped as (select ${cols} from changed t0)
     select coalesce(json_agg(shaped), '[]'::json)::text as body from shaped`,
    params,
  )
  const body = result.rows[0].body
  const headers = { 'content-type': 'application/json' }
  if (!single) return { status, headers, body }
  const list = JSON.parse(body) as unknown[]
  if (list.length !== 1) throw new RestError('PGRST116', 'JSON object requested, multiple (or no) rows returned')
  return { status, headers, body: JSON.stringify(list[0]) }
}

// ===== 8. Database functions: rpc/<name> =====
async function rpc(tx: Tx, fns: Map<string, Fn[]>, req: Request2): Promise<Answer> {
  const name = req.path.slice(4)
  const choices = fns.get(name)
  if (!choices) throw new RestError('PGRST202', `Could not find the function public.${name}`)
  const args: Record<string, unknown> =
    req.method === 'GET' ? Object.fromEntries(req.search.entries()) : req.body ? JSON.parse(req.body) : {}
  const given = Object.keys(args)
  // The version whose named settings cover what was sent.
  const fn =
    choices.find(
      (f) => given.every((g) => f.args.includes(g)) && f.args.length - f.defaults <= given.length,
    ) ?? choices[0]
  const params: unknown[] = []
  const parts: string[] = []
  fn.args.forEach((arg, i) => {
    if (!(arg in args)) return
    const type = fn.types[i]
    const value = args[arg]
    if (value === null || value === undefined) {
      parts.push(`${quote(arg)} => null::${type}`)
      return
    }
    if (type === 'json' || type === 'jsonb') {
      params.push(JSON.stringify(value))
      parts.push(`${quote(arg)} => $${params.length}::${type}`)
    } else if (type.endsWith('[]')) {
      params.push(JSON.stringify(value))
      parts.push(`${quote(arg)} => array(select jsonb_array_elements_text($${params.length}::jsonb))::${type}`)
    } else {
      params.push(typeof value === 'object' ? JSON.stringify(value) : String(value))
      parts.push(`${quote(arg)} => $${params.length}::${type}`)
    }
  })
  const call = `public.${quote(name)}(${parts.join(', ')})`
  const sql = fn.set
    ? `select coalesce(json_agg(r), '[]'::json)::text as body from ${call} r`
    : `select to_json(${call})::text as body`
  const result = await tx.query<{ body: string | null }>(sql, params)
  const body = result.rows[0]?.body ?? 'null'
  const single = (req.headers.get('accept') ?? '').includes('vnd.pgrst.object')
  if (single && fn.set) {
    const list = JSON.parse(body) as unknown[]
    return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(list[0] ?? null) }
  }
  return { status: 200, headers: { 'content-type': 'application/json' }, body }
}
