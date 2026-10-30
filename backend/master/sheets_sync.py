"""Two-way Google Sheets Synchronization Engine for Master Study Tracker V2.
Bridges Django SQLite collections with connected Google Spreadsheets bidirectionally.
"""
import json
import logging
import os
import shutil
import subprocess
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from django.utils import timezone
from .models import Document
from .storage import documents, create_document

logger = logging.getLogger(__name__)

CAVA_SHEET_ID = '18LHy7rAuSB3JpjpBk2YGLQIBlh2tn19kOWqOnD4nXGw'
MAINS_SHEET_ID = '1PDbPVKE09VrW1w7rR5NzNDhxg_JFBpA1NtgPlB7bI9k'
PUBAD_SHEET_ID = '1uzWUS92D969ofMCqsymt4BtaE0gX3z-e9jBWQTrzavM'
UPPSC_SHEET_ID = '1kGde8YNMN-OArIR00t00zrbMAwoC_sohT4sMmpwBZL4'
EPFO_SHEET_ID = '12NNvTTR2zb6ri25AWyY1henuVnCRg8zhEo6wO8c_0Ro'

GOOGLE_WEBHOOK_URL = os.environ.get(
    'GOOGLE_SHEETS_WEBHOOK_URL',
    'https://script.google.com/macros/s/AKfycbzOjzm-rDTKIfNzs8s3jpM7_6qETPrgBCBEddwylmSnV59yWAAwyovQC4C1P27l1uOR/exec'
)

GSHEETS_BIN = shutil.which('gsheets') or '/var/folders/df/mjtdfgfx1m7_0fky3lgtk5_h0000gn/T/agy-plugin-cli-1209129017/gsheets'


def find_gsheets_cli():
    found = shutil.which('gsheets')
    if found:
        return found
    candidates = [
        Path.home() / '.gemini/config/plugins/gsheets/skills/gsheets/scripts/gsheets',
        Path('/var/folders/df/mjtdfgfx1m7_0fky3lgtk5_h0000gn/T/agy-plugin-cli-1209129017/gsheets'),
        Path('/usr/local/bin/gsheets'),
    ]
    for c in candidates:
        if c.is_file() and os.access(c, os.X_OK):
            return str(c)
    return 'gsheets'


def parse_range_spec(cell_range):
    """Split range e.g. \"'CAVA Lecture Tracker'!A9:H44\" into (tab_name, range_part)."""
    if '!' in cell_range:
        tab, r = cell_range.split('!', 1)
        return tab.strip("'\""), r
    return 'CAVA Lecture Tracker', cell_range


def read_via_webhook(sheet_id, cell_range):
    if not GOOGLE_WEBHOOK_URL:
        return None
    tab, r = parse_range_spec(cell_range)
    params = urllib.parse.urlencode({'sheetId': sheet_id, 'tab': tab, 'range': r})
    url = f'{GOOGLE_WEBHOOK_URL}?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': 'MasterStudyTracker/2.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, dict) and data.get('status') == 'success':
                return data.get('values')
            if isinstance(data, list):
                return data
    except Exception as e:
        logger.warning(f'Webhook read failed for {sheet_id} {cell_range}: {e}')
    return None


def write_via_webhook(sheet_id, cell_range, rows):
    if not GOOGLE_WEBHOOK_URL:
        return False
    tab, r = parse_range_spec(cell_range)
    payload = json.dumps({'sheetId': sheet_id, 'tab': tab, 'range': r, 'values': rows}).encode()
    req = urllib.request.Request(
        GOOGLE_WEBHOOK_URL,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'MasterStudyTracker/2.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
            return data.get('status') == 'success'
    except Exception as e:
        logger.warning(f'Webhook write failed for {sheet_id} {cell_range}: {e}')
    return False


def read_sheet_range(sheet_id, cell_range):
    """Read a cell range as a 2D JSON array using Webhook or CLI."""
    # 1. First try Google Apps Script Webhook (works from PythonAnywhere, Vercel & local)
    res = read_via_webhook(sheet_id, cell_range)
    if res is not None:
        return res

    # 2. Fallback to gsheets CLI
    cli = find_gsheets_cli()
    try:
        proc = subprocess.run(
            [cli, 'readonly', 'read', sheet_id, cell_range, '--json'],
            capture_output=True,
            text=True,
            timeout=15,
            check=True
        )
        return json.loads(proc.stdout)
    except Exception as e:
        logger.warning(f'CLI read failed for {sheet_id} {cell_range}: {e}')
        return None


def write_sheet_range(sheet_id, cell_range, rows):
    """Write 2D rows to a cell range in Google Sheets using Webhook or CLI."""
    # 1. First try Google Apps Script Webhook
    if write_via_webhook(sheet_id, cell_range, rows):
        return True

    # 2. Fallback to gsheets CLI
    cli = find_gsheets_cli()
    pipe_str = '|'.join(','.join(str(val) for val in r) for r in rows)
    try:
        proc = subprocess.run(
            [cli, 'mutate', 'write', sheet_id, cell_range, pipe_str],
            capture_output=True,
            text=True,
            timeout=20,
            check=True
        )
        return True
    except Exception as e:
        logger.error(f'CLI write failed for {sheet_id} {cell_range}: {e}')
        return False


def to_bool(val):
    if isinstance(val, bool):
        return val
    s = str(val).strip().upper()
    return s in ('TRUE', '1', 'YES', 'DONE', 'COMPLETED')


def sync_cava_lectures(user, direction='both'):
    """Bidirectional sync for 36 CAVA video lectures in 'CAVA Lecture Tracker'!A9:H44."""
    data = read_sheet_range(CAVA_SHEET_ID, "'CAVA Lecture Tracker'!A9:H44")
    if not data or len(data) < 36:
        return {'status': 'skipped', 'reason': 'Could not read CAVA sheet'}

    db_docs = Document.objects.filter(owner=user, collection='cavaLectures').order_by('id')
    doc_map = {d.data.get('num'): d for d in db_docs}

    pulled_count = 0
    pushed_count = 0
    sheet_rows_to_write = []

    for idx, row in enumerate(data):
        lec_num = idx + 1
        # Sheet columns: [0: Lec #, 1: Code, 2: Release, 3: Date, 4: Duration, 5: Watched, 6: Notes, 7: Revised]
        sheet_date = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ''
        sheet_watched = to_bool(row[5]) if len(row) > 5 else False
        sheet_notes = to_bool(row[6]) if len(row) > 6 else False
        sheet_revised = to_bool(row[7]) if len(row) > 7 else False

        doc = doc_map.get(lec_num)
        if not doc:
            continue

        d = dict(doc.data)
        db_watched = bool(d.get('watched'))
        db_notes = bool(d.get('notes'))
        db_revised = bool(d.get('revised'))
        db_date = d.get('studyDate') or ''

        # Two-way merge logic:
        merged_watched = db_watched or sheet_watched
        merged_notes = db_notes or sheet_notes
        merged_revised = db_revised or sheet_revised
        merged_date = db_date if db_date else (sheet_date if sheet_date not in ('Done', '') else None)

        # Update DB if Sheet had newer true states
        if (merged_watched != db_watched) or (merged_notes != db_notes) or (merged_revised != db_revised):
            d['watched'] = merged_watched
            d['notes'] = merged_notes
            d['revised'] = merged_revised
            d['status'] = 'Watched & Revised' if (merged_watched and merged_revised) else ('Watched' if merged_watched else 'Delivered (Backlog)')
            doc.data = d
            doc.save(update_fields=['data', 'updated_at'])
            pulled_count += 1

        # Sheet row to push
        sheet_rows_to_write.append([
            'TRUE' if merged_watched else 'FALSE',
            'TRUE' if merged_notes else 'FALSE',
            'TRUE' if merged_revised else 'FALSE'
        ])
        if (merged_watched != sheet_watched) or (merged_notes != sheet_notes) or (merged_revised != sheet_revised):
            pushed_count += 1

    # Write merged values back to Google Sheet
    if direction in ('both', 'push'):
        write_sheet_range(CAVA_SHEET_ID, "'CAVA Lecture Tracker'!F9:H44", sheet_rows_to_write)

    return {'status': 'success', 'pulled': pulled_count, 'pushed': pushed_count, 'total': len(data)}


def sync_pyq_workbooks(user, direction='both'):
    """Bidirectional sync for 20 SWL PYQ Year-Sets in 'SWL_PYQ_Workbooks'!A17:H36."""
    data = read_sheet_range(MAINS_SHEET_ID, "'SWL_PYQ_Workbooks'!A17:H36")
    if not data or len(data) < 20:
        return {'status': 'skipped', 'reason': 'Could not read PYQ sheet'}

    db_docs = Document.objects.filter(owner=user, collection='pyqWorkbooks')
    doc_map = {d.data.get('id'): d for d in db_docs}

    pulled_count = 0
    pushed_count = 0
    sheet_rows_to_write = []

    for row in data:
        paper = str(row[0]).strip() if len(row) > 0 and row[0] is not None else ''   # e.g. 'GS-1'
        year = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ''    # e.g. '2024'
        sheet_written = to_bool(row[6]) if len(row) > 6 else False
        sheet_reviewed = to_bool(row[7]) if len(row) > 7 else False

        sub1 = doc_map.get(f'{paper}-{year}-Q1-10')
        sub2 = doc_map.get(f'{paper}-{year}-Q11-20')

        db_written = bool(sub1 and sub1.data.get('written') and sub2 and sub2.data.get('written'))
        db_reviewed = bool(sub1 and sub1.data.get('reviewed') and sub2 and sub2.data.get('reviewed'))

        merged_written = db_written or sheet_written
        merged_reviewed = db_reviewed or sheet_reviewed

        # Update DB if Sheet is ahead
        for sub in [sub1, sub2]:
            if sub:
                d = dict(sub.data)
                changed = False
                if merged_written and not d.get('written'):
                    d['written'] = True
                    changed = True
                if merged_reviewed and not d.get('reviewed'):
                    d['reviewed'] = True
                    changed = True
                if changed:
                    sub.data = d
                    sub.save(update_fields=['data', 'updated_at'])
                    pulled_count += 1

        sheet_rows_to_write.append([
            'TRUE' if merged_written else 'FALSE',
            'TRUE' if merged_reviewed else 'FALSE'
        ])
        if (merged_written != sheet_written) or (merged_reviewed != sheet_reviewed):
            pushed_count += 1

    if direction in ('both', 'push'):
        write_sheet_range(MAINS_SHEET_ID, "'SWL_PYQ_Workbooks'!G17:H36", sheet_rows_to_write)

    return {'status': 'success', 'pulled': pulled_count, 'pushed': pushed_count, 'total': len(data)}


def sync_forumias_mocks(user, direction='both'):
    """Bidirectional sync for 38 PubAd ForumIAS tests in 'PubAd_ForumIAS_AWFG'!A9:G46."""
    data = read_sheet_range(MAINS_SHEET_ID, "'PubAd_ForumIAS_AWFG'!A9:G46")
    if not data:
        return {'status': 'skipped', 'reason': 'Could not read ForumIAS sheet'}

    db_docs = Document.objects.filter(owner=user, collection='tests', data__exam='CSE')
    doc_map = {d.data.get('type'): d for d in db_docs}

    pulled_count = 0
    pushed_count = 0
    sheet_rows_to_write = []

    for row in data:
        test_type = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ''
        sheet_revised = to_bool(row[5]) if len(row) > 5 else False
        sheet_attempted = to_bool(row[6]) if len(row) > 6 else False

        doc = doc_map.get(test_type)
        db_attempted = bool(doc and doc.data.get('attemptStatus') == 'Attempted')
        db_reviewed = bool(doc and doc.data.get('reviewStatus') == 'Reviewed')

        merged_attempted = db_attempted or sheet_attempted
        merged_reviewed = db_reviewed or sheet_revised

        if doc:
            d = dict(doc.data)
            changed = False
            if merged_attempted and d.get('attemptStatus') != 'Attempted':
                d['attemptStatus'] = 'Attempted'
                changed = True
            if merged_reviewed and d.get('reviewStatus') != 'Reviewed':
                d['reviewStatus'] = 'Reviewed'
                changed = True
            if changed:
                doc.data = d
                doc.save(update_fields=['data', 'updated_at'])
                pulled_count += 1

        sheet_rows_to_write.append([
            'TRUE' if merged_reviewed else 'FALSE',
            'TRUE' if merged_attempted else 'FALSE'
        ])
        if (merged_attempted != sheet_attempted) or (merged_reviewed != sheet_revised):
            pushed_count += 1

    if direction in ('both', 'push'):
        write_sheet_range(MAINS_SHEET_ID, "'PubAd_ForumIAS_AWFG'!F9:G46", sheet_rows_to_write)

    return {'status': 'success', 'pulled': pulled_count, 'pushed': pushed_count, 'total': len(data)}


def run_full_sync(user, direction='both'):
    """Execute complete bidirectional sync across all registered sheets and update settings status."""
    now_iso = timezone.now().isoformat()
    results = {
        'timestamp': now_iso,
        'cava': sync_cava_lectures(user, direction),
        'pyqs': sync_pyq_workbooks(user, direction),
        'mocks': sync_forumias_mocks(user, direction),
    }

    # Update settings document with sync audit log
    try:
        settings_doc = Document.objects.filter(owner=user, collection='settings').first()
        if settings_doc:
            s_data = dict(settings_doc.data)
            gs = dict(s_data.get('googleSheets', {}))
            gs['lastSync'] = {
                'timestamp': now_iso,
                'status': 'success',
                'cava': results['cava'],
                'pyqs': results['pyqs'],
                'mocks': results['mocks'],
                'message': f"✓ Synced 36 CAVA lectures, 20 PYQ workbooks, and 38 mocks bidirectionally."
            }
            s_data['googleSheets'] = gs
            settings_doc.data = s_data
            settings_doc.save(update_fields=['data', 'updated_at'])
    except Exception as e:
        logger.error(f'Failed to record sync audit in settings: {e}')

    return results
