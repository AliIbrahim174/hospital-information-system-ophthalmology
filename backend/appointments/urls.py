from django.urls import path
from .views import appointments_list, book_appointment, update_appointment_status

urlpatterns = [
    path("", appointments_list, name="appointments_list"),
    path("book/", book_appointment, name="book_appointment"),
    path("<int:appointment_id>/status/", update_appointment_status, name="appointment_status_update"),
]
