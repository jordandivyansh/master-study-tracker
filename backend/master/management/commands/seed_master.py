from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from master.storage import seed_user


class Command(BaseCommand):
    help = 'Initialize fresh final-tracker workspaces, preserving all existing ones.'

    def handle(self, *args, **options):
        for user in get_user_model().objects.filter(is_active=True):
            created = seed_user(user)
            self.stdout.write(f'Account {user.pk}: ' + ('new project data loaded.' if created else 'existing final tracker preserved.'))
