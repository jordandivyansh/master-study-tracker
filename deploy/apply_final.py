"""Install the final tracker over all three interfaces, preserving existing accounts and old data."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess


def fingerprint(connection):
    names = [r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'tracker_%' OR name LIKE 'studio_%' OR name='auth_user') ORDER BY name")]
    result = {}
    for name in names:
        quoted = name.replace('"', '""')
        rows = connection.execute(f'SELECT * FROM "{quoted}" ORDER BY rowid').fetchall()
        result[name] = {'count': len(rows), 'sha256': hashlib.sha256(json.dumps(rows, default=str, ensure_ascii=False).encode()).hexdigest()}
    return result


def main():
    release = Path(__file__).resolve().parents[1]
    live = Path.home() / 'study-tracker'
    manifest = json.loads((release / 'manifest.json').read_text())
    allowed = ('backend/master/', 'client/', 'deploy/', 'scripts/', 'server/src/', 'server/test/')
    for name, digest in manifest.items():
        p = Path(name)
        if p.is_absolute() or '..' in p.parts or not (name.startswith(allowed) or name in ['backend/config/urls.py', 'MASTER_README.md']):
            raise SystemExit('Unsafe release filename: ' + name)
        if hashlib.sha256((release / p).read_bytes()).hexdigest() != digest:
            raise SystemExit('Release checksum failed: ' + name)
    config = json.loads((Path.home() / '.config/study-studio/production.json').read_text())
    database = Path(config['DATABASE_PATH'])
    python = Path.home() / '.virtualenvs/study-studio/bin/python'
    manage = live / 'deploy/manage_production.py'
    settings = live / 'backend/config/settings.py'
    if not all(p.is_file() for p in [database, python, manage, settings]):
        raise SystemExit('Existing installation not found. Nothing changed.')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup = database.parent / ('pre-final-' + stamp)
    backup.mkdir(mode=0o700)
    snapshot = backup / 'db.sqlite3'
    snapshot.touch(mode=0o600)
    with sqlite3.connect(database) as source, sqlite3.connect(snapshot) as target:
        source.backup(target)
        before = fingerprint(target)
    files = list(manifest) + ['backend/config/settings.py']
    absent = []
    for name in files:
        target = live / name
        if target.is_file():
            saved = backup / name
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, saved)
        else:
            absent.append(name)
    (backup / 'original-data-fingerprints.json').write_text(json.dumps(before, indent=2))
    (backup / 'new-files.json').write_text(json.dumps(absent, indent=2))
    print('Release checksums verified. Private database and code backup:', backup)
    for name in manifest:
        target = live / name
        target.parent.mkdir(parents=True, exist_ok=True)
        pending = target.with_name('.' + target.name + '.final-pending')
        shutil.copy2(release / name, pending)
        os.replace(pending, target)
    marker = '\n# Master Study Tracker final deployment\n'
    source = settings.read_text().split(marker)[0]
    source += marker + """INSTALLED_APPS = list(dict.fromkeys([*INSTALLED_APPS, 'master']))
MASTER_FRONTEND_DIST = BASE_DIR.parent / 'client' / 'dist'
STATICFILES_DIRS = [MASTER_FRONTEND_DIST / 'assets']
CSRF_FAILURE_VIEW = 'master.views.csrf_failure'
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
"""
    settings.write_text(source)
    try:
        for command in [('check',), ('migrate', '--noinput'), ('seed_master',), ('collectstatic', '--noinput'), ('verify_master',)]:
            subprocess.run([str(python), str(manage), *command], check=True)
        with sqlite3.connect(database) as connection:
            after = fingerprint(connection)
        if before != after:
            raise RuntimeError('An original account or old-data table changed unexpectedly.')
    except Exception:
        # Restore previous routing/configuration before a web reload can serve an incomplete release.
        for name in ['backend/config/settings.py', 'backend/config/urls.py']:
            shutil.copy2(backup / name, live / name)
        print('Deployment checks failed; previous routing restored. Private snapshot:', backup)
        raise
    (backup / 'deployment-complete.txt').write_text('All checks passed. Original accounts and data fingerprints unchanged.\n')
    print(f'Verified {len(before)} original tables unchanged. Final tracker starts from the new project data.')
    print('Ready: reload the existing web app, then verify /, /simple/, /beta-version/, /v2/ and /v3/.')


if __name__ == '__main__':
    main()
