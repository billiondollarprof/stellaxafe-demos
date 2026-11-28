# stellaxafe-demos

Hospital demos by StellaXafe Technologies Limited. One Cloudflare Worker
serves every demo; the address picks the folder in `sites/`.

| Demo | Address | Folder |
| --- | --- | --- |
| MASCAP Hospitals, website | https://mascap-web.stellaxafe.com | `sites/mascap-web/` |
| MASCAP Hospitals, app | https://mascap-app.stellaxafe.com | `sites/mascap-app/` (built by `apps/mascap-app/build.sh`) |

To try a demo on your own computer: `cd sites/mascap-web && python3 -m http.server 8090`,
then open http://127.0.0.1:8090.

## The app demos

`sites/<hospital>-app` is the real Rhema app, built from a clean copy with a
demo layer on top (`apps/<hospital>-app/`): a sign in page with one button per
role, and the real database (every Rhema migration) running in the visitor's
browser in PGlite with made up data. Nothing goes over the network; what a
visitor saves stays on their device. Rebuild after Rhema changes:

    apps/mascap-app/build.sh main
