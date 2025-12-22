from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserAccount, UserRole, DoctorProfile, PatientProfile


@receiver(post_save, sender=UserAccount)
def create_profile_for_user(sender, instance: UserAccount, created: bool, **kwargs):
    if not created:
        return

    if instance.role == UserRole.DOCTOR:
        DoctorProfile.objects.get_or_create(
            user=instance,
            defaults={"full_name": instance.email.split("@")[0], "specialization": "General"},
        )

    elif instance.role == UserRole.PATIENT:
        PatientProfile.objects.get_or_create(
            user=instance,
            defaults={"full_name": instance.email.split("@")[0]},
        )
