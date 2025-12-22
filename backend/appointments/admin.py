from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "doctor", "patient", "scheduled_at", "status", "reason")
    list_filter = ("status", "scheduled_at")
    search_fields = ("reason", "doctor__full_name", "patient__full_name")
    ordering = ("-scheduled_at",)
