from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory, Client
from master import views
from master.storage import documents


class Command(BaseCommand):
    help = 'Read-only deployment checks for the final tracker.'

    def handle(self, *args, **options):
        for user in get_user_model().objects.filter(is_active=True):
            for route, fn in [('/api/dashboard', views.dashboard), ('/api/backup', views.backup), ('/api/daily', views.daily)]:
                req = RequestFactory().get(route)
                req.user = user
                response = fn(req)
                if response.status_code != 200:
                    raise CommandError(f'{route}: {response.status_code}')
            self.stdout.write(f'Account {user.pk}: dashboard, daily log and backup work; ' +
                              ', '.join(f'{len(documents(user, key))} {key}' for key in ['weeks', 'tests', 'courseEntries', 'dailyLogs', 'cavaLectures', 'pyqWorkbooks']))
        self.stdout.write('Final tracker verification passed; no study records changed.')
