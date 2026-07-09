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

# En desarrollo relajamos el límite de intentos de login para no bloquearnos
# al probar. Producción mantiene el valor estricto de base.py (5/15min).
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["login"] = "100/min"
