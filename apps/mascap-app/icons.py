# apps/mascap-app/icons.py: MASCAP's app icons from its logo.
#
# Why: the installed demo app shows MASCAP's own logo (request 262).
# Usage: python3 icons.py <logo image> <web/brands/mascap folder>
import sys
from PIL import Image

# Read the round logo and the folder to write into.
logo_path, out = sys.argv[1], sys.argv[2]
logo = Image.open(logo_path).convert('RGBA')

# Each icon: the logo on white, a little inside the edge.
def icon(size, margin, name):
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    inner = int(size * (1 - 2 * margin))
    canvas.paste(logo.resize((inner, inner), Image.LANCZOS), ((size - inner) // 2,) * 2, logo.resize((inner, inner), Image.LANCZOS))
    canvas.convert('RGB').save(f'{out}/{name}')

icon(192, 0.04, 'icon-192.png')
icon(512, 0.04, 'icon-512.png')
icon(512, 0.14, 'icon-maskable-512.png')
icon(180, 0.06, 'apple-touch-icon.png')
# The logo on screens: the round logo itself.
logo.resize((256, 256), Image.LANCZOS).save(f'{out}/logo.webp', 'WEBP', quality=92)

# The installed app's name and colours: MASCAP Hospitals, navy.
import json
manifest_path = f'{out}/manifest.webmanifest'
manifest = json.load(open(manifest_path))
manifest['name'] = 'MASCAP Hospitals'
manifest['short_name'] = 'MASCAP'
manifest['description'] = 'MASCAP Hospitals: hospital app (demo by StellaXafe)'
manifest['background_color'] = '#0d1b3d'
manifest['theme_color'] = '#0d1b3d'
json.dump(manifest, open(manifest_path, 'w'), indent=2)
