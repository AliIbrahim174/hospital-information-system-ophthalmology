from django.db import models
from django.utils import timezone


class MessageStatus(models.TextChoices):
    NEW = "New", "New"
    READ = "Read", "Read"
    CLOSED = "Closed", "Closed"


class ContactMessage(models.Model):
    """
    Contact form messages.
    """
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()

    status = models.CharField(max_length=20, choices=MessageStatus.choices, default=MessageStatus.NEW)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Msg #{self.id} {self.email} ({self.status})"
