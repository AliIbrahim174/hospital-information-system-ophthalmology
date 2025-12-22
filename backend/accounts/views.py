from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import DoctorProfile, PatientProfile
from .serializers import (
    RegisterSerializer,
    UserMeSerializer,
    DoctorProfileSerializer,
    PatientProfileSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/accounts/register/
    body: { email, password, role, name }
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserMeSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET /api/accounts/me/
    header: Authorization: Bearer <access_token>
    """
    return Response(UserMeSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def doctors_list(request):
    """
    GET /api/accounts/doctors/
    Returns all doctors (used for booking appointments).
    """
    qs = DoctorProfile.objects.select_related("user").all().order_by("full_name")
    return Response(DoctorProfileSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def patients_list(request):
    """
    GET /api/accounts/patients/
    Returns all patients (admin use mostly, can restrict later).
    """
    qs = PatientProfile.objects.select_related("user").all().order_by("full_name")
    return Response(PatientProfileSerializer(qs, many=True).data)
