from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    message_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = ContactMessage
        fields = ("message_id", "name", "email", "subject", "message", "status", "created_at")


class ContactMessageCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    message = serializers.CharField()
