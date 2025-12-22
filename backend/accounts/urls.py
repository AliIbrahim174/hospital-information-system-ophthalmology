from django.urls import path

from .views import register, me, doctors_list, patients_list

urlpatterns = [
    path("register/", register, name="register"),
    path("me/", me, name="me"),
    path("doctors/", doctors_list, name="doctors_list"),
    path("patients/", patients_list, name="patients_list"),
]
