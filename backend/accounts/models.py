from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


class UserRole(models.TextChoices):
    ADMIN = "Admin", "Admin"
    DOCTOR = "Doctor", "Doctor"
    PATIENT = "Patient", "Patient"


class UserAccountManager(BaseUserManager):
    """
    Custom manager to make email the unique login field.
    """
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # hashes password
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", UserRole.PATIENT)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class UserAccount(AbstractUser):
    """
    Maps to USER_ACCOUNT:
    - user_id PK
    - email UK
    - password_hash (handled by Django as password)
    - role
    - created_at
    """
    username = None  # remove username
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=20, choices=UserRole.choices)
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserAccountManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


class DoctorProfile(models.Model):
    """
    Maps to DOCTOR_PROFILE (1:1 with user):
    doctor_id PK, FK -> USER_ACCOUNT
    """
    user = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="doctor_profile",
    )
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True)
    clinic_room = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=200, blank=True, default="General")

    def __str__(self):
        return self.full_name


class PatientProfile(models.Model):
    """
    Maps to PATIENT_PROFILE (1:1 with user):
    patient_id PK, FK -> USER_ACCOUNT
    """
    user = models.OneToOneField(
        UserAccount,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="patient_profile",
    )
    full_name = models.CharField(max_length=200)
    gender = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.full_name
