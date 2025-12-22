from django.contrib import admin
from .models import VisitNote


@admin.register(VisitNote)
class VisitNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "appointment", "patient", "follow_up_date")
    list_filter = ("follow_up_date",)
    search_fields = ("chief_complaint", "diagnosis", "patient__full_name", "appointment__reason")
    ordering = ("-id",)
