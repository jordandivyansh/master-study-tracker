"""The original workbook formulas, ported from server/src/lib/calc.js."""
import math
from datetime import date, timedelta

STREAMS = [{'key': key, 'label': label} for key, label in [
    ('ssc', 'SSC'), ('cat', 'CAT'), ('uppsc', 'UPPSC'), ('apfc', 'APFC'), ('cava', 'CAVA'),
    ('pubad', 'Pub Ad'), ('mains', 'Mains writing'), ('books', 'Books / revision'), ('other', 'Other study')]]
STREAM_KEYS = [s['key'] for s in STREAMS]


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def rnd(v, dp=2):
    return math.floor(v * 10 ** dp + 0.5) / 10 ** dp if is_num(v) else v


def map_round(obj):
    return {k: rnd(v) for k, v in obj.items()}


def sum_or_null(values):
    nums = [v for v in values if is_num(v)]
    return sum(nums) if nums else None


def days_between(a, b):
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def add_days(d, n):
    return (date.fromisoformat(d) + timedelta(days=n)).isoformat()


def weekday(d):
    return date.fromisoformat(d).strftime('%a')


def date_range(start, end):
    return [add_days(start, i) for i in range(days_between(start, end) + 1)]


def derive_day(log, settings):
    hours = log.get('hours') or {}
    study = sum_or_null([hours.get(k) for k in STREAM_KEYS])
    total = sum_or_null([study, log.get('dsa')])
    status = None if total is None else 'Over daily cap' if total > settings['dailyCap'] else 'In cap'
    return {**log, 'examStudy': rnd(study), 'studyPlusDsa': rnd(total), 'capStatus': status}


def week_capacity(w, s):
    days = days_between(w['start'], w['end']) + 1
    gross = days * s['dailyCap']
    dsa = days / 7 * s['dsaWeekly']
    after = max(0, gross - dsa)
    buffer = after * s['buffer']
    capacity = after - buffer
    planned = sum_or_null([(w.get('quotas') or {}).get(k) for k in STREAM_KEYS]) or 0
    spare = capacity - planned
    return dict(days=days, gross=gross, dsaQuota=dsa, afterDsa=after, bufferH=buffer, capacity=capacity, planned=planned, unallocated=spare, overload=max(0, -spare))


def attach_actuals(weeks, logs, settings):
    ordered_logs = sorted(logs, key=lambda l: l['date'])
    result, j = [], 0
    for w in sorted(weeks, key=lambda w: w['start']):
        while j < len(ordered_logs) and ordered_logs[j]['date'] < w['start']:
            j += 1
        days = []
        while j < len(ordered_logs) and ordered_logs[j]['date'] <= w['end']:
            days.append(derive_day(ordered_logs[j], settings))
            j += 1
        cap = week_capacity(w, settings)
        study = sum_or_null([d['examStudy'] for d in days])
        dsa = sum_or_null([d.get('dsa') for d in days])
        gym = sum_or_null([d.get('gym') for d in days])
        result.append({**w, **map_round(cap), 'actualStudy': rnd(study), 'actualDsa': rnd(dsa), 'actualGym': rnd(gym),
                       'actualByStream': {k: rnd(sum_or_null([(d.get('hours') or {}).get(k) for d in days])) for k in STREAM_KEYS},
                       'actualVsPlan': None if study is None else rnd(study - cap['planned']),
                       'actualVsGross': None if study is None or dsa is None else rnd(study + dsa - cap['gross']),
                       'daysLogged': sum(d['studyPlusDsa'] is not None for d in days)})
    return result


def find_week(weeks, today):
    return next((w for w in weeks if w['start'] <= today <= w['end']), None)


def derive_test(t, s, today):
    dur = s.get('durations', {}).get(t['exam'], {'attempt': 0, 'review': 0})
    attempted, reviewed = t.get('attemptStatus') == 'Attempted', t.get('reviewStatus') == 'Reviewed'
    remain = 0 if attempted and reviewed else dur['review'] if attempted else dur['attempt'] + dur['review']
    maximum, score = t.get('maxScore'), t.get('score')
    pct = score / maximum if is_num(maximum) and maximum > 0 and is_num(score) else None
    return {**t, 'attemptH': dur['attempt'], 'reviewH': dur['review'], 'remainingH': remain,
            'workflow': 'Done' if attempted and reviewed else 'Review pending' if attempted else 'Pending',
            'scorePct': rnd(pct, 4), 'released': not t.get('release') or t['release'] <= today,
            'attemptOverdue': not attempted and bool(t.get('targetAttempt')) and t['targetAttempt'] < today,
            'reviewOverdue': not reviewed and bool(t.get('targetReview')) and t['targetReview'] < today}


def derive_backlog(b, s):
    hpu = s['cava']['hoursPerLecture'] if b.get('hoursPerUnitFromCava') else b.get('hoursPerUnit')
    total, done = b.get('totalUnits'), b.get('completedUnits') or 0
    remaining = max(0, total - done) * hpu if is_num(total) and is_num(hpu) else None
    progress = done / total if is_num(total) and total > 0 else b.get('progressOverride')
    return {**b, 'effectiveHoursPerUnit': hpu, 'remainingH': remaining, 'progress': rnd(progress, 4)}


def derive_module(m):
    return {**m, 'itemsRemaining': max(0, (m.get('items') or 0) - (m.get('platformComplete') or 0)),
            'hoursRemaining': max(0, m['selectedStudyH'] - (m.get('hoursDone') or 0)) if is_num(m.get('selectedStudyH')) else None}


def derive_entry(e):
    return {**e, 'hoursRemaining': max(0, e['selectedStudyH'] - (e.get('hoursDone') or 0)) if is_num(e.get('selectedStudyH')) else None}


def derive_area(a):
    complete = a.get('firstCoverage') and (a.get('questionsReviewed') or 0) > 0 and a.get('errorsCorrected') and a.get('recallChecked')
    return {**a, 'learningCycle': 'Cycle complete' if complete else 'Pending'}


def start_summary(s, weeks, tests, backlog):
    pivot = next((e['date'] for e in s['exams'] if e['key'] == s['pivotExam']), None)
    pre = [w for w in weeks if pivot and w['end'] < pivot]
    post = [w for w in weeks if pivot and w['start'] >= pivot]
    def total(ws, key):
        return sum(week_capacity(w, s)[key] for w in ws)
    cava = next((b for b in backlog if 'cava opening' in b['workstream'].lower()), {})
    return map_round(dict(prePlanned=total(pre, 'planned'), preCapacity=total(pre, 'capacity'),
                          preUnallocated=total(pre, 'capacity')-total(pre, 'planned'),
                          postPlanned=total(post, 'planned'), postCapacity=total(post, 'capacity'),
                          postUnallocated=total(post, 'capacity')-total(post, 'planned'),
                          availablePerDay=max(0, s['dailyCap']-s['dsaWeekly']/7)*(1-s['buffer']),
                          testsRemainingH=sum(t['remainingH'] for t in tests), testsDone=sum(t['workflow']=='Done' for t in tests),
                          testsTotal=len(tests), openingCavaH=cava.get('remainingH'), weightToGoal=s['weight']['start']-s['weight']['target'],
                          plannedByStream={k: rnd(sum((w.get('quotas') or {}).get(k) or 0 for w in weeks)) for k in STREAM_KEYS}))


def current_streak(logs, today, settings):
    by_date = {l['date']: derive_day(l, settings) for l in logs}
    def positive(d):
        return (by_date.get(d, {}).get('studyPlusDsa') or 0) > 0
    d, count = today if positive(today) else add_days(today, -1), 0
    while positive(d):
        count += 1
        d = add_days(d, -1)
    return count
