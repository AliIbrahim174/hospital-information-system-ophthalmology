from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageCreateSerializer

ROLE_ADMIN = "Admin"


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_message(request):
    """
    POST /api/contact/
    Public endpoint (no auth needed).
    """
    serializer = ContactMessageCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    msg = ContactMessage.objects.create(
        name=serializer.validated_data["name"],
        email=serializer.validated_data["email"],
        subject=serializer.validated_data.get("subject", ""),
        message=serializer.validated_data["message"],
    )
    return Response(ContactMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_messages(request):
    """
    GET /api/contact/messages/
    Admin only.
    """
    if getattr(request.user, "role", None) != ROLE_ADMIN:
        return Response({"detail": "Admin only."}, status=403)

    qs = ContactMessage.objects.all().order_by("-created_at")
    return Response(ContactMessageSerializer(qs, many=True).data)
