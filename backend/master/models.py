import secrets
from django.conf import settings
from django.db import models


def new_id():
    return secrets.token_hex(12)


class Document(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    collection = models.CharField(max_length=32)
    uid = models.CharField(max_length=24, default=new_id, unique=True)
    natural_key = models.CharField(max_length=200)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'collection', 'natural_key'], name='master_owner_collection_key')]
        indexes = [models.Index(fields=['owner', 'collection'])]

    def export(self):
        return {**self.data, '_id': self.uid, 'createdAt': self.created_at.isoformat(), 'updatedAt': self.updated_at.isoformat()}
