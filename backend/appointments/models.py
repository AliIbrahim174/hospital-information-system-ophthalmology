from django.db import models
from django.utils import timezone
from accounts.models import UserAccount


class AppointmentStatus(models.TextChoices):
    PENDING = "Pending", "Pending"
    CONFIRMED = "Confirmed", "Confirmed"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"



class Appointment(models.Model):
    """
    appointment_id PK (Django id)
    doctor FK -> UserAccount (role Doctor)
    patient FK -> UserAccount (role Patient)
    scheduled_at
    status
    reason
    created_at
    updated_at
    """

    doctor = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="doctor_appointments",
        limit_choices_to={"role": "Doctor"},
    )
    patient = models.ForeignKey(
        UserAccount,
        on_delete=models.CASCADE,
        related_name="patient_appointments",
        limit_choices_to={"role": "Patient"},
    )

    scheduled_at = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING,
    )

    reason = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(fields=["doctor", "scheduled_at"]),
            models.Index(fields=["patient", "scheduled_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Appt #{self.id} {self.patient.email} with {self.doctor.email} @ {self.scheduled_at}"
