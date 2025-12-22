from pathlib import Path
import os
import importlib.util
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if python-dotenv exists
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BASE_DIR / ".env")
except Exception:
    pass


# =========================
# Helpers
# =========================
def app_exists(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def env_bool(key: str, default: bool = False) -> bool:
    return os.getenv(key, str(default)).lower() in ("true", "1", "yes", "y", "on")


def env_list(key: str, default: list[str] | None = None) -> list[str]:
    raw = (os.getenv(key) or "").strip()
    if raw:
        return [x.strip() for x in raw.split(",") if x.strip()]
    return default or []


# =========================
# Core
# =========================
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me")
DEBUG = env_bool("DEBUG", True)

# If your host provides a public hostname (Render/Railway style), include it automatically.
host_hints = []
for k in ("RENDER_EXTERNAL_HOSTNAME", "RAILWAY_PUBLIC_DOMAIN", "FLY_APP_NAME"):
    v = (os.getenv(k) or "").strip()
    if v:
        # FLY_APP_NAME isn't a hostname by itself, but commonly maps to <app>.fly.dev
        if k == "FLY_APP_NAME":
            host_hints.append(f"{v}.fly.dev")
        else:
            host_hints.append(v)

# Allow local + LAN dev + prod domains from env
default_hosts = ["127.0.0.1", "localhost", "0.0.0.0", "192.168.100.10", *host_hints]
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", default_hosts)

# In production, it’s better to fail fast if SECRET_KEY is not set.
if not DEBUG and (SECRET_KEY == "django-insecure-change-me" or SECRET_KEY.startswith("django-insecure")):
    raise RuntimeError("SECRET_KEY must be set in production.")


# =========================
# Installed Apps
# =========================
LOCAL_APPS = ["accounts", "appointments", "records", "uploads", "admin_api"]

# Optional apps (only included if they exist in your project)
for optional in ["contact", "dashboard"]:
    if app_exists(optional):
        LOCAL_APPS.append(optional)

# WhiteNoise is optional (only if installed)
USE_WHITENOISE = app_exists("whitenoise")

INSTALLED_APPS = [
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

if USE_WHITENOISE:
    # Helps serving static files in production without nginx
    INSTALLED_APPS.insert(0, "whitenoise.runserver_nostatic")

INSTALLED_APPS += [
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",

    # Your apps
    *LOCAL_APPS,
]


# =========================
# Middleware
# =========================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # must be high
]

if USE_WHITENOISE:
    MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")

MIDDLEWARE += [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# =========================
# URLs / WSGI
# =========================
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"


# =========================
# Templates
# =========================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# =========================
# Database
# =========================
# Hosts often give DATABASE_URL. Support it if available (dj-database-url optional).
DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()

if DATABASE_URL and app_exists("dj_database_url"):
    import dj_database_url  # type: ignore

    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
        )
    }
else:
    # Fallback to your env var style
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "his_db"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }


# =========================
# Auth (Custom User Model)
# =========================
AUTH_USER_MODEL = "accounts.UserAccount"


# =========================
# Password Validation
# =========================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# =========================
# Internationalization
# =========================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Cairo"
USE_I18N = True
USE_TZ = True


# =========================
# Static & Media
# =========================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # needed for collectstatic on hosting

if USE_WHITENOISE:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# =========================
# CORS / CSRF
# =========================
# Frontend origin(s) should be explicitly allowed.
# Example env:
# CORS_ALLOWED_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
default_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.100.10:3000",
]

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", default_cors_origins)

# JWT in headers doesn’t require credentials. Keep False unless you truly use cookies.
CORS_ALLOW_CREDENTIALS = env_bool("CORS_ALLOW_CREDENTIALS", False)

# Dev-only escape hatch
if DEBUG and env_bool("CORS_ALLOW_ALL", False):
    CORS_ALLOW_ALL_ORIGINS = True

# CSRF trusted origins should include frontend domains if you ever use cookies/admin cross-origin.
default_csrf_trusted = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.100.10:3000",
]
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", default_csrf_trusted)


# =========================
# Django REST Framework + JWT
# =========================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
}


# =========================
# Production security (only when DEBUG=False)
# =========================
if not DEBUG:
    # If behind a proxy (Render/Railway/etc), this helps Django know HTTPS is being used.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS (safe defaults, adjustable)
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "3600"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
    SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", True)

    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = os.getenv("SECURE_REFERRER_POLICY", "same-origin")


# =========================
# Misc
# =========================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
