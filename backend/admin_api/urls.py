from django.urls import path
from .views import raw_data

urlpatterns = [
    path("raw-data/", raw_data, name="raw_data"),
]
