from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from accounts.models import UserAccount, DoctorProfile, PatientProfile
from appointments.models import Appointment
from records.models import VisitNote
from uploads.models import Upload
from contact.models import ContactMessage


class IsRoleAdmin(BasePermission):
    """
    Allows access only to:
    - authenticated users with role == "Admin"
    - OR Django is_staff / is_superuser (nice for admin site users)
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        return getattr(user, "role", None) == "Admin"


@api_view(["GET"])
@permission_classes([IsRoleAdmin])
def raw_data(request):
    """
    Returns raw rows from main tables for Admin dashboard viewing.

    IMPORTANT:
    - DoctorProfile / PatientProfile primary key is user (OneToOne), so ordering uses `user_id`
    - Other models usually use default `id` unless you defined custom primary keys
    """

    data = {
        "USER_ACCOUNT": list(
            UserAccount.objects.order_by("-created_at")
            .values("id", "email", "role", "created_at", "last_login", "is_active", "is_staff", "is_superuser",
                    "date_joined")[:200]
        ),

        # OneToOne PK -> `user_id` exists, `doctor_id` / `patient_id` do NOT
        "DOCTOR_PROFILE": list(DoctorProfile.objects.order_by("-user_id").values()[:200]),
        "PATIENT_PROFILE": list(PatientProfile.objects.order_by("-user_id").values()[:200]),

        # Default Django PK is `id` unless you made your own
        "APPOINTMENT": list(Appointment.objects.order_by("-id").values()[:200]),
        "VISIT_NOTE": list(VisitNote.objects.order_by("-id").values()[:200]),

        "UPLOAD": list(Upload.objects.order_by("-uploaded_at").values()[:200]),
        "CONTACT_MESSAGE": list(ContactMessage.objects.order_by("-created_at").values()[:200]),
    }

    return Response(data)
