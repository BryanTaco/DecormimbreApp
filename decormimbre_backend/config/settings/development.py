from .base import *

DEBUG = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
