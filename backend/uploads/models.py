from django.conf import settings
from django.db import models


def patient_upload_path(instance, filename: str) -> str:
    # media/patient_uploads/<patient_user_id>/<filename>
    return f"patient_uploads/{instance.patient_id}/{filename}"


class Upload(models.Model):
    """
    Uploads made by patients (and optionally by doctors/admin on behalf of a patient).

    Exposed fields (via serializer):
      - upload_id -> id
      - patient_id -> patient.id
      - appointment_id -> appointment.id (nullable)
      - file_path -> file.url (absolute via request)
      - file_type, uploaded_at, description
    """
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploads",
    )

    appointment = models.ForeignKey(
        "appointments.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploads",
    )

    file = models.FileField(upload_to=patient_upload_path)
    file_type = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=255, blank=True)

    # better than default=timezone.now for audit accuracy
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["patient", "-uploaded_at"]),
            models.Index(fields=["appointment", "-uploaded_at"]),
        ]

    def __str__(self) -> str:
        return f"Upload #{self.id} for patient #{self.patient_id}"


class UploadReply(models.Model):
    """
    Doctor/Admin reply/comments on an upload.
    Patient can view replies to their own uploads.

    This is what enables "doctor reply on uploaded file".
    """
    upload = models.ForeignKey(
        Upload,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="upload_replies",
    )

    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["upload", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Reply #{self.id} on Upload #{self.upload_id}"
