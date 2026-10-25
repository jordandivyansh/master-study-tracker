#!/bin/bash
set -e
cd "$(dirname "$0")"
for p in /opt/homebrew/bin /usr/local/bin; do [ ! -d "$p" ] || PATH="$p:$PATH"; done
export PATH
[ -x .venv/bin/python ] || python3 -m venv .venv
.venv/bin/python -c 'import django,whitenoise' 2>/dev/null || .venv/bin/pip install -r requirements.txt
[ -d client/node_modules ] || npm ci --prefix client
if [ ! -f client/dist/index.html ] || [ -n "$(find client/src client/index.html -newer client/dist/index.html | head -1)" ]; then
  npm run build --prefix client
fi
.venv/bin/python backend/manage.py migrate --noinput
if ! .venv/bin/python backend/manage.py shell -c 'from django.contrib.auth import get_user_model; import sys; sys.exit(0 if any(u.has_usable_password() for u in get_user_model().objects.all()) else 1)' >/dev/null 2>&1; then
  .venv/bin/python backend/manage.py createsuperuser
fi
.venv/bin/python backend/manage.py seed_master
printf '\nMaster Study Tracker: http://127.0.0.1:8000\nKeep this window open. Press Ctrl+C to stop.\n'
( sleep 2; open http://127.0.0.1:8000 ) &
exec .venv/bin/python backend/manage.py runserver 127.0.0.1:8000
