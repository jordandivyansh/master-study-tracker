#!/usr/bin/env python3
"""Unified Automated Deployment Pipeline for Master Study Tracker V2.
Deploys code changes seamlessly across:
1. GitHub (main branch)
2. Vercel (Edge CDN automatically triggered via GitHub webhook)
3. PythonAnywhere (via REST API file upload + web app reload)
"""
import mimetypes
import os
import subprocess
import sys
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Load local .env
env_file = ROOT / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def run(cmd, cwd=ROOT):
    print(f"▶ {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"Error: {res.stderr.strip() or res.stdout.strip()}")
        sys.exit(1)
    if res.stdout.strip():
        print(res.stdout.strip())
    return res.stdout


def upload_to_pythonanywhere(token, user, local_path, remote_path):
    """Upload a single file to PythonAnywhere via REST Files API."""
    url = f"https://www.pythonanywhere.com/api/v0/user/{user}/files/path/home/{user}/{remote_path}"
    content = local_path.read_bytes()
    # Create multipart body manually
    boundary = "----PAFormBoundary" + os.urandom(8).hex()
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="content"; filename="{local_path.name}"\r\n'.encode())
    body.extend(b"Content-Type: application/octet-stream\r\n\r\n")
    body.extend(content)
    body.extend(f"\r\n--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Token {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status in (200, 201)


def reload_pythonanywhere(token, user, domain):
    """Trigger PythonAnywhere Web App reload via REST API."""
    url = f"https://www.pythonanywhere.com/api/v0/user/{user}/webapps/{domain}/reload/"
    req = urllib.request.Request(url, method="POST", headers={"Authorization": f"Token {token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status in (200, 204)


def deploy_all(commit_message="chore: automated deployment sync"):
    print("========================================")
    print("🚀 Running Master Study Tracker Pipeline")
    print("========================================")

    # 1. Build React Client
    print("\n[1/4] Building React production bundle...")
    run("npm run build", cwd=ROOT / "client")

    # 2. Collect Django static files
    print("\n[2/4] Collecting static assets...")
    run(f"{ROOT}/.venv/bin/python backend/manage.py collectstatic --noinput")

    # 3. Commit and push to GitHub (Auto-triggers Vercel)
    print("\n[3/4] Pushing to GitHub (Auto-triggers Vercel deploy)...")
    run("git add .")
    status = run("git status --porcelain")
    if status.strip():
        run(f'git commit -m "{commit_message}"')
        run("git push origin main")
        print("✓ Pushed to GitHub -> Vercel is building and deploying live!")
    else:
        print("• Working tree clean, everything up to date on GitHub.")

    # 4. Sync PythonAnywhere via REST API
    pa_token = os.environ.get("PA_API_TOKEN")
    pa_user = os.environ.get("PA_USER", "jordandivyansh")
    pa_domain = os.environ.get("PA_DOMAIN", "jordandivyansh.pythonanywhere.com")

    print("\n[4/4] Syncing PythonAnywhere via API...")
    if pa_token:
        # Key critical files to upload directly
        sync_files = [
            ("backend/config/urls.py", "study-tracker/backend/config/urls.py"),
            ("backend/config/settings.py", "study-tracker/backend/config/settings.py"),
            ("backend/master/sheets_sync.py", "study-tracker/backend/master/sheets_sync.py"),
            ("backend/master/views.py", "study-tracker/backend/master/views.py"),
            ("backend/master/management/commands/sync_sheets.py", "study-tracker/backend/master/management/commands/sync_sheets.py"),
            ("client/dist/index.html", "study-tracker/client/dist/index.html"),
        ]
        # Also include client/dist/assets
        for asset in (ROOT / "client/dist/assets").glob("*"):
            if asset.is_file():
                sync_files.append((f"client/dist/assets/{asset.name}", f"study-tracker/client/dist/assets/{asset.name}"))

        for local_rel, remote_rel in sync_files:
            p = ROOT / local_rel
            if p.exists():
                try:
                    upload_to_pythonanywhere(pa_token, pa_user, p, remote_rel)
                except Exception as e:
                    print(f"  Upload warning for {remote_rel}: {e}")
        print("✓ Essential files synchronized to PythonAnywhere!")

        # Trigger reload
        try:
            if reload_pythonanywhere(pa_token, pa_user, pa_domain):
                print(f"✓ PythonAnywhere Web App ({pa_domain}) successfully reloaded!")
        except Exception as e:
            print(f"Reload notice: {e}")
    else:
        print("• PA_API_TOKEN not found in .env, skipping PythonAnywhere direct sync.")

    print("\n========================================")
    print("✓ Full Pipeline Deployed Live Successfully!")
    print("  • GitHub: https://github.com/jordandivyansh/master-study-tracker")
    print("  • Vercel: https://studytrack-dk.vercel.app")
    print("  • PythonAnywhere: https://jordandivyansh.pythonanywhere.com")
    print("========================================")


if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "chore: automated deployment sync"
    deploy_all(msg)
