from django.apps import apps
from rest_framework import serializers

from .models import VisitNote

Appointment = apps.get_model("appointments", "Appointment")


class VisitNoteSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source="id", read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True)
    patient_id = serializers.IntegerField(source="patient.id", read_only=True)

    class Meta:
        model = VisitNote
        fields = (
            "visit_id",
            "appointment_id",
            "patient_id",
            "chief_complaint",
            "diagnosis",
            "treatment_plan",
            "follow_up_date",
        )


class VisitNoteUpsertSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    chief_complaint = serializers.CharField(required=False, allow_blank=True)
    diagnosis = serializers.CharField(required=False, allow_blank=True)
    treatment_plan = serializers.CharField(required=False, allow_blank=True)
    follow_up_date = serializers.DateField(required=False, allow_null=True)

    def validate_appointment_id(self, value):
        if not Appointment.objects.filter(id=value).exists():
            raise serializers.ValidationError("Appointment not found.")
        return value
