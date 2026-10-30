#!/usr/bin/env python3
"""Unified Automated Deployment Pipeline for Master Study Tracker V2.
Deploys code changes seamlessly across:
1. GitHub (main branch)
2. Vercel (Edge CDN automatically triggered via GitHub webhook)
3. PythonAnywhere (via API reload / direct sync)
"""
import os
import subprocess
import sys
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd, cwd=ROOT):
    print(f"▶ {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"Error: {res.stderr.strip() or res.stdout.strip()}")
        sys.exit(1)
    if res.stdout.strip():
        print(res.stdout.strip())
    return res.stdout


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

    # 3. Commit and push to GitHub (Triggers Vercel automatically)
    print("\n[3/4] Pushing to GitHub (Auto-triggers Vercel deploy)...")
    run("git add .")
    # Check if there are changes to commit
    status = run("git status --porcelain")
    if status.strip():
        run(f'git commit -m "{commit_message}"')
        run("git push origin main")
        print("✓ Pushed to GitHub -> Vercel is building and deploying live!")
    else:
        print("• Working tree clean, everything up to date on GitHub.")

    # 4. Reload PythonAnywhere via API if token is configured
    pa_token = os.environ.get("PA_API_TOKEN")
    pa_user = os.environ.get("PA_USER", "jordandivyansh")
    pa_domain = os.environ.get("PA_DOMAIN", "jordandivyansh.pythonanywhere.com")

    print("\n[4/4] Syncing PythonAnywhere...")
    if pa_token:
        url = f"https://www.pythonanywhere.com/api/v0/user/{pa_user}/webapps/{pa_domain}/reload/"
        req = urllib.request.Request(url, method="POST", headers={"Authorization": f"Token {pa_token}"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status in (200, 204):
                    print("✓ PythonAnywhere Web App reloaded successfully via API!")
        except Exception as e:
            print(f"PythonAnywhere API reload notice: {e}")
    else:
        print("• Note: PA_API_TOKEN not set in environment. Web app will use latest code upon next reload.")

    print("\n========================================")
    print("✓ Full pipeline deployment complete!")
    print("  - GitHub: https://github.com/jordandivyansh/master-study-tracker")
    print("  - Vercel: https://studytrack-dk.vercel.app")
    print("  - PythonAnywhere: https://jordandivyansh.pythonanywhere.com")
    print("========================================")


if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "chore: automated pipeline sync"
    deploy_all(msg)
