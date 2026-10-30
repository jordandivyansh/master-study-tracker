from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from master.sheets_sync import run_full_sync


class Command(BaseCommand):
    help = 'Two-way synchronization between Google Sheets and Master Study Tracker database.'

    def add_arguments(self, parser):
        parser.add_argument('--direction', type=str, default='both', choices=['both', 'pull', 'push'], help='Sync direction')
        parser.add_argument('--username', type=str, default=None, help='Sync for a specific username')

    def handle(self, *args, **options):
        direction = options['direction']
        username = options.get('username')
        users = get_user_model().objects.filter(is_active=True)
        if username:
            users = users.filter(username=username)

        self.stdout.write(f'Starting Google Sheets two-way sync (direction: {direction})...')
        for user in users:
            res = run_full_sync(user, direction=direction)
            self.stdout.write(self.style.SUCCESS(
                f"[{user.username}] Sync complete: "
                f"CAVA: {res['cava']['status']} (pushed {res['cava'].get('pushed', 0)}, pulled {res['cava'].get('pulled', 0)}), "
                f"PYQs: {res['pyqs']['status']} (pushed {res['pyqs'].get('pushed', 0)}, pulled {res['pyqs'].get('pulled', 0)}), "
                f"Mocks: {res['mocks']['status']} (pushed {res['mocks'].get('pushed', 0)}, pulled {res['mocks'].get('pulled', 0)})"
            ))
