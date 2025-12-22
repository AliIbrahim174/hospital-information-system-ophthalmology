from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import UserRole, DoctorProfile, PatientProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserRole.choices)
    name = serializers.CharField(max_length=200)

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        role = validated_data["role"]
        name = validated_data["name"]

        user = User.objects.create_user(email=email, password=password, role=role)

        # Update auto-created profile name (signals already create the profile)
        if role == UserRole.DOCTOR and hasattr(user, "doctor_profile"):
            DoctorProfile.objects.filter(user=user).update(full_name=name)
        elif role == UserRole.PATIENT and hasattr(user, "patient_profile"):
            PatientProfile.objects.filter(user=user).update(full_name=name)

        return user


class UserMeSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = User
        fields = ("user_id", "email", "role", "created_at")


from .models import DoctorProfile, PatientProfile


class DoctorProfileSerializer(serializers.ModelSerializer):
    doctor_id = serializers.IntegerField(source="user_id", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = ("doctor_id", "full_name", "phone", "clinic_room", "specialization")


class PatientProfileSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(source="user_id", read_only=True)

    class Meta:
        model = PatientProfile
        fields = ("patient_id", "full_name", "gender", "date_of_birth", "phone")
