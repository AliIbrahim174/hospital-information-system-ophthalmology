from django.apps import apps
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserAccount
from appointments.models import Appointment
from .models import Upload
from .serializers import UploadSerializer

# If you add UploadReply model in uploads app, this will work:
from .models import UploadReply
from .serializers import UploadReplySerializer, UploadReplyCreateSerializer

ROLE_ADMIN = "Admin"
ROLE_DOCTOR = "Doctor"
ROLE_PATIENT = "Patient"


def _role(user) -> str:
    return getattr(user, "role", "") or ""

def _is_admin(user) -> bool:
    return getattr(user, "role", None) == ROLE_ADMIN or getattr(user, "is_superuser", False) or getattr(user, "is_staff", False)


def _doctor_can_access_patient(doctor_user_id: int, patient_user_id: int) -> bool:
    return Appointment.objects.filter(doctor_id=doctor_user_id, patient_id=patient_user_id).exists()


def _can_access_upload(user, upload: Upload) -> bool:
    role = _role(user)

    if role == ROLE_PATIENT:
        return upload.patient_id == user.id

    if role == ROLE_ADMIN:
        return True

    if role == ROLE_DOCTOR:
        # doctor can access if they have an appointment with this patient
        return Appointment.objects.filter(doctor_id=user.id, patient_id=upload.patient_id).exists()

    return False

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def uploads_list(request):
    """
    GET /api/uploads/list/?patient_id=3&appointment_id=1
    - Patient: sees only own uploads (patient_id ignored)
    - Doctor: must provide patient_id, and must be related via an appointment
    - Admin: can see all; patient_id optional

    Optional: appointment_id filter
    """
    user = request.user
    role = _role(user)

    patient_id = request.query_params.get("patient_id")
    appointment_id = request.query_params.get("appointment_id")

    qs = Upload.objects.select_related("patient", "appointment").order_by("-uploaded_at")

    if role == ROLE_PATIENT:
        qs = qs.filter(patient_id=user.id)

    elif role == ROLE_DOCTOR:
        if not patient_id:
            return Response({"detail": "patient_id is required for doctors."}, status=400)

        if not _doctor_can_access_patient(int(user.id), int(patient_id)):
            return Response({"detail": "Not allowed."}, status=403)

        qs = qs.filter(patient_id=patient_id)

    elif role == ROLE_ADMIN:
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

    else:
        return Response({"detail": "Not allowed."}, status=403)

    if appointment_id:
        qs = qs.filter(appointment_id=appointment_id)

    qs = qs[:200]
    return Response(UploadSerializer(qs, many=True, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_create(request):
    """
    POST /api/uploads/
    multipart/form-data:
      file (required)
      file_type (optional)
      description (optional)
      appointment_id (optional)
      patient_id (required for Doctor/Admin; ignored for Patient)

    Rules:
      - Patient uploads for self
      - Doctor/Admin: must specify patient_id
          - Doctor must have appointment with that patient
      - appointment_id if provided:
          - must belong to patient
          - if Doctor: must belong to the doctor
    """
    user = request.user
    role = _role(user)

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "file is required."}, status=400)

    file_type = (request.data.get("file_type") or "").strip()
    description = (request.data.get("description") or "").strip()
    appointment_id = request.data.get("appointment_id")
    patient_id = request.data.get("patient_id")

    # Decide patient
    if role == ROLE_PATIENT:
        patient = user

    elif role in [ROLE_DOCTOR, ROLE_ADMIN]:
        if not patient_id:
            return Response({"detail": "patient_id is required for Doctor/Admin uploads."}, status=400)

        patient = get_object_or_404(UserAccount, id=patient_id)

        if role == ROLE_DOCTOR:
            if not _doctor_can_access_patient(int(user.id), int(patient.id)):
                return Response({"detail": "Not allowed."}, status=403)

    else:
        return Response({"detail": "Not allowed."}, status=403)

    # Decide appointment (optional)
    appt = None
    if appointment_id:
        appt = get_object_or_404(Appointment, id=appointment_id)

        # appointment must belong to patient
        if int(appt.patient_id) != int(patient.id):
            return Response({"detail": "appointment_id does not belong to patient_id."}, status=400)

        # doctor must own the appointment
        if role == ROLE_DOCTOR and int(appt.doctor_id) != int(user.id):
            return Response({"detail": "Not allowed for this appointment."}, status=403)

    upload = Upload.objects.create(
        patient=patient,
        appointment=appt,
        file=file_obj,
        file_type=file_type,
        description=description,
    )

    return Response(
        UploadSerializer(upload, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def upload_detail(request, upload_id: int):
    """
    GET /api/uploads/<upload_id>/
    Returns upload details if user has permission.
    """
    upload = get_object_or_404(Upload.objects.select_related("patient", "appointment"), id=upload_id)

    if not _can_access_upload(request.user, upload):
        return Response({"detail": "Not allowed."}, status=403)

    return Response(UploadSerializer(upload, context={"request": request}).data)


# ============================================================
# Upload Replies (Doctor/Admin response on uploaded file)
# ============================================================
# NOTE: This requires an UploadReply model + serializers.
# If you don’t have them yet, scroll down, I give you the exact code.
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def upload_replies_list(request, upload_id: int):
    """
    GET /api/uploads/<upload_id>/replies/
    Patient can see replies on their own upload
    Doctor can see replies if related to patient
    Admin can see all
    """
    UploadReply = apps.get_model("uploads", "UploadReply")  # avoids import errors if you add later
    upload = get_object_or_404(Upload, id=upload_id)

    if not _can_access_upload(request.user, upload):
        return Response({"detail": "Not allowed."}, status=403)

    qs = UploadReply.objects.filter(upload_id=upload_id).select_related("created_by").order_by("created_at")[:200]

    # Plain JSON without serializer is fine, but serializer is nicer.
    data = [
        {
            "reply_id": r.id,
            "upload_id": r.upload_id,
            "created_by": r.created_by_id,
            "created_by_role": getattr(r.created_by, "role", None),
            "message": r.message,
            "created_at": r.created_at,
        }
        for r in qs
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_reply_create(request, upload_id: int):
    """
    POST /api/uploads/<upload_id>/reply/
    body: { "message": "..." }

    Only Doctor/Admin can reply.
    Doctor can reply only if related to patient via appointment.
    """
    user = request.user
    role = _role(user)

    if role not in [ROLE_DOCTOR, ROLE_ADMIN] and not _is_admin(user):
        return Response({"detail": "Only doctors/admin can reply."}, status=403)

    upload = get_object_or_404(Upload, id=upload_id)

    # Permission check
    if role == ROLE_DOCTOR and not _doctor_can_access_patient(int(user.id), int(upload.patient_id)):
        return Response({"detail": "Not allowed."}, status=403)

    message = (request.data.get("message") or "").strip()
    if not message:
        return Response({"detail": "message is required."}, status=400)

    UploadReply = apps.get_model("uploads", "UploadReply")
    reply = UploadReply.objects.create(
        upload_id=upload_id,
        created_by=user,
        message=message,
    )

    return Response(
        {
            "reply_id": reply.id,
            "upload_id": reply.upload_id,
            "created_by": reply.created_by_id,
            "message": reply.message,
            "created_at": reply.created_at,
        },
        status=status.HTTP_201_CREATED,
    )
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def upload_comments(request, upload_id: int):
    """
    GET  /api/uploads/<upload_id>/comments/
    POST /api/uploads/<upload_id>/comments/   { "message": "..." }

    - Patient: can read comments on their own uploads (no posting)
    - Doctor/Admin: can read and post comments if allowed to access that upload
    """
    user = request.user
    role = _role(user)

    upload = get_object_or_404(Upload.objects.select_related("patient", "appointment"), id=upload_id)

    if not _can_access_upload(user, upload):
        return Response({"detail": "Not allowed."}, status=403)

    if request.method == "GET":
        qs = UploadReply.objects.filter(upload=upload).select_related("created_by").order_by("created_at")
        return Response(UploadReplySerializer(qs, many=True).data)

    # POST
    if role not in [ROLE_DOCTOR, ROLE_ADMIN]:
        return Response({"detail": "Only doctors/admin can comment."}, status=403)

    s = UploadReplyCreateSerializer(data=request.data)
    s.is_valid(raise_exception=True)

    reply = UploadReply.objects.create(
        upload=upload,
        created_by=user,
        message=s.validated_data["message"].strip(),
    )

    return Response(UploadReplySerializer(reply).data, status=201)