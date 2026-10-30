import json
from pathlib import Path
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Document, new_id
from .schema import validate, natural_key

COLLECTIONS = ['settings', 'dailyLogs', 'weeks', 'tests', 'backlog', 'apfcModules', 'syllabusAreas', 'courseEntries', 'cavaLectures', 'pyqWorkbooks']


def create_document(user, collection, data, uid=None):
    uid = uid or new_id()
    data = validate(collection, data)
    return Document.objects.create(owner=user, collection=collection, uid=uid, natural_key=natural_key(collection, data, uid), data=data)


@transaction.atomic
def seed_user(user):
    get_user_model().objects.select_for_update().get(pk=user.pk)
    directory = Path(__file__).resolve().parent / 'seed_data'
    if not Document.objects.filter(owner=user, collection='settings').exists():
        for collection in COLLECTIONS:
            data = json.loads((directory / (collection + '.json')).read_text())
            for row in [data] if collection == 'settings' else data:
                if collection == 'backlog':
                    row = {**row, 'hoursPerUnitFromCava': row.get('workstream', '').startswith('CAVA')}
                create_document(user, collection, row)
        return True
    for collection in ['cavaLectures', 'pyqWorkbooks']:
        if not Document.objects.filter(owner=user, collection=collection).exists():
            data = json.loads((directory / (collection + '.json')).read_text())
            for row in data:
                create_document(user, collection, row)
    return False


def documents(user, collection):
    return [d.export() for d in Document.objects.filter(owner=user, collection=collection).order_by('id')]


def settings_for(user):
    return Document.objects.get(owner=user, collection='settings').export()
