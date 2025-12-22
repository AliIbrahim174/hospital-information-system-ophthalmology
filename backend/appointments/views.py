from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Appointment, AppointmentStatus
from .serializers import (
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentStatusUpdateSerializer,
)

User = get_user_model()

ROLE_ADMIN = "Admin"
ROLE_DOCTOR = "Doctor"
ROLE_PATIENT = "Patient"

TERMINAL_STATUSES = {AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appointments_list(request):
    """
    GET /api/appointments/
    - Doctor: only their appointments
    - Patient: only theirs
    - Admin: all
    """
    user = request.user

    qs = Appointment.objects.select_related(
        "doctor",
        "patient",
        "doctor__doctor_profile",
        "patient__patient_profile",
    ).order_by("-scheduled_at")

    if user.role == ROLE_DOCTOR:
        qs = qs.filter(doctor=user)
    elif user.role == ROLE_PATIENT:
        qs = qs.filter(patient=user)
    # Admin sees all

    return Response(AppointmentSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    """
    POST /api/appointments/book/
    Patient books appointment (Pending by default).
    body: { doctor_id, scheduled_at, reason }
    """
    user = request.user

    if user.role not in [ROLE_PATIENT, ROLE_ADMIN]:
        return Response({"detail": "Only patients/admin can book appointments."}, status=403)

    serializer = AppointmentCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    doctor_id = serializer.validated_data["doctor_id"]
    scheduled_at = serializer.validated_data["scheduled_at"]
    reason = serializer.validated_data.get("reason", "")

    # Doctor must exist and have role Doctor
    try:
        doctor = User.objects.get(id=doctor_id, role=ROLE_DOCTOR)
    except User.DoesNotExist:
        return Response({"detail": "Doctor not found."}, status=404)

    # Keep your current behavior: admin booking not supported
    if user.role != ROLE_PATIENT:
        return Response(
            {"detail": "Admin booking not supported yet. Book as a patient for now."},
            status=400,
        )

    appt = Appointment.objects.create(
        doctor=doctor,
        patient=user,
        scheduled_at=scheduled_at,
        status=AppointmentStatus.PENDING,
        reason=reason,
    )

    return Response(AppointmentSerializer(appt).data, status=drf_status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, appointment_id: int):
    """
    PATCH /api/appointments/<id>/status/
    body: { "status": "Completed" } or { "status": "Cancelled" }

    Rules:
    - Patient: can ONLY cancel their own appointment -> Cancelled
    - Doctor: can ONLY complete their own appointment -> Completed
    - Admin: can set any allowed status
    - Terminal statuses (Completed/Cancelled) cannot be changed
    """
    user = request.user
    appt = get_object_or_404(
        Appointment.objects.select_related("doctor", "patient"),
        id=appointment_id,
    )

    # Block modifications after terminal states
    if appt.status in TERMINAL_STATUSES:
        return Response(
            {"detail": f"Appointment is already {appt.status} and cannot be changed."},
            status=400,
        )

    # Validate requested status
    s = AppointmentStatusUpdateSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    requested_status = s.validated_data["status"]

    # ---------- Patient rules ----------
    if user.role == ROLE_PATIENT:
        if int(appt.patient_id) != int(user.id):
            return Response({"detail": "Not allowed for this appointment."}, status=403)

        if requested_status != AppointmentStatus.CANCELLED:
            return Response(
                {"detail": "Patients can only cancel appointments."},
                status=403,
            )

        # Optional: only allow cancel when pending/confirmed
        if appt.status not in {AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED}:
            return Response(
                {"detail": f"Cannot cancel an appointment in status '{appt.status}'."},
                status=400,
            )

    # ---------- Doctor rules ----------
    elif user.role == ROLE_DOCTOR:
        if int(appt.doctor_id) != int(user.id):
            return Response({"detail": "Not allowed for this appointment."}, status=403)

        if requested_status != AppointmentStatus.COMPLETED:
            return Response(
                {"detail": "Doctors can only mark appointments as Completed."},
                status=403,
            )

        # Optional: only allow complete when pending/confirmed
        if appt.status not in {AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED}:
            return Response(
                {"detail": f"Cannot complete an appointment in status '{appt.status}'."},
                status=400,
            )

    # ---------- Admin rules ----------
    elif user.role == ROLE_ADMIN:
        # Admin can set any valid status
        pass

    else:
        return Response({"detail": "Not allowed."}, status=403)

    # Apply change (no-op allowed)
    appt.status = requested_status
    appt.save(update_fields=["status"])

    return Response(AppointmentSerializer(appt).data, status=200)
