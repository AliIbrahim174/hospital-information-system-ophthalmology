from django.urls import path
from . import views

urlpatterns = [
    path("", views.upload_create),
    path("list/", views.uploads_list),
    path("<int:upload_id>/comments/", views.upload_comments),
]
