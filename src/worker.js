/*
 * src/worker.js: one Cloudflare Worker for every StellaXafe hospital demo.
 *
 * Why: Anthony, 2026-11-27 (request 262): "any hospital that we are doing
 * demo for, we just show them on that same StellaXafe". Each demo is a
 * folder under sites/, and the address picks the folder:
 *   mascap-web.stellaxafe.com  ->  sites/mascap-web/
 *   mascap-app.stellaxafe.com  ->  sites/mascap-app/
 * A new hospital is a new folder plus its two addresses in wrangler.jsonc.
 *
 * Never: hold a secret, call a database or keep anything a visitor types.
 * Every demo is plain files with made up data. Every answer carries
 * "noindex", so no demo shows up on Google.
 */

// ===== 1. The address decides the folder =====
// "mascap-web.stellaxafe.com" -> "mascap-web". Anything else (the
// workers.dev address) shows the list of demos.
function folderFor(host) {
  const first = host.split('.')[0]
  return /^[a-z0-9-]+$/.test(first) && host.endsWith('.stellaxafe.com') ? first : null
}

// ===== 2. Serve the file from that folder =====
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    // On a computer (wrangler dev), LOCAL_FOLDER picks the demo instead.
    const folder = env.LOCAL_FOLDER || folderFor(url.hostname)
    // The app demos ask the server for the time (the real app's Worker does
    // this). Everything else under /api/ is not part of a demo.
    if (url.pathname === '/api/time') {
      return Response.json({ now: Date.now() }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
    }
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not part of the demo' }, { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
    }
    let path = url.pathname
    if (path.endsWith('/')) path += 'index.html'
    const target = new URL(folder ? `/${folder}${path}` : '/index.html', url.origin)
    // The database engine's data file is stored compressed (6.3 MB as
    // 1.9 MB) and sent as it is, with the header that tells the browser.
    if (folder && path.endsWith('/demo/pglite/pglite.data')) {
      const packed = await env.ASSETS.fetch(new Request(new URL(`/${folder}${path}.gz`, url.origin), request))
      if (packed.ok) {
        return new Response(packed.body, {
          encodeBody: 'manual',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'gzip',
            'Cache-Control': 'public, max-age=86400',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        })
      }
    }
    let response = await env.ASSETS.fetch(new Request(target, request))
    // An address inside the demo that is not a file gets the demo's page.
    if (response.status === 404 && folder) {
      response = await env.ASSETS.fetch(new Request(new URL(`/${folder}/index.html`, url.origin), request))
    }
    const out = new Response(response.body, response)
    out.headers.set('X-Robots-Tag', 'noindex, nofollow')
    out.headers.set('X-Content-Type-Options', 'nosniff')
    out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    out.headers.set('X-Frame-Options', 'SAMEORIGIN')
    // The demo's big files are kept by the browser for a day, so the app
    // never downloads them twice while a visitor looks around.
    if (path.includes('/demo/')) out.headers.set('Cache-Control', 'public, max-age=86400')
    return out
  },
}
