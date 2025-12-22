from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from django.apps import apps

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health(request):
    return JsonResponse({"status": "ok", "message": "HIS backend running"})


urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),

    # JWT Auth
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Core apps
    path("api/accounts/", include("accounts.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/records/", include("records.urls")),
    path("api/uploads/", include("uploads.urls")),
    path("api/admin/", include("admin_api.urls")),
]

# Optional apps (only include if installed)
if apps.is_installed("contact"):
    urlpatterns.append(path("api/contact/", include("contact.urls")))

if apps.is_installed("dashboard"):
    urlpatterns.append(path("api/dashboard/", include("dashboard.urls")))

# Serve uploaded media in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
