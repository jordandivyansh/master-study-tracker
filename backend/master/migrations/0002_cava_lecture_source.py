from django.db import migrations


def apply_source(apps, schema_editor):
    Document = apps.get_model('master', 'Document')
    for doc in Document.objects.filter(collection='backlog').iterator():
        if doc.data.get('workstream', '').startswith('CAVA'):
            doc.data = {**doc.data, 'hoursPerUnitFromCava': True}
            doc.save(update_fields=['data'])


class Migration(migrations.Migration):
    dependencies = [('master', '0001_initial')]
    operations = [migrations.RunPython(apply_source, migrations.RunPython.noop)]
