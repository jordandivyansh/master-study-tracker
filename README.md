# Master Study Tracker — final version

The final tracker uses the new project's React interface and starting data. Django and SQLite provide the backend on the existing PythonAnywhere installation. Existing accounts remain valid. Old tracker records are preserved in their original tables and a private deployment snapshot; the final tracker starts fresh.

## Screens and starting data

Dashboard, Daily log, Weekly plan, Tests, CSE backlog, APFC course, Settings and an updated developer guide. The new plan contains 23 planning periods, 59 tests, 11 backlog rows, 29 APFC modules, 9 syllabus areas and 377 course entries. Daily history starts empty. Capacity and exam dates are the original project's editable inputs.

All old addresses (`/simple/`, `/beta-version/`, `/v2/`, `/v3/`) redirect to `/`. `/dev-guide` redirects to `/guide`.

## Run locally

Double-click `start.command`. It installs dependencies if needed, builds the client, migrates the local SQLite database and asks you to create a local account if none exists. Open http://127.0.0.1:8000 and sign in. Your hosted account and database remain separate from local use. Local data lives at `backend/db.sqlite3`; the signing secret is `backend/.local-secret`.

Requires Python 3.10+ and Node 18.18+ for the build. Production serves compiled React assets and requires no Node or MongoDB process.

## Verify

```sh
npm run build --prefix client
.venv/bin/python backend/manage.py test master
.venv/bin/python scripts/check_parity.py
```

The parity check compares Python against the original JavaScript calculations across all seeded records, 40 daily logs with blanks and zeros, 20 test-workflow cases, weekly actuals and dashboard summaries. `server/src` retains the original reference implementation; it is not the deployed runtime.

## Backups

Settings → Download backup exports the final tracker in the original Master Study Tracker JSON format. Restore validates every collection and replaces only the signed-in account's final records in one transaction. Existing Study Studio V1/V2/V3 exports use another format and are not imported.

## Deploy over the existing PythonAnywhere app

Build the client and run `.venv/bin/python deploy/package_final.py`. Upload the release ZIP through PythonAnywhere Files, extract it into a separate release folder, then run:

```sh
python3.13 master-study-final-release/deploy/apply_final.py
```

The installer verifies all release hashes, saves a private consistent SQLite snapshot and prior code under `~/.local/share/study-studio/pre-final-TIMESTAMP`, adds the new app's tables, initializes each existing account from the new project data, collects static files, and checks the final APIs. It verifies that the old tracker, studio and account table fingerprints have not changed. Existing production secrets and login credentials remain in place. Reload the web app only after these checks pass.

If a check fails, prior routing and settings are restored before reload. For rollback after successful deployment, restore `backend/config/settings.py` and `backend/config/urls.py` from that private snapshot and reload the web app; the original app's records were not modified. Do not delete the old database tables or the private snapshot.
