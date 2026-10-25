"""Compare the hosted Python calculations with the original JavaScript formulas."""
import json
from pathlib import Path
import subprocess
import sys
from copy import deepcopy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from master import calc as c

DATA = ROOT / 'server/src/seed/data'
data = {p.stem: json.loads(p.read_text()) for p in DATA.glob('*.json')}
# The original seed.js marks CAVA rows as following the duration in Settings.
data['backlog'] = [{**b, 'hoursPerUnitFromCava': b['workstream'].startswith('CAVA')} for b in data['backlog']]
logs = [{'date': c.add_days('2026-10-16', i), 'hours': {k: None if (i+j)%4 == 0 else ((i+j)%9)/4 for j, k in enumerate(c.STREAM_KEYS)},
         'dsa': None if i%3 == 0 else i%3, 'gym': 0 if i%2 else None} for i in range(40)]
s = data['settings']
weeks = c.attach_actuals(data['weeks'], logs, s)
tests = [c.derive_test(t, s, '2026-10-25') for t in data['tests']]
backlog = [c.derive_backlog(b, s) for b in data['backlog']]
test_states = [{**data['tests'][i % len(data['tests'])], 'attemptStatus': a, 'reviewStatus': r, 'score': 5, 'maxScore': 12}
               for i in range(5) for a in ['Pending', 'Attempted'] for r in ['Pending', 'Reviewed']]
expected = dict(days=[c.derive_day(l, s) for l in logs], weeks=weeks, tests=tests,
                states=[c.derive_test(t, s, '2026-10-25') for t in test_states], backlog=backlog,
                modules=[c.derive_module(m) for m in data['apfcModules']],
                areas=[c.derive_area(a) for a in data['syllabusAreas']], entries=[c.derive_entry(e) for e in data['courseEntries']],
                summary=c.start_summary(s, weeks, tests, backlog), streak=c.current_streak(logs, '2026-11-24', s))
script = '''
import fs from 'node:fs';
import * as c from './server/src/lib/calc.js';
const { data, logs, states } = JSON.parse(fs.readFileSync(0,'utf8'));
const s=data.settings;
const weeks=c.attachActuals(data.weeks,logs,s);
const tests=data.tests.map(t=>c.deriveTest(t,s,'2026-10-25'));
const backlog=data.backlog.map(b=>c.deriveBacklog(b,s));
console.log(JSON.stringify({days:logs.map(l=>c.deriveDay(l,s)),weeks,tests,states:states.map(t=>c.deriveTest(t,s,'2026-10-25')),backlog,
modules:data.apfcModules.map(c.deriveModule),areas:data.syllabusAreas.map(c.deriveArea),entries:data.courseEntries.map(c.deriveEntry),
summary:c.startSummary({settings:s,weeks,tests,backlog}),streak:c.currentStreak(logs,'2026-11-24',s)}));
'''
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=ROOT, input=json.dumps(dict(data=data, logs=logs, states=test_states)).encode()))


def compare(a, b, path='root'):
    if isinstance(a, dict) and isinstance(b, dict):
        assert set(a) == set(b), (path, 'keys', set(a)^set(b))
        for k in a:
            compare(a[k], b[k], path+'.'+k)
    elif isinstance(a, list) and isinstance(b, list):
        assert len(a) == len(b), (path, 'length')
        for i, (x, y) in enumerate(zip(a, b)):
            compare(x, y, f'{path}[{i}]')
    else:
        assert a == b, (path, a, b)

compare(expected, actual)
print('Parity passed: all seeded records, 40 mixed daily logs, 20 test workflow cases, weekly actuals and dashboard summaries match the original JavaScript.')
