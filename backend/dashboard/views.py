from django.utils import timezone
from django.apps import apps
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

ROLE_ADMIN = "Admin"

Appointment = apps.get_model("appointments", "Appointment")
DoctorProfile = apps.get_model("accounts", "DoctorProfile")
PatientProfile = apps.get_model("accounts", "PatientProfile")
ContactMessage = apps.get_model("contact", "ContactMessage")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    """
    GET /api/dashboard/stats/
    Admin-only dashboard stats.
    """
    if getattr(request.user, "role", None) != ROLE_ADMIN:
        return Response({"detail": "Admin only."}, status=403)

    today = timezone.localdate()

    total_today = Appointment.objects.filter(scheduled_at__date=today).count()
    active_doctors = DoctorProfile.objects.count()
    patients_registered = PatientProfile.objects.count()
    pending_messages = ContactMessage.objects.filter(status="New").count()

    return Response({
        "totalAppointmentsToday": total_today,
        "activeDoctors": active_doctors,
        "patientsRegistered": patients_registered,
        "pendingMessages": pending_messages,
    })
