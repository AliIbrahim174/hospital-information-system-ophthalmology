from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import VisitNote
from .serializers import VisitNoteSerializer, VisitNoteUpsertSerializer

Appointment = apps.get_model("appointments", "Appointment")

ROLE_ADMIN = "Admin"
ROLE_DOCTOR = "Doctor"
ROLE_PATIENT = "Patient"


def _is_admin(user) -> bool:
    # Allow Django superuser/staff as admin too
    return bool(getattr(user, "is_superuser", False) or getattr(user, "is_staff", False) or getattr(user, "role", None) == ROLE_ADMIN)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def visit_notes_list(request):
    """
    GET /api/records/visit-notes/?patient_id=3
    Patient: only their own notes
    Doctor: only notes for their own appointments (for that patient)
    Admin: all notes for that patient
    """
    user = request.user
    patient_id = request.query_params.get("patient_id")
    if not patient_id:
        return Response({"detail": "patient_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    qs = (
        VisitNote.objects.select_related(
            "appointment",
            "patient",
            "appointment__doctor",
            "appointment__patient",
        )
        .filter(patient_id=patient_id)
        .order_by("created_at")
    )

    if getattr(user, "role", None) == ROLE_PATIENT:
        # patient can only read their own
        if str(user.id) != str(patient_id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        return Response(VisitNoteSerializer(qs, many=True).data)

    if getattr(user, "role", None) == ROLE_DOCTOR:
        # doctor can read notes only for appointments where doctor is them
        qs = qs.filter(appointment__doctor_id=user.id)
        return Response(VisitNoteSerializer(qs, many=True).data)

    # admin sees all
    if _is_admin(user) or getattr(user, "role", None) == ROLE_ADMIN:
        return Response(VisitNoteSerializer(qs, many=True).data)

    return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def last_visit_note(request):
    """
    GET /api/records/visit-notes/last/?patient_id=3
    """
    user = request.user
    patient_id = request.query_params.get("patient_id")
    if not patient_id:
        return Response({"detail": "patient_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    qs = (
        VisitNote.objects.select_related(
            "appointment",
            "patient",
            "appointment__doctor",
            "appointment__patient",
        )
        .filter(patient_id=patient_id)
        .order_by("-created_at")
    )

    if getattr(user, "role", None) == ROLE_PATIENT:
        if str(user.id) != str(patient_id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        note = qs.first()
        return Response(VisitNoteSerializer(note).data if note else None)

    if getattr(user, "role", None) == ROLE_DOCTOR:
        qs = qs.filter(appointment__doctor_id=user.id)
        note = qs.first()
        return Response(VisitNoteSerializer(note).data if note else None)

    if _is_admin(user) or getattr(user, "role", None) == ROLE_ADMIN:
        note = qs.first()
        return Response(VisitNoteSerializer(note).data if note else None)

    return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upsert_visit_note(request):
    """
    POST /api/records/visit-notes/save/

    IMPORTANT CHANGE:
    This endpoint is now CREATE-ONLY.
    - If a note already exists for the appointment_id -> 400 (no overwrite)
    - Keeps the same URL so frontend stays the same.
    """
    user = request.user
    role = getattr(user, "role", None)

    if role not in [ROLE_DOCTOR, ROLE_ADMIN] and not _is_admin(user):
        return Response({"detail": "Only doctors/admin can write visit notes."}, status=status.HTTP_403_FORBIDDEN)

    serializer = VisitNoteUpsertSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    appt_id = serializer.validated_data["appointment_id"]

    try:
        appt = Appointment.objects.select_related("doctor", "patient").get(id=appt_id)
    except Appointment.DoesNotExist:
        return Response({"detail": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

    # doctor can only write for their own appointment
    if role == ROLE_DOCTOR and appt.doctor_id != user.id:
        return Response({"detail": "Not allowed for this appointment."}, status=status.HTTP_403_FORBIDDEN)

    # Block duplicates (THIS fixes Test 2.2-B)
    if VisitNote.objects.filter(appointment_id=appt.id).exists():
        return Response(
            {"detail": "A visit note already exists for this appointment."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    note = VisitNote.objects.create(
        appointment=appt,
        patient=appt.patient,
        chief_complaint=serializer.validated_data.get("chief_complaint", ""),
        diagnosis=serializer.validated_data.get("diagnosis", ""),
        treatment_plan=serializer.validated_data.get("treatment_plan", ""),
        follow_up_date=serializer.validated_data.get("follow_up_date") or None,
    )

    return Response(VisitNoteSerializer(note).data, status=status.HTTP_201_CREATED)
