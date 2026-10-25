"""Validate editable fields and ignore computed fields returned by the UI."""
from copy import deepcopy
from datetime import date
from django.core.exceptions import ValidationError
from .calc import STREAM_KEYS, is_num, days_between

EXAMS = ['UPPSC', 'SSC', 'CAT', 'APFC', 'CSE']
SCHEMAS = {
    'settings': dict(dailyCap='num', dsaWeekly='num', buffer='num', gymDaily='num', trackerStart='date', trackerEnd='date', exams='list', pivotExam='text', weight='obj', cava='obj', durations='obj'),
    'dailyLogs': dict(date='date', hours='hours', dsa='num', gym='num', weight='num', notes='text'),
    'weeks': dict(start='date', end='date', phase='text', quotas='hours', notes='text'),
    'tests': dict(code='text', exam='text', paper='text', type='text', release='date', targetAttempt='date', targetReview='date', attemptStatus='text', reviewStatus='text', actualAttempt='date', actualReview='date', maxScore='num', score='signed', notes='text'),
    'backlog': dict(order='num', workstream='text', unit='text', totalUnits='num', completedUnits='num', hoursPerUnit='num', hoursPerUnitFromCava='bool', progressOverride='num', status='text', deadline='date', notes='text', source='text'),
    'apfcModules': dict(num='num', module='text', items='num', platformComplete='num', attachmentBadges='num', priority='text', action='text', studyStatus='text', verifiedRuntimeH='num', selectedStudyH='num', hoursDone='num', notes='text'),
    'syllabusAreas': dict(num='num', area='text', firstCoverage='date', questionsReviewed='num', errorsCorrected='date', recallChecked='date', action='text'),
    'courseEntries': dict(code='text', module='text', title='text', type='text', platformStatus='text', displayedDuration='text', observedRuntimeH='num', studyMode='text', selectedStudyH='num', hoursDone='num', reviewStatus='text', notes='text'),
}
DEFAULTS = {
    'settings': {},
    'dailyLogs': dict(hours={}, dsa=None, gym=None, weight=None, notes=''),
    'weeks': dict(phase='', quotas={}, notes=''),
    'tests': dict(type='', release=None, targetAttempt=None, targetReview=None, attemptStatus='Pending', reviewStatus='Pending', actualAttempt=None, actualReview=None, maxScore=None, score=None, notes=''),
    'backlog': dict(order=0, unit='', totalUnits=None, completedUnits=None, hoursPerUnit=None, hoursPerUnitFromCava=False, progressOverride=None, status='Pending', deadline=None, notes='', source=''),
    'apfcModules': dict(items=0, platformComplete=0, attachmentBadges=0, priority='', action='', studyStatus='Not started', verifiedRuntimeH=None, selectedStudyH=None, hoursDone=None, notes=''),
    'syllabusAreas': dict(firstCoverage=None, questionsReviewed=None, errorsCorrected=None, recallChecked=None, action=''),
    'courseEntries': dict(type='', platformStatus='Not started', displayedDuration=None, observedRuntimeH=None, studyMode=None, selectedStudyH=None, hoursDone=None, reviewStatus='Not reviewed', notes=''),
}
REQUIRED = {
    'settings': list(SCHEMAS['settings']), 'dailyLogs': ['date'], 'weeks': ['start', 'end'],
    'tests': ['code', 'exam', 'paper'], 'backlog': ['workstream'], 'apfcModules': ['num', 'module'],
    'syllabusAreas': ['num', 'area'], 'courseEntries': ['code', 'module', 'title'],
}
ENUMS = {
    'tests': dict(exam=EXAMS, attemptStatus=['Not reported', 'Pending', 'Attempted'], reviewStatus=['Pending', 'Reviewed']),
    'backlog': dict(status=['Pending', 'In progress', 'Complete', 'Scope needed']),
    'apfcModules': dict(studyStatus=['Not started', 'Selecting', 'Studying', 'Reviewed']),
    'courseEntries': dict(platformStatus=['Not started', 'Now playing', 'Completed'], studyMode=[None, 'Watch', 'Read', 'Practice', 'Notes only', 'Skip overlap'], reviewStatus=['Not reviewed', 'Reviewed']),
}


def fail(message):
    raise ValidationError(message)


def iso(value):
    try:
        if not isinstance(value, str) or date.fromisoformat(value).isoformat() != value:
            raise ValueError()
    except ValueError:
        fail('Use a valid date in YYYY-MM-DD format.')
    return value


def number(value, name, low=0, high=1000000):
    if not is_num(value) or not low <= value <= high:
        fail(f'{name} must be a number between {low} and {high}.')


def validate(collection, incoming, previous=None):
    if not isinstance(incoming, dict):
        fail('Expected a JSON object.')
    spec = SCHEMAS[collection]
    result = {**deepcopy(DEFAULTS[collection]), **deepcopy(previous or {}), **{k: v for k, v in incoming.items() if k in spec}}
    for key in REQUIRED[collection]:
        if result.get(key) is None or result.get(key) == '':
            fail(f'{key} is required.')
    for key, value in result.items():
        kind = spec[key]
        if value is None:
            continue
        if kind in ('num', 'signed'):
            number(value, key, -1000000 if kind == 'signed' else 0)
        elif kind == 'date':
            iso(value)
        elif kind == 'text':
            if not isinstance(value, str) or len(value) > 20000:
                fail(f'{key} must be text of at most 20,000 characters.')
        elif kind in ('obj', 'hours'):
            if not isinstance(value, dict):
                fail(f'{key} must be an object.')
            if kind == 'hours':
                if set(value) - set(STREAM_KEYS):
                    fail('Unknown study stream.')
                for k, n in value.items():
                    if n is not None:
                        number(n, k)
        elif kind == 'list' and (not isinstance(value, list) or len(value) > 100):
            fail(f'{key} must be a list of at most 100 entries.')
        elif kind == 'bool' and not isinstance(value, bool):
            fail(f'{key} must be true or false.')
    for key, options in ENUMS.get(collection, {}).items():
        if result.get(key) not in options:
            fail(f'Choose a valid {key}.')
    if collection == 'settings':
        for k, low, high in [('dailyCap', 0, 24), ('dsaWeekly', 0, 168), ('buffer', 0, .9), ('gymDaily', 0, 24)]:
            number(result[k], k, low, high)
        if result['dsaWeekly'] > result['dailyCap'] * 7:
            fail('DSA hours cannot exceed weekly study capacity.')
        if not 0 <= days_between(result['trackerStart'], result['trackerEnd']) <= 3660:
            fail('Choose a plan spanning at most ten years, with the end on or after the start.')
        keys = set()
        for e in result['exams']:
            if not isinstance(e, dict) or not all(isinstance(e.get(k), str) and e[k] for k in ['key', 'name', 'date']):
                fail('Each exam needs a key, name and date.')
            iso(e['date'])
            if e['key'] in keys:
                fail('Exam keys must be unique.')
            keys.add(e['key'])
            if e.get('prepBudgetH') is not None:
                number(e['prepBudgetH'], 'Prep budget')
        if result['pivotExam'] not in keys:
            fail('Choose an existing exam for the capacity split.')
        for key in ['start', 'target']:
            number(result['weight'].get(key), 'Weight', 20, 250)
        iso(result['weight'].get('goalDate'))
        for k in ['hoursPerLecture', 'newPerWeek']:
            number(result['cava'].get(k), k)
        if set(result['durations']) != set(EXAMS):
            fail('Include durations for every exam.')
        for dur in result['durations'].values():
            if not isinstance(dur, dict):
                fail('Test durations must be objects.')
            for key in ['attempt', 'review']:
                number(dur.get(key), key, 0, 1000)
    if collection == 'dailyLogs':
        if result.get('weight') is not None:
            number(result['weight'], 'Weight', 20, 250)
        for k in ['dsa', 'gym']:
            if result.get(k) is not None:
                number(result[k], k, 0, 24)
    if collection == 'weeks' and not 0 <= days_between(result['start'], result['end']) <= 366:
        fail('Choose a planning period of 1 to 367 days.')
    if collection == 'backlog' and result.get('progressOverride') is not None:
        number(result['progressOverride'], 'Progress', 0, 1)
    if collection in ('apfcModules', 'syllabusAreas') and result['num'] != int(result['num']):
        fail('The row number must be an integer.')
    if collection == 'tests' and result.get('score') is not None and result.get('maxScore') is not None and result['score'] > result['maxScore']:
        fail('Score cannot exceed maximum score.')
    return result


def natural_key(collection, data, uid):
    field = {'settings': None, 'dailyLogs': 'date', 'tests': 'code', 'apfcModules': 'num', 'syllabusAreas': 'num', 'courseEntries': 'code'}.get(collection)
    value = 'singleton' if collection == 'settings' else str(data[field]) if field else uid
    if len(value) > 200:
        fail('Record identifiers must be at most 200 characters.')
    return value
