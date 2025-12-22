from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import UserAccount, DoctorProfile, PatientProfile


@admin.register(UserAccount)
class UserAccountAdmin(UserAdmin):
    model = UserAccount

    # What shows in list view
    list_display = ("email", "role", "is_staff", "is_superuser", "is_active", "created_at")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")

    # Search + ordering
    search_fields = ("email",)
    ordering = ("email",)

    # Remove username field (we don't use it)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role", {"fields": ("role",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "role", "password1", "password2", "is_staff", "is_superuser", "is_active"),
        }),
    )

    # Because AbstractUser has username normally, but we removed it
    username_field = "email"


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "specialization", "clinic_room", "phone")
    search_fields = ("full_name", "user__email", "specialization")
    list_filter = ("specialization",)


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "gender", "date_of_birth", "phone")
    search_fields = ("full_name", "user__email", "phone")
    list_filter = ("gender",)
