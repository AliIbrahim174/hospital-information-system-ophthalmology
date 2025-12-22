from django.urls import path
from .views import visit_notes_list, last_visit_note, upsert_visit_note

urlpatterns = [
    path("visit-notes/", visit_notes_list, name="visit_notes_list"),
    path("visit-notes/last/", last_visit_note, name="last_visit_note"),
    path("visit-notes/save/", upsert_visit_note, name="upsert_visit_note"),
]
