from django.conf import settings
from django.db import models
from django.utils import timezone


class VisitNote(models.Model):
    """
    One VisitNote per Appointment (OneToOne), matching your requirements.
    """
    appointment = models.OneToOneField(
        "appointments.Appointment",
        on_delete=models.CASCADE,
        related_name="visit_note",
    )

    # store patient explicitly (helps your queries and matches your frontend types)
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="visit_notes",
    )

    chief_complaint = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Always keep patient synced with the appointment
        if self.appointment_id:
            self.patient_id = self.appointment.patient_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"VisitNote #{self.id} for Appointment #{self.appointment_id}"
