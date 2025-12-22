from django.urls import path
from .views import submit_message, list_messages

urlpatterns = [
    path("", submit_message, name="submit_message"),
    path("messages/", list_messages, name="list_messages"),
]
