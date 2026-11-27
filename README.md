# stellaxafe-demos

Hospital demos by StellaXafe Technologies Limited. One Cloudflare Worker
serves every demo; the address picks the folder in `sites/`.

| Demo | Address | Folder |
| --- | --- | --- |
| MASCAP Hospitals, website | https://mascap-web.stellaxafe.com | `sites/mascap-web/` |

To try a demo on your own computer: `cd sites/mascap-web && python3 -m http.server 8090`,
then open http://127.0.0.1:8090.
