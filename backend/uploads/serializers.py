from rest_framework import serializers
from .models import Upload, UploadReply


class UploadReplySerializer(serializers.ModelSerializer):
    reply_id = serializers.IntegerField(source="id", read_only=True)
    upload_id = serializers.IntegerField(source="upload.id", read_only=True)
    created_by_id = serializers.IntegerField(source="created_by.id", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    created_by_role = serializers.CharField(source="created_by.role", read_only=True)

    class Meta:
        model = UploadReply
        fields = (
            "reply_id",
            "upload_id",
            "created_by_id",
            "created_by_email",
            "created_by_role",
            "message",
            "created_at",
        )


class UploadSerializer(serializers.ModelSerializer):
    upload_id = serializers.IntegerField(source="id", read_only=True)
    patient_id = serializers.IntegerField(source="patient.id", read_only=True)
    appointment_id = serializers.SerializerMethodField()
    file_path = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Upload
        fields = (
            "upload_id",
            "patient_id",
            "appointment_id",
            "file_path",
            "file_type",
            "uploaded_at",
            "description",
            "replies_count",
        )

    def get_appointment_id(self, obj):
        return obj.appointment_id

    def get_file_path(self, obj):
        request = self.context.get("request")
        if obj.file and hasattr(obj.file, "url"):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return ""

    def get_replies_count(self, obj):
        return getattr(obj, "replies_count", None) or obj.replies.count()


class UploadCreateSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField(required=False)
    appointment_id = serializers.IntegerField(required=False, allow_null=True)
    file_type = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    file = serializers.FileField()


class UploadReplyCreateSerializer(serializers.Serializer):
    message = serializers.CharField()
