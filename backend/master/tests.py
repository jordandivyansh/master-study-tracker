from copy import deepcopy
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from .models import Document
from .storage import seed_user, documents


class TrackerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user('owner', password='Test-only-passphrase-7349')
        cls.other = get_user_model().objects.create_user('other', password=None)
        seed_user(cls.user)
        seed_user(cls.other)

    def setUp(self):
        self.client.force_login(self.user)

    def send(self, method, path, value):
        return getattr(self.client, method)(path, data=value, content_type='application/json')

    def test_new_project_counts_and_blank_history(self):
        self.assertEqual(len(documents(self.user, 'weeks')), 23)
        self.assertEqual(len(documents(self.user, 'tests')), 59)
        self.assertEqual(len(documents(self.user, 'courseEntries')), 377)
        self.assertEqual(documents(self.user, 'dailyLogs'), [])
        self.assertEqual(self.client.get('/api/settings').json()['dailyCap'], 8)

    def test_authentication_required_for_all_data(self):
        c = Client()
        for route in ['dashboard', 'daily', 'weeks', 'tests', 'backlog', 'apfc/modules', 'apfc/areas', 'apfc/entries', 'settings', 'backup']:
            self.assertEqual(c.get('/api/' + route).status_code, 401, route)

    def test_login_reuses_account_and_does_not_reset_edits(self):
        self.send('put', '/api/settings', {'dailyCap': 10})
        self.client.logout()
        response = self.send('post', '/api/login/', {'username': 'owner', 'password': 'Test-only-passphrase-7349'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['authenticated'])
        self.assertEqual(self.client.get('/api/settings').json()['dailyCap'], 10)

    def test_csrf_required_for_writes(self):
        c = Client(enforce_csrf_checks=True)
        c.force_login(self.user)
        r = c.put('/api/daily/2026-10-25', data='{}', content_type='application/json')
        self.assertEqual(r.status_code, 403)
        token = c.get('/api/session/').json()['csrf']
        r = c.put('/api/daily/2026-10-25', data='{"dsa":0}', content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(r.status_code, 200)

    def test_daily_null_zero_and_update_persist(self):
        route = '/api/daily/2026-10-25'
        first = self.send('put', route, {'hours': {'apfc': 0}, 'dsa': None}).json()
        self.assertEqual(first['examStudy'], 0)
        self.assertEqual(first['studyPlusDsa'], 0)
        self.send('put', route, {'hours': {'apfc': 3, 'pubad': 2}, 'dsa': 2})
        saved = self.client.get('/api/daily?from=2026-10-25&to=2026-10-26').json()['rows']
        self.assertEqual(saved[0]['studyPlusDsa'], 7)
        self.assertTrue(saved[0]['logged'])
        self.assertIsNone(saved[1]['studyPlusDsa'])
        self.assertFalse(saved[1]['logged'])
        self.assertEqual(len(documents(self.user, 'dailyLogs')), 1)

    def test_dashboard_and_week_actuals_follow_saved_log(self):
        self.send('put', '/api/daily/2026-10-25', {'hours': {'apfc': 4}, 'dsa': 2})
        w = next(w for w in self.client.get('/api/weeks').json() if w['start'] == '2026-10-23')
        self.assertEqual(w['actualStudy'], 4)
        self.assertEqual(w['actualDsa'], 2)
        dashboard = self.client.get('/api/dashboard')
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.json()['apfc']['items'], 377)

    def test_seeded_cava_backlog_follows_settings(self):
        rows = self.client.get('/api/backlog').json()
        cava = next(r for r in rows if r['workstream'] == 'CAVA opening backlog')
        self.assertTrue(cava['hoursPerUnitFromCava'])
        self.send('put', '/api/settings', {'cava': {'hoursPerLecture': 4, 'newPerWeek': 2}})
        updated = next(r for r in self.client.get('/api/backlog').json() if r['_id'] == cava['_id'])
        self.assertEqual(updated['remainingH'], 68)

    def test_cross_account_modification_blocked(self):
        uid = documents(self.other, 'tests')[0]['_id']
        self.assertEqual(self.send('patch', '/api/tests/' + uid, {'attemptStatus': 'Attempted'}).status_code, 404)
        self.assertEqual(self.client.delete('/api/tests/' + uid).status_code, 404)

    def test_test_attempt_review_workflow(self):
        uid = documents(self.user, 'tests')[0]['_id']
        route = '/api/tests/' + uid
        r = self.send('patch', route, {'attemptStatus': 'Attempted'}).json()
        self.assertEqual(r['workflow'], 'Review pending')
        r = self.send('patch', route, {'reviewStatus': 'Reviewed'}).json()
        self.assertEqual(r['workflow'], 'Done')
        self.assertEqual(r['remainingH'], 0)

    def test_duplicate_and_invalid_updates_rejected(self):
        row = documents(self.user, 'tests')[0]
        self.assertEqual(self.send('post', '/api/tests', row).status_code, 409)
        self.assertEqual(self.send('patch', '/api/tests/' + row['_id'], {'exam': 'invalid'}).status_code, 400)
        for patch in [{'dailyCap': 25}, {'buffer': 1}, {'trackerEnd': '2026-02-31'}, {'dailyCap': None}, {'durations': {'CSE': None}}]:
            self.assertEqual(self.send('put', '/api/settings', patch).status_code, 400, patch)
        self.assertEqual(self.send('put', '/api/daily/2026-02-31', {}).status_code, 400)
        self.assertEqual(self.client.get('/api/daily?from=2000-01-01&to=2050-01-01').status_code, 400)

    def test_course_search_filters_and_derived_fields(self):
        all_rows = self.client.get('/api/apfc/entries').json()
        row = all_rows[0]
        filtered = self.client.get('/api/apfc/entries', {'module': row['module']}).json()
        self.assertTrue(filtered)
        self.assertTrue(all(r['module'] == row['module'] for r in filtered))
        changed = self.send('patch', '/api/apfc/entries/' + row['_id'], {'selectedStudyH': 4, 'hoursDone': 1, 'hoursRemaining': 999}).json()
        self.assertEqual(changed['hoursRemaining'], 3)
        doc = Document.objects.get(uid=row['_id'])
        self.assertNotIn('hoursRemaining', doc.data)

    def test_backup_round_trip_preserves_other_account(self):
        original_other = documents(self.other, 'tests')
        self.send('put', '/api/daily/2026-10-25', {'hours': {'apfc': 3}})
        exported = self.client.get('/api/backup').json()
        self.assertEqual(len(exported['settings']), 1)
        self.send('put', '/api/daily/2026-10-25', {'hours': {'apfc': 8}})
        r = self.send('post', '/api/restore', exported)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(documents(self.user, 'dailyLogs')[0]['hours']['apfc'], 3)
        self.assertEqual(documents(self.other, 'tests'), original_other)

    def test_invalid_restore_is_atomic(self):
        before = documents(self.user, 'tests')
        exported = self.client.get('/api/backup').json()
        for change in ['invalid', 'duplicate', 'missing']:
            data = deepcopy(exported)
            if change == 'invalid':
                data['courseEntries'][-1]['selectedStudyH'] = -2
            elif change == 'duplicate':
                data['tests'].append(data['tests'][0])
            else:
                del data['weeks']
            self.assertEqual(self.send('post', '/api/restore', data).status_code, 400)
            self.assertEqual(documents(self.user, 'tests'), before)

    def test_reseed_never_overwrites_new_plan_edits(self):
        self.send('put', '/api/settings', {'dailyCap': 10})
        self.assertFalse(seed_user(self.user))
        self.assertEqual(self.client.get('/api/settings').json()['dailyCap'], 10)

    def test_old_versions_redirect_to_final_and_old_api_is_closed(self):
        for route in ['/simple', '/simple/', '/beta-version/', '/v2/', '/v3/', '/v2/anything']:
            self.assertRedirects(self.client.get(route), '/', fetch_redirect_response=False)
        self.assertEqual(self.client.get('/api/studio/state/').status_code, 404)

    def test_read_responses_are_not_cached(self):
        for route in ['/api/session/', '/api/dashboard', '/api/settings', '/api/backup']:
            self.assertEqual(self.client.get(route)['Cache-Control'], 'no-store')
