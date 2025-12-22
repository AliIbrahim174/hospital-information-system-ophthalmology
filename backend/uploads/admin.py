from django.contrib import admin
from .models import Upload, UploadReply


@admin.register(Upload)
class UploadAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "appointment", "file_type", "uploaded_at")
    search_fields = ("patient__email", "description", "file_type")
    list_filter = ("file_type", "uploaded_at")


@admin.register(UploadReply)
class UploadReplyAdmin(admin.ModelAdmin):
    list_display = ("id", "upload", "created_by", "created_at")
    search_fields = ("message", "created_by__email")
    list_filter = ("created_at",)
