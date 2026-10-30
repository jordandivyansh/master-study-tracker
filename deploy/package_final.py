import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
out = root.parent / 'outputs/Master_Study_Tracker_Final_Release.zip'
out.parent.mkdir(exist_ok=True)
files = []
for folder in ['backend/master', 'client/src', 'client/dist', 'scripts', 'server/src', 'server/test', 'deploy']:
    files += [p for p in (root / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc']
files += [root / 'backend/config/urls.py', root / 'backend/config/settings.py', root / 'vercel.json', root / 'client/package.json', root / 'client/package-lock.json', root / 'client/vite.config.js', root / 'client/index.html']
manifest = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))}
manifest['MASTER_README.md'] = hashlib.sha256((root / 'README.md').read_bytes()).hexdigest()
prefix = Path('master-study-final-release')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(set(files)):
        z.write(p, prefix / p.relative_to(root))
    z.write(root / 'README.md', prefix / 'MASTER_README.md')
    z.writestr(str(prefix / 'manifest.json'), json.dumps(manifest, indent=2))
with zipfile.ZipFile(out) as z:
    assert z.testzip() is None
print(f'Packaged {len(manifest)} files, {out.stat().st_size:,} bytes: {out}')
