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
    const folder = folderFor(url.hostname)
    let path = url.pathname
    if (path.endsWith('/')) path += 'index.html'
    const target = new URL(folder ? `/${folder}${path}` : '/index.html', url.origin)
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
    return out
  },
}
