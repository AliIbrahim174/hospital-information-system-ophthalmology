from rest_framework import serializers
from django.utils import timezone

from .models import Appointment, AppointmentStatus


class AppointmentSerializer(serializers.ModelSerializer):
    # keep frontend contract
    appointment_id = serializers.IntegerField(source="id", read_only=True)
    doctor_id = serializers.IntegerField(source="doctor.id", read_only=True)
    patient_id = serializers.IntegerField(source="patient.id", read_only=True)

    doctorName = serializers.SerializerMethodField()
    patientName = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = (
            "appointment_id",
            "doctor_id",
            "patient_id",
            "scheduled_at",
            "status",
            "reason",
            "doctorName",
            "patientName",
        )

    def get_doctorName(self, obj: Appointment) -> str:
        try:
            return obj.doctor.doctor_profile.full_name
        except Exception:
            return getattr(obj.doctor, "email", "Doctor")

    def get_patientName(self, obj: Appointment) -> str:
        try:
            return obj.patient.patient_profile.full_name
        except Exception:
            return getattr(obj.patient, "email", "Patient")


class AppointmentCreateSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    scheduled_at = serializers.DateTimeField()
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_scheduled_at(self, value):
        # Optional: prevent booking in the past (remove if your course wants no rules)
        if value < timezone.now():
            raise serializers.ValidationError("scheduled_at cannot be in the past.")
        return value


class AppointmentStatusUpdateSerializer(serializers.Serializer):
    """
    PATCH /api/appointments/<id>/status/
    body: { "status": "Completed" }  or  { "status": "Cancelled" }
    """
    status = serializers.ChoiceField(choices=AppointmentStatus.choices)

    def validate_status(self, value: str) -> str:
        # Normalize to match exact stored values
        value = (value or "").strip()

        # Allow a friendly alias: "Done" -> "Completed"
        if value.lower() == "done":
            return AppointmentStatus.COMPLETED

        # Must match model values
        allowed = {s[0] for s in AppointmentStatus.choices}
        if value not in allowed:
            raise serializers.ValidationError(f"Invalid status. Allowed: {sorted(list(allowed))}")

        return value
