import json
import re
from functools import wraps
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.cache import cache
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import IntegrityError, transaction
from django.http import JsonResponse, HttpResponse, FileResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import Document
from .storage import COLLECTIONS, documents, settings_for, seed_user, create_document
from .schema import validate, natural_key, iso
from .calc import (STREAMS, attach_actuals, derive_day, derive_test, derive_backlog, derive_module, derive_area,
                   derive_entry, start_summary, find_week, current_streak, days_between, add_days, date_range, weekday)


def error(message, status=400):
    return JsonResponse({'error': message}, status=status)


def body(request):
    value = json.loads(request.body or b'{}')
    if not isinstance(value, dict):
        raise ValidationError('Expected a JSON object.')
    return value


def api(fn):
    @wraps(fn)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            response = error('Please sign in to continue.', 401)
        else:
            try:
                response = fn(request, *args, **kwargs)
            except ValidationError as exc:
                response = error('; '.join(exc.messages))
            except (ValueError, TypeError, KeyError, UnicodeDecodeError):
                response = error('Please check the submitted values.')
            except ObjectDoesNotExist:
                response = error('Not found.', 404)
            except IntegrityError:
                response = error('A record with these details already exists.', 409)
        response['Cache-Control'] = 'no-store'
        return response
    return wrapped


def today():
    return timezone.localdate().isoformat()


@require_http_methods(['GET'])
def session_view(request):
    response = JsonResponse({'authenticated': request.user.is_authenticated,
                             'username': request.user.username if request.user.is_authenticated else None,
                             'csrf': get_token(request)})
    response['Cache-Control'] = 'no-store'
    return response


@require_http_methods(['POST'])
def login_view(request):
    try:
        data = body(request)
        key = 'master-login:' + request.META.get('REMOTE_ADDR', '')
        failures = cache.get(key, 0)
        if failures >= 10:
            return error('Too many sign-in attempts. Please wait 15 minutes.', 429)
        username, password = data.get('username'), data.get('password')
        if not isinstance(username, str) or not isinstance(password, str):
            return error('Enter your username and password.')
        user = authenticate(request, username=username, password=password)
        if user is None:
            cache.set(key, failures + 1, 900)
            return error('Username or password is incorrect.')
        cache.delete(key)
        seed_user(user)
        login(request, user)
        response = JsonResponse({'authenticated': True, 'username': user.username, 'csrf': get_token(request)})
        response['Cache-Control'] = 'no-store'
        return response
    except (ValueError, TypeError, ValidationError):
        return error('Check your username and password.')


@require_http_methods(['POST'])
def logout_view(request):
    logout(request)
    return JsonResponse({'authenticated': False, 'csrf': get_token(request)})


@require_http_methods(['GET'])
def health(request):
    return JsonResponse({'ok': True})


def csrf_failure(request, reason=''):
    return error('Your session needs refreshing. Reload the page and try again.', 403)


def frontend(request, route=''):
    index = settings.MASTER_FRONTEND_DIST / 'index.html'
    if not index.exists():
        return HttpResponse('Build the frontend with npm run build.', status=503, content_type='text/plain')
    response = FileResponse(index.open('rb'), content_type='text/html')
    response['Cache-Control'] = 'no-store'
    return response


@api
@require_http_methods(['GET', 'PUT'])
def settings_view(request):
    if request.method == 'PUT':
        with transaction.atomic():
            doc = Document.objects.select_for_update().get(owner=request.user, collection='settings')
            doc.data = validate('settings', body(request), doc.data)
            doc.save(update_fields=['data', 'updated_at'])
    return JsonResponse(settings_for(request.user))


@api
@require_http_methods(['GET', 'PUT', 'DELETE'])
def daily(request, day=None):
    s = settings_for(request.user)
    if day is not None:
        iso(day)
        if request.method == 'DELETE':
            Document.objects.filter(owner=request.user, collection='dailyLogs', natural_key=day).delete()
            return HttpResponse(status=204)
        if request.method != 'PUT':
            return error('Method not allowed.', 405)
        with transaction.atomic():
            doc = Document.objects.select_for_update().filter(owner=request.user, collection='dailyLogs', natural_key=day).first()
            data = validate('dailyLogs', {**body(request), 'date': day}, doc.data if doc else None)
            if doc:
                doc.data = data
                doc.save(update_fields=['data', 'updated_at'])
            else:
                doc = create_document(request.user, 'dailyLogs', data)
        return JsonResponse({**derive_day(doc.export(), s), 'day': weekday(day), 'logged': True})
    if request.method != 'GET':
        return error('Method not allowed.', 405)
    start = iso(request.GET.get('from', s['trackerStart']))
    end = iso(request.GET.get('to', s['trackerEnd']))
    if not 0 <= days_between(start, end) <= 3660:
        return error('Choose a date range of at most ten years.')
    logs = {d['date']: d for d in documents(request.user, 'dailyLogs') if start <= d['date'] <= end}
    rows = []
    for d in date_range(start, end):
        log = logs.get(d, dict(date=d, hours={}, dsa=None, gym=None, weight=None, notes=''))
        rows.append({**derive_day(log, s), 'day': weekday(d), 'logged': d in logs})
    return JsonResponse({'today': today(), 'cap': s['dailyCap'], 'rows': rows})


ROUTES = {'weeks': 'weeks', 'tests': 'tests', 'backlog': 'backlog', 'apfc/modules': 'apfcModules', 'apfc/areas': 'syllabusAreas', 'apfc/entries': 'courseEntries', 'cava': 'cavaLectures', 'pyqs': 'pyqWorkbooks'}


def derive(collection, rows, user):
    if collection == 'weeks':
        return attach_actuals(rows, documents(user, 'dailyLogs'), settings_for(user))
    s = settings_for(user) if collection in ('tests', 'backlog') else None
    fn = {'tests': lambda t: derive_test(t, s, today()),
          'backlog': lambda b: derive_backlog(b, s),
          'apfcModules': derive_module, 'syllabusAreas': derive_area, 'courseEntries': derive_entry,
          'cavaLectures': lambda c: c,
          'pyqWorkbooks': lambda p: p}[collection]
    return [fn(row) for row in rows]


@api
@require_http_methods(['GET', 'POST', 'PATCH', 'DELETE'])
def resource(request, resource, uid=None):
    collection = ROUTES[resource]
    if uid is not None:
        if request.method not in ('PATCH', 'DELETE'):
            return error('Method not allowed.', 405)
        with transaction.atomic():
            doc = Document.objects.select_for_update().get(owner=request.user, collection=collection, uid=uid)
            if request.method == 'DELETE':
                doc.delete()
                return HttpResponse(status=204)
            doc.data = validate(collection, body(request), doc.data)
            doc.natural_key = natural_key(collection, doc.data, doc.uid)
            doc.save(update_fields=['data', 'natural_key', 'updated_at'])
        return JsonResponse(derive(collection, [doc.export()], request.user)[0])
    if request.method == 'POST':
        with transaction.atomic():
            doc = create_document(request.user, collection, body(request))
        return JsonResponse(derive(collection, [doc.export()], request.user)[0], status=201)
    if request.method != 'GET':
        return error('Method not allowed.', 405)
    rows = documents(request.user, collection)
    if collection == 'tests':
        if request.GET.get('exam'):
            rows = [r for r in rows if r['exam'] == request.GET['exam']]
        rows.sort(key=lambda r: (r.get('targetAttempt') or '', r['code']))
    elif collection == 'backlog':
        rows.sort(key=lambda r: r.get('order') or 0)
    elif collection in ('apfcModules', 'syllabusAreas'):
        rows.sort(key=lambda r: r['num'])
    elif collection == 'courseEntries':
        for field in ['module', 'platformStatus', 'studyMode']:
            if request.GET.get(field):
                value = request.GET[field]
                rows = [r for r in rows if r.get(field) == (None if field == 'studyMode' and value == 'none' else value)]
        terms = request.GET.get('q', '').lower().split()
        if terms:
            rows = [r for r in rows if all(t in r['title'].lower() for t in terms)]
        rows.sort(key=lambda r: r['code'])
    return JsonResponse(derive(collection, rows, request.user), safe=False)


@api
@require_http_methods(['GET'])
def dashboard(request):
    t, user = today(), request.user
    s = settings_for(user)
    logs = sorted(documents(user, 'dailyLogs'), key=lambda r: r['date'])
    weeks = attach_actuals(documents(user, 'weeks'), logs, s)
    tests = [derive_test(r, s, t) for r in documents(user, 'tests')]
    backlog = [derive_backlog(r, s) for r in sorted(documents(user, 'backlog'), key=lambda r: r.get('order') or 0)]
    by_date = {l['date']: derive_day(l, s) for l in logs}
    recent = []
    for i in range(13, -1, -1):
        d = add_days(t, -i)
        row = by_date.get(d, {})
        recent.append(dict(date=d, day=weekday(d), study=row.get('examStudy'), dsa=row.get('dsa')))
    weights = [dict(date=l['date'], weight=l['weight']) for l in logs if l.get('weight') is not None]
    horizon = add_days(t, 7)
    due = [x for x in tests if x['workflow'] != 'Done' and (x['attemptOverdue'] or x['reviewOverdue'] or (x.get('targetAttempt') and x['targetAttempt'] <= horizon))]
    due.sort(key=lambda x: x.get('targetAttempt') or x.get('targetReview') or '')
    exams = sorted([{**e, 'daysLeft': days_between(t, e['date'])} for e in s['exams']], key=lambda e: e['date'])
    groups = {}
    for x in tests:
        g = groups.setdefault(x['exam'], dict(total=0, done=0, reviewPending=0, overdue=0))
        g['total'] += 1
        g['done'] += x['workflow'] == 'Done'
        g['reviewPending'] += x['workflow'] == 'Review pending'
        g['overdue'] += x['attemptOverdue'] or x['reviewOverdue']
    modules = documents(user, 'apfcModules')
    areas = documents(user, 'syllabusAreas')
    return JsonResponse(dict(today=t, settings=s, streams=STREAMS, summary=start_summary(s, weeks, tests, backlog),
                             exams=exams, currentWeek=find_week(weeks, t), todayLog=by_date.get(t, derive_day({'date': t, 'hours': {}}, s)),
                             recent=recent, weights=weights, latestWeight=weights[-1] if weights else None,
                             streak=current_streak(logs, t, s), due=due[:12], testsByExam=groups, backlog=backlog,
                             apfc=dict(items=sum(m.get('items') or 0 for m in modules), platformComplete=sum(m.get('platformComplete') or 0 for m in modules),
                                       cyclesComplete=sum(derive_area(a)['learningCycle'] == 'Cycle complete' for a in areas), areas=len(areas)),
                             tracker=dict(start=s['trackerStart'], end=s['trackerEnd'], elapsed=days_between(s['trackerStart'], t), total=days_between(s['trackerStart'], s['trackerEnd']))))


@api
@require_http_methods(['GET'])
def backup(request):
    data = {'exportedAt': timezone.now().isoformat(), 'version': 1}
    for collection in COLLECTIONS:
        rows = documents(request.user, collection)
        data[collection] = rows
    response = JsonResponse(data)
    response['Content-Disposition'] = f'attachment; filename="study-tracker-backup-{today()}.json"'
    return response


@api
@require_http_methods(['POST'])
def restore(request):
    data = body(request)
    if type(data.get('version')) is not int or data['version'] != 1:
        return error('Choose a Master Study Tracker backup (version 1).')
    prepared = {}
    for collection in COLLECTIONS:
        raw = data.get(collection)
        if collection == 'settings' and isinstance(raw, dict):
            raw = [raw]
        if not isinstance(raw, list) or len(raw) > 10000:
            return error(f'The backup has missing or invalid {collection}.')
        if collection == 'settings' and len(raw) != 1:
            return error('The backup needs exactly one settings record.')
        rows, keys = [], set()
        for item in raw:
            row = validate(collection, item)
            key = natural_key(collection, row, f'row-{len(rows)}')
            if key in keys:
                return error(f'Duplicate record in {collection}.')
            keys.add(key)
            uid = item.get('_id')
            if uid is not None and (not isinstance(uid, str) or not re.fullmatch(r'[a-f0-9]{24}', uid)):
                return error('Invalid backup record ID.')
            rows.append((row, uid))
        prepared[collection] = rows
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        Document.objects.filter(owner=request.user).delete()
        for collection, rows in prepared.items():
            for row, uid in rows:
                # Preserve IDs when possible; never reuse an ID owned by another account.
                if uid and Document.objects.filter(uid=uid).exists():
                    uid = None
                create_document(request.user, collection, row, uid)
    return JsonResponse({'restored': {k: len(v) for k, v in prepared.items()}})


def unknown_api(request, route=''):
    return error('Unknown API route.', 404)
