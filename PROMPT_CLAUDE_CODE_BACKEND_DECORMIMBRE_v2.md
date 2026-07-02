# 🧠 PROMPT MAESTRO — CLAUDE CODE
## Backend Completo: Sistema Web Decormimbre
### Rol: Senior Backend Developer · Django REST Framework · Python 3.12
### Base de datos: PostgreSQL únicamente (con JSONB para datos flexibles)

---

## 🎯 CONTEXTO DEL PROYECTO

Eres un Senior Backend Developer construyendo el backend completo de **Decormimbre**,
un sistema web de gestión para una empresa artesanal de muebles ecológicos en Quito,
Ecuador. La empresa fabrica muebles con mimbre natural y polialuminio reciclado
(derivado del Tetrapack).

El sistema reemplaza procesos 100% manuales (cuadernos, WhatsApp) con una plataforma
digital. El backend es una **API REST versionada** consumida por un frontend React 18
en Vercel y por un portal público de clientes.

**Propietario del negocio:** Galortiz
**Usuarios del sistema:** Administrador (Bryan Taco) + Propietario (Galortiz)
**Despliegue destino:** Render (Web Service + Managed PostgreSQL)
**Base de datos:** PostgreSQL 16 ÚNICAMENTE — campos JSONB para datos flexibles.
               NO usar MongoDB, NO usar SQLite en producción.

---

## 🏗️ STACK TECNOLÓGICO OBLIGATORIO

```
Python                        3.12
Django                        5.1.x
djangorestframework           3.15.x
djangorestframework-simplejwt 5.3.x
psycopg2-binary               2.9.x
python-dotenv                 1.0.x
django-cors-headers           4.4.x
django-filter                 24.x
reportlab                     4.2.x
openpyxl                      3.1.x
python-magic                  0.4.27
Pillow                        10.x
gunicorn                      22.x
pytest-django                 4.8.x
pytest-cov                    5.0.x
model-bakery                  1.x       # Fixtures para tests
```

**NO instalar:** pymongo, mongoengine, motor, redis, celery en esta fase.

---

## 📁 ESTRUCTURA DE CARPETAS REQUERIDA

Genera **exactamente** esta estructura:

```
decormimbre_backend/
├── manage.py
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .gitignore
├── pytest.ini
├── Procfile
├── render.yaml
│
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── __init__.py
│   ├── authentication/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   ├── throttles.py
│   │   ├── admin.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_jwt.py
│   │       └── test_throttle.py
│   │
│   ├── clientes/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── validators.py
│   │   ├── admin.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_validators.py
│   │       └── test_views.py
│   │
│   ├── catalogo/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests/
│   │       └── __init__.py
│   │
│   ├── inventario/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── signals.py
│   │   ├── admin.py
│   │   └── tests/
│   │       └── __init__.py
│   │
│   ├── cotizaciones/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── pdf_generator.py
│   │   ├── admin.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_iva.py
│   │       └── test_lifecycle.py
│   │
│   ├── pedidos/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── ficha_tecnica.py
│   │   ├── signals.py
│   │   ├── admin.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       └── test_transitions.py
│   │
│   ├── proveedores/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests/
│   │       └── __init__.py
│   │
│   └── reportes/
│       ├── __init__.py
│       ├── views.py
│       ├── urls.py
│       ├── excel_generator.py
│       └── tests/
│           └── __init__.py
│
└── utils/
    ├── __init__.py
    ├── validators.py
    ├── pagination.py
    ├── responses.py
    ├── file_validators.py
    └── fonts/
        ├── DejaVuSans.ttf
        └── DejaVuSans-Bold.ttf
```

---

## ⚙️ CONFIGURACIÓN (config/settings/base.py)

```python
import uuid
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",  # OBLIGATORIO — blacklist JWT
    "corsheaders",
    "django_filters",
    # Apps propias
    "apps.authentication",
    "apps.clientes",
    "apps.catalogo",
    "apps.inventario",
    "apps.cotizaciones",
    "apps.pedidos",
    "apps.proveedores",
    "apps.reportes",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # PRIMERO en la lista
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

AUTH_USER_MODEL = "authentication.Usuario"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "OPTIONS": {
            "options": "-c search_path=public"
        },
    }
}

import dj_database_url
DATABASES["default"] = dj_database_url.config(
    default=env("DATABASE_URL"),
    conn_max_age=600,
    conn_health_checks=True,
)

# ── JWT ──────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env("JWT_SIGNING_KEY"),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon":  "100/hour",
        "user":  "1000/hour",
        "login": "5/15min",   # Solo aplica al endpoint de login
    },
    "DEFAULT_VERSIONING_CLASS":
        "rest_framework.versioning.NamespaceVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1"],
    "DEFAULT_PAGINATION_CLASS": "utils.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "utils.responses.custom_exception_handler",
}

# ── Contraseñas ───────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

# ── Archivos ──────────────────────────────────────────────────────────────────
MEDIA_URL  = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MAX_UPLOAD_SIZE = 5 * 1024 * 1024   # 5 MB

# ── Negocio ───────────────────────────────────────────────────────────────────
IVA_PORCENTAJE = Decimal("0.15")        # 15% vigente Ecuador 2024

# ── Internacionalización ──────────────────────────────────────────────────────
LANGUAGE_CODE = "es-ec"
TIME_ZONE     = "America/Guayaquil"
USE_I18N = True
USE_TZ   = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
```

### config/settings/development.py
```python
from .base import *

DEBUG = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
]

# En desarrollo puede usar SQLite para setup rápido
# pero PostgreSQL es preferible desde el inicio
```

### config/settings/production.py
```python
from .base import *

DEBUG = False

# NUNCA JAMÁS poner CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")

SECURE_SSL_REDIRECT          = True
SESSION_COOKIE_SECURE        = True
CSRF_COOKIE_SECURE           = True
SECURE_BROWSER_XSS_FILTER    = True
SECURE_CONTENT_TYPE_NOSNIFF  = True
X_FRAME_OPTIONS              = "DENY"
SECURE_HSTS_SECONDS          = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

---

## 🗄️ DISEÑO COMPLETO DE BASE DE DATOS — PostgreSQL

**Principios de diseño:**
- Todos los IDs son `UUIDField` — nunca enteros autoincrementales
- Todos los valores monetarios son `DecimalField` — nunca `FloatField`
- Campos flexibles (configuraciones de pedido) usan `JSONField` de Django
  que en PostgreSQL se mapea automáticamente a tipo `JSONB`
- Soft delete en todas las entidades principales
- `auto_now_add` para creación, `auto_now` para actualización

---

## 🔐 MÓDULO 1 — AUTHENTICATION (apps/authentication/)

### models.py — Usuario personalizado completo

```python
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        user = self.model(email=email, nombre=nombre, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nombre, password=None, **extra_fields):
        extra_fields.setdefault("rol", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, nombre, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    ROL_CHOICES = [
        ("ADMIN",       "Administrador"),
        ("PROPIETARIO", "Propietario"),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre         = models.CharField(max_length=150)
    email          = models.EmailField(unique=True)
    rol            = models.CharField(max_length=20, choices=ROL_CHOICES, default="PROPIETARIO")
    activo         = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)   # Acceso al admin Django
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_login   = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["nombre"]
    objects         = UsuarioManager()

    class Meta:
        db_table   = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre} ({self.get_rol_display()})"

    @property
    def is_admin(self):
        return self.rol == "ADMIN"

    @property
    def is_propietario(self):
        return self.rol == "PROPIETARIO"
```

### permissions.py
```python
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Solo usuarios con rol ADMIN."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.rol == "ADMIN")


class IsPropietario(BasePermission):
    """Solo usuarios con rol PROPIETARIO."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.rol == "PROPIETARIO")


class IsAdminOrPropietario(BasePermission):
    """Administrador o Propietario (cualquiera de los dos)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.rol in ("ADMIN", "PROPIETARIO"))
```

### throttles.py
```python
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Limita a 5 intentos de login por IP en una ventana de 15 minutos.
    Tras el 6to intento retorna HTTP 429 con cabecera Retry-After.
    """
    scope = "login"

    def get_cache_key(self, request, view):
        return f"throttle_login_{self.get_ident(request)}"
```

### urls.py — Endpoints de autenticación
```
POST   /api/v1/auth/token/              Login — retorna access + refresh (con LoginRateThrottle)
POST   /api/v1/auth/token/refresh/      Renovar access token (invalida refresh anterior)
POST   /api/v1/auth/token/blacklist/    Logout (invalida refresh token en BD)
GET    /api/v1/auth/me/                 Perfil del usuario autenticado
PUT    /api/v1/auth/me/                 Actualizar nombre o contraseña
GET    /api/v1/auth/usuarios/           Listar usuarios (solo ADMIN)
POST   /api/v1/auth/usuarios/           Crear usuario (solo ADMIN)
PUT    /api/v1/auth/usuarios/{id}/      Editar usuario (solo ADMIN)
DELETE /api/v1/auth/usuarios/{id}/      Soft delete — activo=False (solo ADMIN)
```

### tests/test_jwt.py — Tests obligatorios
```python
# Implementa TODOS estos casos:
def test_login_exitoso_retorna_access_y_refresh_token()
def test_login_email_inexistente_retorna_401()
def test_login_password_incorrecta_retorna_401()
def test_refresh_rota_token_y_blacklistea_anterior()
def test_refresh_token_anterior_ya_no_funciona_despues_de_rotar()
def test_logout_invalida_refresh_token()
def test_logout_refresh_token_ya_invalido_retorna_401()
def test_endpoint_protegido_sin_token_retorna_401()
def test_endpoint_solo_admin_con_propietario_retorna_403()
def test_usuario_inactivo_no_puede_hacer_login()
```

### tests/test_throttle.py — Tests obligatorios
```python
def test_5_intentos_fallidos_permiten_el_5to()
def test_6to_intento_retorna_429()
def test_header_retry_after_presente_en_respuesta_429()
def test_throttle_no_aplica_a_logins_exitosos()
```

---

## 👤 MÓDULO 2 — CLIENTES (apps/clientes/)

### validators.py — Algoritmo Módulo 10 COMPLETO

```python
from django.core.exceptions import ValidationError


# Provincias válidas del Ecuador (códigos 01-24 y 30 para exterior)
PROVINCIAS_VALIDAS = set(range(1, 25)) | {30}


def validar_cedula_ecuatoriana(cedula: str) -> bool:
    """
    Valida una cédula ecuatoriana mediante el algoritmo Módulo 10.

    Pasos:
    1. Verificar que tenga exactamente 10 caracteres numéricos
    2. Extraer código de provincia (dígitos 1-2) y verificar que sea válido
    3. Verificar que el tercer dígito sea < 6 (persona natural)
    4. Aplicar coeficientes [2,1,2,1,2,1,2,1,2] a los primeros 9 dígitos
    5. Si producto >= 10, restarle 9
    6. Sumar todos los resultados parciales
    7. Calcular verificador = (10 - (suma % 10)) % 10
    8. Comparar con el décimo dígito de la cédula

    Args:
        cedula: String a validar

    Returns:
        True si válida

    Raises:
        ValidationError: con mensaje descriptivo si es inválida
    """
    # 1. Longitud y tipo
    if not cedula or not cedula.isdigit() or len(cedula) != 10:
        raise ValidationError(
            f"La cédula debe tener exactamente 10 dígitos numéricos. "
            f"Se recibió: '{cedula}'"
        )

    digitos = [int(d) for d in cedula]

    # 2. Código de provincia
    provincia = digitos[0] * 10 + digitos[1]
    if provincia not in PROVINCIAS_VALIDAS:
        raise ValidationError(
            f"El código de provincia '{cedula[:2]}' no es válido. "
            f"Los códigos válidos son 01-24 y 30 (ecuatorianos en el exterior)."
        )

    # 3. Tercer dígito
    if digitos[2] >= 6:
        raise ValidationError(
            f"El tercer dígito de la cédula debe ser menor a 6. "
            f"Se recibió: '{digitos[2]}'"
        )

    # 4-6. Algoritmo Módulo 10
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    for i, coef in enumerate(coeficientes):
        producto = digitos[i] * coef
        suma += producto - 9 if producto >= 10 else producto

    # 7. Dígito verificador esperado
    verificador_esperado = (10 - (suma % 10)) % 10

    # 8. Comparación
    if verificador_esperado != digitos[9]:
        raise ValidationError(
            f"La cédula '{cedula}' no es válida. "
            f"El dígito verificador no coincide."
        )

    return True


def validar_ruc_persona_natural(ruc: str) -> bool:
    """
    Valida RUC de persona natural ecuatoriana.
    Formato: cédula (10 dígitos) + '001' = 13 dígitos.
    """
    if not ruc or not ruc.isdigit() or len(ruc) != 13:
        raise ValidationError(
            f"El RUC de persona natural debe tener 13 dígitos numéricos."
        )
    if not ruc.endswith("001"):
        raise ValidationError(
            f"El RUC de persona natural debe terminar en '001'."
        )
    # Validar los primeros 10 dígitos como cédula
    validar_cedula_ecuatoriana(ruc[:10])
    return True


def validar_cedula_o_ruc(valor: str, tipo: str) -> bool:
    """
    Punto de entrada unificado según tipo de cliente.
    tipo: 'NATURAL' → valida cédula (10 dígitos)
          'EMPRESA' → valida RUC persona natural (13 dígitos)
    """
    if tipo == "NATURAL":
        return validar_cedula_ecuatoriana(valor)
    elif tipo == "EMPRESA":
        return validar_ruc_persona_natural(valor)
    else:
        raise ValidationError(f"Tipo de cliente '{tipo}' no reconocido.")
```

### models.py — Cliente

```python
import uuid
from django.db import models
from .validators import validar_cedula_o_ruc


class Cliente(models.Model):
    TIPO_CHOICES = [
        ("NATURAL",  "Persona Natural"),
        ("EMPRESA",  "Empresa / Persona Jurídica"),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cedula_ruc      = models.CharField(max_length=13, unique=True, db_index=True)
    nombre_completo = models.CharField(max_length=200, db_index=True)
    tipo            = models.CharField(max_length=10, choices=TIPO_CHOICES, default="NATURAL")
    telefono        = models.CharField(max_length=15)
    email           = models.EmailField(blank=True, null=True)
    direccion       = models.TextField(blank=True, null=True)
    notas           = models.TextField(blank=True)          # Notas internas del propietario
    activo          = models.BooleanField(default=True)
    fecha_registro  = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por      = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL,
        null=True, related_name="clientes_creados"
    )

    class Meta:
        db_table   = "clientes"
        ordering   = ["-fecha_registro"]
        indexes    = [
            models.Index(fields=["cedula_ruc"]),
            models.Index(fields=["nombre_completo"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return f"{self.nombre_completo} ({self.cedula_ruc})"

    def clean(self):
        """Validación a nivel de modelo (se llama desde full_clean)."""
        validar_cedula_o_ruc(self.cedula_ruc, self.tipo)
```

### tests/test_validators.py — Tests EXHAUSTIVOS

```python
import pytest
from django.core.exceptions import ValidationError
from apps.clientes.validators import validar_cedula_ecuatoriana, validar_ruc_persona_natural

# ── Cédulas VÁLIDAS ───────────────────────────────────────────────────────────
CEDULAS_VALIDAS = [
    "1710034065",   # Pichincha — verificado manualmente
    "1750777516",   # Pichincha
    "0924456736",   # Guayas
    "0201638920",   # Azuay
    "3001234567",   # Exterior (provincia 30)
]

# ── Cédulas INVÁLIDAS ─────────────────────────────────────────────────────────
CEDULAS_INVALIDAS = [
    ("0023456789", "Provincia 00 no existe"),
    ("2523456789", "Provincia 25 no existe"),
    ("9923456789", "Provincia 99 no existe"),
    ("1234567891", "Dígito verificador incorrecto"),
    ("171003406",  "Solo 9 dígitos"),
    ("17100340655","11 dígitos"),
    ("abcdefghij", "Caracteres no numéricos"),
    ("",           "Vacío"),
    ("0000000000", "Todos ceros"),
    ("1790034065", "Tercer dígito >= 6"),
]

@pytest.mark.parametrize("cedula", CEDULAS_VALIDAS)
def test_cedulas_validas_pasan_validacion(cedula):
    assert validar_cedula_ecuatoriana(cedula) is True

@pytest.mark.parametrize("cedula,razon", CEDULAS_INVALIDAS)
def test_cedulas_invalidas_lanzan_validation_error(cedula, razon):
    with pytest.raises(ValidationError):
        validar_cedula_ecuatoriana(cedula)

def test_ruc_persona_natural_valido():
    assert validar_ruc_persona_natural("1710034065001") is True

def test_ruc_sin_sufijo_001_es_invalido():
    with pytest.raises(ValidationError):
        validar_ruc_persona_natural("1710034065002")

def test_ruc_con_cedula_invalida_es_rechazado():
    with pytest.raises(ValidationError):
        validar_ruc_persona_natural("1234567891001")
```

### urls.py — Endpoints de clientes
```
GET    /api/v1/clientes/                    Listar (búsqueda: nombre, cedula_ruc; filtro: activo)
POST   /api/v1/clientes/                    Crear (valida cédula/RUC automáticamente)
GET    /api/v1/clientes/{id}/               Detalle + resumen de pedidos y cotizaciones
PUT    /api/v1/clientes/{id}/               Actualizar (cedula_ruc es read-only después de crear)
DELETE /api/v1/clientes/{id}/               Soft delete (activo=False)
GET    /api/v1/clientes/{id}/pedidos/       Historial paginado de pedidos
GET    /api/v1/clientes/{id}/cotizaciones/  Historial paginado de cotizaciones
```

---

## 🗂️ MÓDULO 3 — CATÁLOGO (apps/catalogo/)

### models.py

```python
import uuid
from django.db import models


class Categoria(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre      = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    imagen_url  = models.URLField(blank=True, null=True)
    orden       = models.PositiveIntegerField(default=0)
    activo      = models.BooleanField(default=True)

    class Meta:
        db_table = "categorias"
        ordering = ["orden", "nombre"]


class Producto(models.Model):
    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre               = models.CharField(max_length=200, db_index=True)
    descripcion          = models.TextField()
    precio_base          = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual         = models.PositiveIntegerField(default=0)
    stock_minimo         = models.PositiveIntegerField(default=2)
    imagen_url           = models.URLField(blank=True, null=True)
    imagenes_adicionales = models.JSONField(default=list)   # Lista de URLs — hasta 5
    categoria            = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name="productos"
    )
    # Lista de materiales en JSON para fácil consulta desde el frontend
    # Ejemplo: [{"nombre": "Mimbre natural", "cantidad": 2.5, "unidad": "ROLLO"}]
    lista_materiales_ref = models.JSONField(default=list)
    personalizable       = models.BooleanField(default=True)
    activo               = models.BooleanField(default=True)
    fecha_creacion       = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "productos"
        ordering = ["nombre"]


class Color(models.Model):
    """
    Paleta de colores gestionada por el administrador.
    El campo hex se calcula automáticamente desde r, g, b al guardar.
    """
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre      = models.CharField(max_length=100)
    hex         = models.CharField(max_length=7)    # Formato: #RRGGBB
    r           = models.PositiveSmallIntegerField() # 0-255
    g           = models.PositiveSmallIntegerField()
    b           = models.PositiveSmallIntegerField()
    disponible  = models.BooleanField(default=True)

    class Meta:
        db_table = "colores"
        ordering = ["nombre"]

    def save(self, *args, **kwargs):
        # Siempre calcular HEX desde RGB al guardar
        self.hex = f"#{self.r:02X}{self.g:02X}{self.b:02X}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.hex})"
```

### urls.py — Endpoints de catálogo
```
GET    /api/v1/catalogo/categorias/             Listar activas (público)
POST   /api/v1/catalogo/categorias/             Crear
PUT    /api/v1/catalogo/categorias/{id}/        Actualizar
DELETE /api/v1/catalogo/categorias/{id}/        Soft delete

GET    /api/v1/catalogo/productos/              Listar (filtros: categoria, activo, personalizable)
POST   /api/v1/catalogo/productos/              Crear
GET    /api/v1/catalogo/productos/{id}/         Detalle completo
PUT    /api/v1/catalogo/productos/{id}/         Actualizar
DELETE /api/v1/catalogo/productos/{id}/         Soft delete

GET    /api/v1/catalogo/colores/                Listar disponibles (público para portal)
POST   /api/v1/catalogo/colores/                Crear (auto-calcula HEX desde RGB)
PUT    /api/v1/catalogo/colores/{id}/           Actualizar disponibilidad
```

---

## 📦 MÓDULO 4 — INVENTARIO (apps/inventario/)

### models.py

```python
import uuid
from django.db import models
from django.utils import timezone


class MateriaPrima(models.Model):
    UNIDAD_CHOICES = [
        ("METRO",   "Metro lineal"),
        ("METRO2",  "Metro cuadrado"),
        ("KG",      "Kilogramo"),
        ("UNIDAD",  "Unidad"),
        ("ROLLO",   "Rollo"),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre         = models.CharField(max_length=200, db_index=True)
    descripcion    = models.TextField(blank=True)
    unidad         = models.CharField(max_length=10, choices=UNIDAD_CHOICES)
    stock_actual   = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    stock_minimo   = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    proveedor      = models.ForeignKey(
        "proveedores.Proveedor", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="materias_primas"
    )
    activo         = models.BooleanField(default=True)

    class Meta:
        db_table = "materias_primas"

    @property
    def en_stock_critico(self):
        return self.stock_actual <= self.stock_minimo


class ProductoMateria(models.Model):
    """Cuánta materia prima requiere cada producto para fabricarse."""
    producto        = models.ForeignKey(
        "catalogo.Producto", on_delete=models.CASCADE, related_name="materiales"
    )
    materia_prima   = models.ForeignKey(
        MateriaPrima, on_delete=models.PROTECT, related_name="usos_en_productos"
    )
    cantidad_por_unidad = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table      = "producto_materia"
        unique_together = ("producto", "materia_prima")


class Lote(models.Model):
    """Trazabilidad de materiales por lote de compra."""
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia_prima       = models.ForeignKey(
        MateriaPrima, on_delete=models.PROTECT, related_name="lotes"
    )
    numero_lote         = models.CharField(max_length=50, unique=True)
    proveedor           = models.ForeignKey(
        "proveedores.Proveedor", on_delete=models.SET_NULL,
        null=True, related_name="lotes_suministrados"
    )
    cantidad_inicial    = models.DecimalField(max_digits=10, decimal_places=3)
    cantidad_disponible = models.DecimalField(max_digits=10, decimal_places=3)
    costo_unitario      = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_recepcion     = models.DateField()
    fecha_vencimiento   = models.DateField(null=True, blank=True)
    observaciones       = models.TextField(blank=True)

    class Meta:
        db_table = "lotes"


class AlertaStock(models.Model):
    """Alertas de stock crítico para el dashboard."""
    materia_prima   = models.ForeignKey(
        MateriaPrima, on_delete=models.CASCADE, related_name="alertas"
    )
    stock_al_momento = models.DecimalField(max_digits=10, decimal_places=3)
    revisada         = models.BooleanField(default=False)
    fecha_alerta     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "alertas_stock"
        ordering = ["-fecha_alerta"]


class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ("ENTRADA",            "Entrada por compra"),
        ("SALIDA_PRODUCCION",  "Salida por inicio de producción"),
        ("AJUSTE_POSITIVO",    "Ajuste positivo"),
        ("AJUSTE_NEGATIVO",    "Ajuste negativo"),
        ("DEVOLUCION",         "Devolución a proveedor"),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia_prima = models.ForeignKey(
        MateriaPrima, on_delete=models.PROTECT, related_name="movimientos"
    )
    lote          = models.ForeignKey(
        Lote, on_delete=models.SET_NULL, null=True, blank=True
    )
    tipo          = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad      = models.DecimalField(max_digits=10, decimal_places=3)
    stock_antes   = models.DecimalField(max_digits=10, decimal_places=3)
    stock_despues = models.DecimalField(max_digits=10, decimal_places=3)
    pedido        = models.ForeignKey(
        "pedidos.Pedido", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="consumos_inventario"
    )
    justificacion = models.TextField(blank=True)   # Obligatorio en ajustes
    usuario       = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    fecha         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimientos_inventario"
        ordering = ["-fecha"]
```

### signals.py
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MovimientoInventario, AlertaStock


@receiver(post_save, sender=MovimientoInventario)
def verificar_stock_minimo(sender, instance, created, **kwargs):
    """
    Después de cada movimiento de inventario, verifica si la
    materia prima cayó en stock crítico y crea una AlertaStock.
    """
    if not created:
        return
    mp = instance.materia_prima
    if mp.stock_actual <= mp.stock_minimo:
        # Solo crear alerta si no hay una sin revisar para esta materia prima
        if not AlertaStock.objects.filter(
            materia_prima=mp, revisada=False
        ).exists():
            AlertaStock.objects.create(
                materia_prima=mp,
                stock_al_momento=mp.stock_actual,
            )
```

### urls.py — Endpoints de inventario
```
GET    /api/v1/inventario/materias/           Listar (filtro: stock_critico=true)
POST   /api/v1/inventario/materias/           Crear materia prima
PUT    /api/v1/inventario/materias/{id}/      Actualizar
GET    /api/v1/inventario/lotes/              Listar lotes (filtro: materia_prima)
POST   /api/v1/inventario/lotes/              Registrar lote — actualiza stock automáticamente
GET    /api/v1/inventario/movimientos/        Historial paginado
POST   /api/v1/inventario/ajustes/            Ajuste manual (justificacion obligatoria)
GET    /api/v1/inventario/alertas/            Alertas de stock crítico sin revisar
PUT    /api/v1/inventario/alertas/{id}/revisar/  Marcar alerta como revisada
```

---

## 📋 MÓDULO 5 — COTIZACIONES (apps/cotizaciones/)

### models.py

```python
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Cotizacion(models.Model):
    ESTADO_CHOICES = [
        ("BORRADOR",  "Borrador"),
        ("ENVIADA",   "Enviada al cliente"),
        ("APROBADA",  "Aprobada"),
        ("RECHAZADA", "Rechazada"),
        ("EXPIRADA",  "Expirada"),
    ]

    # Mapa de transiciones permitidas
    TRANSICIONES = {
        "BORRADOR":  ["ENVIADA"],
        "ENVIADA":   ["APROBADA", "RECHAZADA", "EXPIRADA", "BORRADOR"],
        "RECHAZADA": ["BORRADOR"],
        "EXPIRADA":  ["BORRADOR"],
        "APROBADA":  [],   # Terminal
    }

    DIAS_VALIDEZ = 15

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero           = models.CharField(max_length=20, unique=True, editable=False)
    cliente          = models.ForeignKey(
        "clientes.Cliente", on_delete=models.PROTECT, related_name="cotizaciones"
    )
    creado_por       = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    estado           = models.CharField(
        max_length=15, choices=ESTADO_CHOICES, default="BORRADOR", db_index=True
    )
    version          = models.PositiveIntegerField(default=1)
    subtotal         = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva              = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total            = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_creacion   = models.DateTimeField(auto_now_add=True)
    fecha_envio      = models.DateTimeField(null=True, blank=True)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    fecha_respuesta  = models.DateTimeField(null=True, blank=True)
    observaciones    = models.TextField(blank=True)

    class Meta:
        db_table = "cotizaciones"
        ordering = ["-fecha_creacion"]

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self._generar_numero()
        super().save(*args, **kwargs)

    def _generar_numero(self) -> str:
        """Formato: COT-YYYY-NNNN"""
        from django.utils import timezone
        anio = timezone.now().year
        ultimo = Cotizacion.objects.filter(
            numero__startswith=f"COT-{anio}-"
        ).count()
        return f"COT-{anio}-{ultimo + 1:04d}"

    def calcular_totales(self):
        """Recalcula subtotal, IVA (15%) y total desde los ítems."""
        self.subtotal = sum(
            item.subtotal for item in self.items.all()
        ) or Decimal("0.00")
        self.iva   = (self.subtotal * settings.IVA_PORCENTAJE).quantize(Decimal("0.01"))
        self.total = self.subtotal + self.iva
        self.save(update_fields=["subtotal", "iva", "total"])

    def cambiar_estado(self, nuevo_estado: str, usuario) -> None:
        """
        Valida y ejecuta la transición de estado.
        Efectos secundarios según el nuevo estado:
          ENVIADA  → fecha_envio = now(), fecha_expiracion = now() + 15 días
                     Crea snapshot en VersionCotizacion
          APROBADA → crea el Pedido automáticamente
          RECHAZADA / EXPIRADA → fecha_respuesta = now()
          BORRADOR  (desde rechazada/expirada) → incrementa version,
                     crea snapshot de la versión anterior
        """
        estados_permitidos = self.TRANSICIONES.get(self.estado, [])
        if nuevo_estado not in estados_permitidos:
            raise ValidationError(
                f"No se puede cambiar de '{self.estado}' a '{nuevo_estado}'. "
                f"Transiciones permitidas: {estados_permitidos}"
            )
        estado_anterior = self.estado
        self.estado = nuevo_estado

        if nuevo_estado == "ENVIADA":
            self.fecha_envio = timezone.now()
            self.fecha_expiracion = timezone.now() + timezone.timedelta(
                days=self.DIAS_VALIDEZ
            )
            self._crear_snapshot(usuario, "Cotización enviada al cliente")

        elif nuevo_estado == "APROBADA":
            self.fecha_respuesta = timezone.now()
            self._crear_pedido_automatico(usuario)

        elif nuevo_estado in ("RECHAZADA", "EXPIRADA"):
            self.fecha_respuesta = timezone.now()

        elif nuevo_estado == "BORRADOR":
            # Vuelve a borrador para revisión — nueva versión
            self.version += 1
            self._crear_snapshot(usuario, f"Nueva versión v{self.version}")

        self.save()

    def _crear_snapshot(self, usuario, motivo: str) -> None:
        """Guarda un snapshot JSON inmutable de la cotización en este momento."""
        from .serializers import CotizacionSnapshotSerializer
        snapshot = CotizacionSnapshotSerializer(self).data
        VersionCotizacion.objects.create(
            cotizacion=self,
            numero_version=self.version,
            snapshot_json=dict(snapshot),
            creado_por=usuario,
            motivo_cambio=motivo,
        )

    def _crear_pedido_automatico(self, usuario):
        """Al aprobar, crea el Pedido con todos los ítems. Sin re-digitación."""
        from apps.pedidos.models import Pedido, ItemPedido
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            cotizacion=self,
            creado_por=usuario,
            subtotal=self.subtotal,
            iva=self.iva,
            total=self.total,
            observaciones=f"Generado automáticamente desde cotización {self.numero}",
        )
        for item in self.items.all():
            ItemPedido.objects.create(
                pedido=pedido,
                producto=item.producto,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=item.subtotal,
                ancho_cm=item.ancho_cm,
                alto_cm=item.alto_cm,
                largo_cm=item.largo_cm,
                color=item.color,
                configuracion=item.configuracion,
                observaciones_item=item.observaciones_item,
            )
        return pedido


class ItemCotizacion(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cotizacion       = models.ForeignKey(
        Cotizacion, on_delete=models.CASCADE, related_name="items"
    )
    producto         = models.ForeignKey(
        "catalogo.Producto", on_delete=models.PROTECT
    )
    cantidad         = models.PositiveIntegerField(default=1)
    precio_unitario  = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal         = models.DecimalField(max_digits=12, decimal_places=2)
    # Dimensiones personalizadas
    ancho_cm         = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    alto_cm          = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    largo_cm         = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    color            = models.ForeignKey(
        "catalogo.Color", on_delete=models.SET_NULL, null=True, blank=True
    )
    # JSONB — configuración flexible del mueble personalizado
    # Ejemplo: {
    #   "material": "MIMBRE_NATURAL",
    #   "tipo_tejido": "ESPIRAL",
    #   "cojin": {
    #     "incluye": true, "tipo_tela": "Tela outdoor",
    #     "color_tela_hex": "#8B4513", "relleno": "Espuma 10cm"
    #   },
    #   "notas_cliente": "Tejido más tupido que el estándar"
    # }
    configuracion    = models.JSONField(default=dict, blank=True)
    observaciones_item = models.TextField(blank=True)

    class Meta:
        db_table = "items_cotizacion"

    def save(self, *args, **kwargs):
        self.subtotal = (self.precio_unitario * self.cantidad).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)
        self.cotizacion.calcular_totales()


class VersionCotizacion(models.Model):
    """Snapshot inmutable de cada versión de la cotización para auditoría."""
    cotizacion      = models.ForeignKey(
        Cotizacion, on_delete=models.CASCADE, related_name="versiones"
    )
    numero_version  = models.PositiveIntegerField()
    snapshot_json   = models.JSONField()     # Copia completa en ese momento — JSONB
    creado_por      = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    motivo_cambio   = models.TextField(blank=True)
    fecha_creacion  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "versiones_cotizacion"
        ordering = ["numero_version"]
        unique_together = ("cotizacion", "numero_version")
```

### pdf_generator.py — ReportLab con UTF-8 completo

```python
"""
Generador de PDF de cotización con soporte completo UTF-8.
Usa la fuente DejaVuSans para tildes, ñ y símbolos especiales.
"""
import io
from decimal import Decimal
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Registrar fuentes UTF-8 al importar el módulo (una sola vez)
FONTS_DIR = Path(__file__).parent.parent.parent / "utils" / "fonts"
pdfmetrics.registerFont(TTFont("DejaVu",     str(FONTS_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold",str(FONTS_DIR / "DejaVuSans-Bold.ttf")))

AZUL       = colors.HexColor("#003366")
AZUL_CLARO = colors.HexColor("#D6E4F0")
GRIS       = colors.HexColor("#F2F2F2")


def _color_from_hex(hex_str: str):
    """Convierte '#RRGGBB' a color de ReportLab."""
    hex_str = hex_str.lstrip("#")
    r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
    return colors.Color(r / 255, g / 255, b / 255)


def generar_pdf_cotizacion(cotizacion) -> bytes:
    """
    Genera PDF de cotización y retorna bytes listos para FileResponse.

    Secciones del PDF:
    1. Encabezado: "DECORMIMBRE" + "COTIZACIÓN" + número + versión
    2. Datos del cliente: nombre, cédula/RUC, teléfono, email
    3. Validez: fecha emisión, fecha expiración
    4. Tabla de ítems: producto, dimensiones, color (muestra visual), cantidad, precio, subtotal
    5. Totales: subtotal, IVA 15%, TOTAL
    6. Condiciones generales
    7. Pie de página: "Decormimbre · Quito, Ecuador"
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    normal = ParagraphStyle("normal_dv", fontName="DejaVu", fontSize=10)
    bold   = ParagraphStyle("bold_dv",   fontName="DejaVu-Bold", fontSize=10)
    titulo = ParagraphStyle("titulo_dv", fontName="DejaVu-Bold", fontSize=18,
                             textColor=AZUL)

    story = []

    # ── Encabezado ─────────────────────────────────────────────────────────
    story.append(Paragraph("DECORMIMBRE", titulo))
    story.append(Paragraph("Muebles Artesanales Ecológicos · Quito, Ecuador", normal))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        f"<b>COTIZACIÓN {cotizacion.numero}</b>  —  Versión v{cotizacion.version}", bold
    ))
    story.append(Spacer(1, 0.3*cm))

    # ── Datos del cliente ──────────────────────────────────────────────────
    cliente = cotizacion.cliente
    datos_cliente = [
        ["Cliente:",   cliente.nombre_completo,
         "Cédula/RUC:", cliente.cedula_ruc],
        ["Teléfono:",  cliente.telefono,
         "Email:",     cliente.email or "—"],
    ]
    t = Table(datos_cliente, colWidths=[3*cm, 7*cm, 3*cm, 4*cm])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (-1,-1), "DejaVu"),
        ("FONTNAME",  (0,0), (0,-1), "DejaVu-Bold"),
        ("FONTNAME",  (2,0), (2,-1), "DejaVu-Bold"),
        ("FONTSIZE",  (0,0), (-1,-1), 9),
        ("BACKGROUND",(0,0), (-1,-1), GRIS),
        ("GRID",      (0,0), (-1,-1), 0.5, colors.white),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # ── Tabla de ítems ─────────────────────────────────────────────────────
    headers = ["#", "Producto", "Dimensiones (cm)", "Color", "Cant.", "P. Unit.", "Subtotal"]
    filas = [headers]
    for i, item in enumerate(cotizacion.items.select_related("producto", "color").all(), 1):
        dims = "—"
        if item.ancho_cm or item.alto_cm or item.largo_cm:
            partes = []
            if item.ancho_cm:  partes.append(f"A:{item.ancho_cm}")
            if item.alto_cm:   partes.append(f"H:{item.alto_cm}")
            if item.largo_cm:  partes.append(f"L:{item.largo_cm}")
            dims = " | ".join(partes)

        color_txt = "—"
        if item.color:
            color_txt = f"{item.color.nombre}\n{item.color.hex}"

        filas.append([
            str(i),
            item.producto.nombre,
            dims,
            color_txt,
            str(item.cantidad),
            f"${item.precio_unitario:,.2f}",
            f"${item.subtotal:,.2f}",
        ])

    tabla_items = Table(
        filas,
        colWidths=[0.7*cm, 5*cm, 3.5*cm, 3*cm, 1.2*cm, 2.3*cm, 2.3*cm]
    )
    tabla_items.setStyle(TableStyle([
        ("FONTNAME",   (0,0), (-1,-1), "DejaVu"),
        ("FONTNAME",   (0,0), (-1,0),  "DejaVu-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 8),
        ("BACKGROUND", (0,0), (-1,0),  AZUL),
        ("TEXTCOLOR",  (0,0), (-1,0),  colors.white),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GRIS]),
        ("GRID",       (0,0), (-1,-1), 0.5, colors.lightgrey),
        ("ALIGN",      (4,0), (-1,-1), "RIGHT"),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(tabla_items)
    story.append(Spacer(1, 0.5*cm))

    # ── Totales ────────────────────────────────────────────────────────────
    totales = [
        ["", "", "", "", "", "Subtotal:", f"${cotizacion.subtotal:,.2f}"],
        ["", "", "", "", "", "IVA (15%):", f"${cotizacion.iva:,.2f}"],
        ["", "", "", "", "", "TOTAL USD:", f"${cotizacion.total:,.2f}"],
    ]
    t_totales = Table(totales, colWidths=[0.7*cm,5*cm,3.5*cm,3*cm,1.2*cm,2.3*cm,2.3*cm])
    t_totales.setStyle(TableStyle([
        ("FONTNAME",   (0,0), (-1,-1), "DejaVu"),
        ("FONTNAME",   (5,2), (6,2),   "DejaVu-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ALIGN",      (5,0), (6,-1),  "RIGHT"),
        ("BACKGROUND", (5,2), (6,2),   AZUL_CLARO),
        ("LINEABOVE",  (5,0), (6,0),   1, AZUL),
    ]))
    story.append(t_totales)
    story.append(Spacer(1, 0.5*cm))

    # ── Validez y pie ──────────────────────────────────────────────────────
    if cotizacion.fecha_expiracion:
        exp = cotizacion.fecha_expiracion.strftime("%d/%m/%Y")
        story.append(Paragraph(
            f"Esta cotización es válida hasta el <b>{exp}</b>.", normal
        ))
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=AZUL))
    story.append(Paragraph(
        "Decormimbre · Muebles Artesanales Ecológicos · Quito, Ecuador", normal
    ))

    doc.build(story)
    return buffer.getvalue()
```

### urls.py — Endpoints de cotizaciones
```
GET    /api/v1/cotizaciones/                        Listar (filtros: estado, cliente, fecha)
POST   /api/v1/cotizaciones/                        Crear en estado BORRADOR
GET    /api/v1/cotizaciones/{id}/                   Detalle + ítems + versiones
PUT    /api/v1/cotizaciones/{id}/                   Actualizar (solo en BORRADOR)
POST   /api/v1/cotizaciones/{id}/cambiar-estado/    Transición validada de estado
GET    /api/v1/cotizaciones/{id}/pdf/               Descargar PDF (FileResponse)
GET    /api/v1/cotizaciones/{id}/versiones/         Historial de versiones

POST   /api/v1/cotizaciones/{id}/items/             Agregar ítem
PUT    /api/v1/cotizaciones/{id}/items/{item_id}/   Modificar ítem
DELETE /api/v1/cotizaciones/{id}/items/{item_id}/   Eliminar ítem
```

---

## 📦 MÓDULO 6 — PEDIDOS (apps/pedidos/)

### models.py

```python
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Pedido(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE",        "Pendiente"),
        ("EN_PRODUCCION",    "En producción"),
        ("CONTROL_CALIDAD",  "Control de calidad"),
        ("LISTO",            "Listo para entrega"),
        ("EN_ENTREGA",       "En camino al cliente"),
        ("ENTREGADO",        "Entregado"),
        ("CANCELADO",        "Cancelado"),
    ]
    TRANSICIONES = {
        "PENDIENTE":       ["EN_PRODUCCION", "CANCELADO"],
        "EN_PRODUCCION":   ["CONTROL_CALIDAD", "CANCELADO"],
        "CONTROL_CALIDAD": ["LISTO", "EN_PRODUCCION"],
        "LISTO":           ["EN_ENTREGA", "ENTREGADO"],
        "EN_ENTREGA":      ["ENTREGADO"],
        "ENTREGADO":       [],
        "CANCELADO":       [],
    }
    TIPO_ENTREGA_CHOICES = [
        ("RETIRO",   "Retiro en taller"),
        ("DOMICILIO","Entrega a domicilio"),
    ]

    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero               = models.CharField(max_length=20, unique=True, editable=False)
    cliente              = models.ForeignKey(
        "clientes.Cliente", on_delete=models.PROTECT, related_name="pedidos"
    )
    cotizacion           = models.OneToOneField(
        "cotizaciones.Cotizacion", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="pedido"
    )
    creado_por           = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    estado               = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default="PENDIENTE", db_index=True
    )
    tipo_entrega         = models.CharField(
        max_length=10, choices=TIPO_ENTREGA_CHOICES, default="RETIRO"
    )
    direccion_entrega    = models.TextField(blank=True)
    fecha_entrega_pactada = models.DateField(null=True, blank=True)
    fecha_entrega_real   = models.DateField(null=True, blank=True)
    subtotal             = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva                  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total                = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    costo_real_materiales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    margen               = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    observaciones        = models.TextField(blank=True)
    fecha_creacion       = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pedidos"
        ordering = ["-fecha_creacion"]

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self._generar_numero()
        super().save(*args, **kwargs)

    def _generar_numero(self) -> str:
        anio = timezone.now().year
        ultimo = Pedido.objects.filter(
            numero__startswith=f"PED-{anio}-"
        ).count()
        return f"PED-{anio}-{ultimo + 1:04d}"

    def cambiar_estado(self, nuevo_estado: str, usuario, observaciones: str = "") -> None:
        """
        Valida transición y ejecuta efectos secundarios:
        EN_PRODUCCION → descontar materias primas del inventario
        ENTREGADO     → fecha_entrega_real = hoy, calcular margen
        """
        estados_permitidos = self.TRANSICIONES.get(self.estado, [])
        if nuevo_estado not in estados_permitidos:
            raise ValidationError(
                f"Transición inválida: '{self.estado}' → '{nuevo_estado}'. "
                f"Permitidas: {estados_permitidos}"
            )
        estado_anterior = self.estado
        self.estado = nuevo_estado

        if nuevo_estado == "EN_PRODUCCION":
            self._descontar_inventario(usuario)

        elif nuevo_estado == "ENTREGADO":
            self.fecha_entrega_real  = timezone.now().date()
            self.margen = self.total - self.costo_real_materiales

        self.save()

        LogEstadoPedido.objects.create(
            pedido=self,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            usuario=usuario,
            observaciones=observaciones,
        )

    def _descontar_inventario(self, usuario):
        """
        Al iniciar producción, descuenta las materias primas
        de cada producto en el pedido según la tabla ProductoMateria.
        Crea un MovimientoInventario por cada materia prima.
        """
        from apps.inventario.models import MateriaPrima, MovimientoInventario
        for item in self.items.select_related("producto").all():
            for pm in item.producto.materiales.select_related("materia_prima").all():
                cantidad_total = pm.cantidad_por_unidad * item.cantidad
                mp = pm.materia_prima
                stock_antes = mp.stock_actual
                mp.stock_actual = max(Decimal("0"), mp.stock_actual - cantidad_total)
                mp.save(update_fields=["stock_actual"])
                MovimientoInventario.objects.create(
                    materia_prima=mp,
                    tipo="SALIDA_PRODUCCION",
                    cantidad=cantidad_total,
                    stock_antes=stock_antes,
                    stock_despues=mp.stock_actual,
                    pedido=self,
                    usuario=usuario,
                )
                self.costo_real_materiales += cantidad_total * mp.costo_unitario
        self.save(update_fields=["costo_real_materiales"])


class ItemPedido(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido           = models.ForeignKey(
        Pedido, on_delete=models.CASCADE, related_name="items"
    )
    producto         = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT)
    cantidad         = models.PositiveIntegerField(default=1)
    precio_unitario  = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal         = models.DecimalField(max_digits=12, decimal_places=2)
    ancho_cm         = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    alto_cm          = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    largo_cm         = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    color            = models.ForeignKey(
        "catalogo.Color", on_delete=models.SET_NULL, null=True, blank=True
    )
    configuracion    = models.JSONField(default=dict, blank=True)  # JSONB en PostgreSQL
    observaciones_item = models.TextField(blank=True)

    class Meta:
        db_table = "items_pedido"


class LogEstadoPedido(models.Model):
    """Registro inmutable — nunca se edita ni elimina."""
    pedido          = models.ForeignKey(
        Pedido, on_delete=models.CASCADE, related_name="log_estados"
    )
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo    = models.CharField(max_length=20)
    usuario         = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    observaciones   = models.TextField(blank=True)
    timestamp       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "log_estados_pedido"
        ordering = ["timestamp"]


class AlertaEntrega(models.Model):
    """Pedidos con fecha de entrega en las próximas 48 horas."""
    pedido        = models.ForeignKey(
        Pedido, on_delete=models.CASCADE, related_name="alertas_entrega"
    )
    dias_restantes = models.IntegerField()
    revisada      = models.BooleanField(default=False)
    fecha_alerta  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "alertas_entrega"
```

### ficha_tecnica.py — PDF con muestra de color

```python
"""
Genera la ficha técnica PDF para artesanos.
Incluye muestra de color visual con ReportLab.
"""
import io
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics import renderPDF
from reportlab.lib.styles import ParagraphStyle

FONTS_DIR = Path(__file__).parent.parent.parent / "utils" / "fonts"
pdfmetrics.registerFont(TTFont("DejaVu",      str(FONTS_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(FONTS_DIR / "DejaVuSans-Bold.ttf")))

AZUL = colors.HexColor("#003366")
GRIS = colors.HexColor("#F2F2F2")


def _muestra_color(hex_str: str, ancho=60, alto=20):
    """Dibuja un rectángulo del color especificado como Drawing."""
    hex_str = hex_str.lstrip("#")
    r = int(hex_str[0:2], 16) / 255
    g = int(hex_str[2:4], 16) / 255
    b = int(hex_str[4:6], 16) / 255
    d = Drawing(ancho, alto)
    d.add(Rect(0, 0, ancho, alto,
               fillColor=colors.Color(r, g, b),
               strokeColor=colors.black,
               strokeWidth=0.5))
    return d


def generar_ficha_tecnica(pedido) -> bytes:
    """
    Genera la ficha técnica PDF del pedido.

    Secciones:
    1. Encabezado: título + número de pedido + fecha
    2. Datos del pedido: cliente, fecha de entrega, tipo de entrega
    3. Especificaciones por ítem: dimensiones, material, color con muestra visual,
       especificaciones de cojín, notas del cliente
    4. Checklist de control de calidad
    5. Firma del artesano
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    normal = ParagraphStyle("n", fontName="DejaVu",      fontSize=9)
    bold   = ParagraphStyle("b", fontName="DejaVu-Bold", fontSize=9)
    titulo = ParagraphStyle("t", fontName="DejaVu-Bold", fontSize=16, textColor=AZUL)

    story = []

    # ── Encabezado ─────────────────────────────────────────────────────────
    from django.utils import timezone
    hoy = timezone.now().strftime("%d/%m/%Y %H:%M")
    story.append(Paragraph("DECORMIMBRE", titulo))
    story.append(Paragraph("FICHA TÉCNICA DE PRODUCCIÓN", bold))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(f"Pedido: <b>{pedido.numero}</b> | Generada: {hoy}", normal))
    story.append(Spacer(1, 0.3*cm))

    # ── Datos del pedido ───────────────────────────────────────────────────
    entrega_str = pedido.fecha_entrega_pactada.strftime("%d/%m/%Y") \
        if pedido.fecha_entrega_pactada else "Por definir"
    domicilio   = pedido.direccion_entrega if pedido.tipo_entrega == "DOMICILIO" else "—"

    datos = [
        ["Cliente:",        pedido.cliente.nombre_completo,
         "Cédula/RUC:",    pedido.cliente.cedula_ruc],
        ["Entrega pactada:", entrega_str,
         "Tipo entrega:",  pedido.get_tipo_entrega_display()],
        ["Dirección:",      domicilio, "", ""],
    ]
    t = Table(datos, colWidths=[3.5*cm, 6*cm, 3.5*cm, 4*cm])
    t.setStyle(TableStyle([
        ("FONTNAME",   (0,0), (-1,-1), "DejaVu"),
        ("FONTNAME",   (0,0), (0,-1),  "DejaVu-Bold"),
        ("FONTNAME",   (2,0), (2,-1),  "DejaVu-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 8),
        ("BACKGROUND", (0,0), (-1,-1), GRIS),
        ("GRID",       (0,0), (-1,-1), 0.3, colors.white),
        ("SPAN",       (1,2), (3,2)),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # ── Especificaciones por ítem ─────────────────────────────────────────
    for i, item in enumerate(
        pedido.items.select_related("producto", "color").all(), 1
    ):
        story.append(Paragraph(
            f"ÍTEM {i}: {item.producto.nombre}", bold
        ))
        story.append(Spacer(1, 0.2*cm))

        config = item.configuracion or {}

        # Tabla de dimensiones y material
        dims = []
        if item.ancho_cm: dims.append(f"Ancho: {item.ancho_cm} cm")
        if item.alto_cm:  dims.append(f"Alto: {item.alto_cm} cm")
        if item.largo_cm: dims.append(f"Largo: {item.largo_cm} cm")
        dims_str = " | ".join(dims) if dims else "Estándar del producto"
        material  = config.get("material", "No especificado")
        tejido    = config.get("tipo_tejido", "—")

        spec_data = [
            ["Dimensiones:", dims_str,   "Material:",    material],
            ["Tipo de tejido:", tejido,  "Cantidad:",    str(item.cantidad)],
        ]
        t_spec = Table(spec_data, colWidths=[3.5*cm, 6*cm, 3*cm, 4.5*cm])
        t_spec.setStyle(TableStyle([
            ("FONTNAME",   (0,0), (-1,-1), "DejaVu"),
            ("FONTNAME",   (0,0), (0,-1),  "DejaVu-Bold"),
            ("FONTNAME",   (2,0), (2,-1),  "DejaVu-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 8),
            ("GRID",       (0,0), (-1,-1), 0.3, colors.lightgrey),
        ]))
        story.append(t_spec)
        story.append(Spacer(1, 0.2*cm))

        # Color con muestra visual
        if item.color:
            muestra = _muestra_color(item.color.hex)
            color_data = [[
                "Color:",
                muestra,
                f"{item.color.nombre}\n{item.color.hex}\nRGB({item.color.r},{item.color.g},{item.color.b})"
            ]]
            t_color = Table(color_data, colWidths=[3*cm, 2*cm, 12*cm])
            t_color.setStyle(TableStyle([
                ("FONTNAME",  (0,0), (-1,-1), "DejaVu"),
                ("FONTNAME",  (0,0), (0,0),   "DejaVu-Bold"),
                ("FONTSIZE",  (0,0), (-1,-1),  8),
                ("VALIGN",    (0,0), (-1,-1),  "MIDDLE"),
                ("GRID",      (0,0), (-1,-1),  0.3, colors.lightgrey),
            ]))
            story.append(t_color)
            story.append(Spacer(1, 0.2*cm))

        # Cojín
        cojin = config.get("cojin", {})
        if cojin.get("incluye"):
            story.append(Paragraph("<b>Cojín:</b>", bold))
            c_data = [[
                f"Tela: {cojin.get('tipo_tela','—')}",
                f"Color tela: {cojin.get('color_tela_hex','—')}",
                f"Relleno: {cojin.get('relleno','—')}",
            ]]
            t_c = Table(c_data, colWidths=[5.5*cm, 5.5*cm, 6*cm])
            t_c.setStyle(TableStyle([
                ("FONTNAME", (0,0), (-1,-1), "DejaVu"),
                ("FONTSIZE", (0,0), (-1,-1), 8),
                ("GRID",     (0,0), (-1,-1), 0.3, colors.lightgrey),
            ]))
            story.append(t_c)
            story.append(Spacer(1, 0.2*cm))

        # Notas del cliente
        notas = config.get("notas_cliente") or item.observaciones_item
        if notas:
            story.append(Paragraph(f"<b>Notas del cliente:</b> {notas}", normal))

        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
        story.append(Spacer(1, 0.3*cm))

    # ── Checklist de control de calidad ───────────────────────────────────
    story.append(Paragraph("CHECKLIST DE CONTROL DE CALIDAD", bold))
    checklist = [
        "[ ]  Dimensiones verificadas con cinta métrica",
        "[ ]  Color aprobado contra muestra del sistema",
        "[ ]  Tejido sin defectos visibles",
        "[ ]  Cojines correctamente tapizados y del color correcto",
        "[ ]  Estructura metálica sin bordes cortantes ni soldaduras expuestas",
        "[ ]  Mueble limpio y listo para entrega",
    ]
    for punto in checklist:
        story.append(Paragraph(punto, normal))
    story.append(Spacer(1, 0.5*cm))

    # ── Firma ──────────────────────────────────────────────────────────────
    firma_data = [[
        "Artesano responsable: _____________________",
        "Firma: ___________________",
        "Fecha: ___________________",
    ]]
    t_firma = Table(firma_data, colWidths=[6*cm, 5*cm, 6*cm])
    t_firma.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "DejaVu"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
    ]))
    story.append(t_firma)

    doc.build(story)
    return buffer.getvalue()
```

### Management command — Alertas de entrega
```
python manage.py verificar_alertas_entrega

# Crea archivo en:
# apps/pedidos/management/commands/verificar_alertas_entrega.py
#
# Lógica:
#   Busca pedidos donde:
#     estado NOT IN ('ENTREGADO','CANCELADO') AND
#     fecha_entrega_pactada <= today() + 2 días AND
#     fecha_entrega_pactada >= today()
#   Para cada uno, crea AlertaEntrega si no existe una sin revisar.
#   Este comando se ejecuta en Render via cron job cada hora.
```

### urls.py — Endpoints de pedidos
```
GET    /api/v1/pedidos/                         Listar (filtros: estado, cliente, fecha)
POST   /api/v1/pedidos/                         Crear pedido directo (sin cotización)
GET    /api/v1/pedidos/{id}/                    Detalle + ítems + log de estados
PUT    /api/v1/pedidos/{id}/                    Actualizar datos básicos (no el estado)
POST   /api/v1/pedidos/{id}/cambiar-estado/     Transición validada
GET    /api/v1/pedidos/{id}/ficha-tecnica/      Descargar ficha técnica PDF
GET    /api/v1/pedidos/{id}/log/                Historial completo de transiciones
GET    /api/v1/pedidos/alertas-entrega/         Pedidos próximos a vencer
PUT    /api/v1/pedidos/alertas-entrega/{id}/revisar/  Marcar alerta como revisada

# Sin autenticación — portal público:
GET    /api/v1/public/pedidos/tracking/         ?numero=PED-2026-0001&cedula=1710034065
```

---

## 🏭 MÓDULO 7 — PROVEEDORES (apps/proveedores/)

### models.py

```python
import uuid
from django.db import models


class Proveedor(models.Model):
    TIPO_CHOICES = [
        ("TEJEDOR",        "Artesano Tejedor"),
        ("SOLDADOR",       "Fabricante de Estructuras"),
        ("CONFECCIONISTA", "Confeccionista de Cojines"),
        ("FABRICA_COLORES","Fábrica de Colores"),
        ("MATERIA_PRIMA",  "Proveedor de Materia Prima"),
        ("OTRO",           "Otro"),
    ]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cedula_ruc          = models.CharField(max_length=13, unique=True)
    nombre              = models.CharField(max_length=200, db_index=True)
    tipo                = models.CharField(max_length=20, choices=TIPO_CHOICES)
    telefono            = models.CharField(max_length=15)
    email               = models.EmailField(blank=True)
    direccion           = models.TextField(blank=True)
    tiempo_entrega_dias = models.PositiveIntegerField(default=7)
    condiciones_pago    = models.TextField(blank=True)
    activo              = models.BooleanField(default=True)
    fecha_registro      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "proveedores"
        ordering = ["nombre"]


class OrdenTrabajo(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE",   "Pendiente"),
        ("EN_PROCESO",  "En proceso"),
        ("COMPLETADA",  "Completada"),
        ("CANCELADA",   "Cancelada"),
    ]

    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido                = models.ForeignKey(
        "pedidos.Pedido", on_delete=models.CASCADE, related_name="ordenes_trabajo"
    )
    proveedor             = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name="ordenes"
    )
    estado                = models.CharField(
        max_length=15, choices=ESTADO_CHOICES, default="PENDIENTE"
    )
    descripcion           = models.TextField()
    fecha_asignacion      = models.DateTimeField(auto_now_add=True)
    fecha_entrega_esperada = models.DateField()
    fecha_entrega_real    = models.DateField(null=True, blank=True)
    observaciones         = models.TextField(blank=True)

    class Meta:
        db_table = "ordenes_trabajo"
        ordering = ["-fecha_asignacion"]
```

---

## 📊 MÓDULO 8 — REPORTES (apps/reportes/)

### views.py — Dashboard KPIs

```python
# GET /api/v1/reportes/dashboard/
# UNA sola petición — retorna todo esto:
{
    "pedidos_activos": {
        "total": 12,
        "por_estado": {
            "PENDIENTE": 3,
            "EN_PRODUCCION": 5,
            "CONTROL_CALIDAD": 2,
            "LISTO": 2
        }
    },
    "ventas": {
        "mes_actual": {
            "total_usd": "4250.00",
            "cantidad_pedidos": 8,
            "ticket_promedio": "531.25"
        },
        "mes_anterior": {
            "total_usd": "3800.00",
            "variacion_porcentual": 11.84
        }
    },
    "top_productos": [
        {"nombre": "Silla de mimbre", "cantidad_vendida": 15,
         "ingresos": "2250.00"}
    ],
    "stock_critico": [
        {"nombre": "Mimbre natural", "stock_actual": "2.500",
         "stock_minimo": "10.000", "unidad": "ROLLO"}
    ],
    "alertas_entrega": [
        {"numero": "PED-2026-0012", "cliente": "Juan Pérez",
         "dias_restantes": 1, "estado": "EN_PRODUCCION"}
    ],
    "margen_promedio_mes": "23.50"
}
```

### excel_generator.py — 3 hojas formateadas

```python
"""
Genera reporte Excel con 3 hojas usando openpyxl.

Formato:
  Encabezados: fondo #003366, texto blanco, fuente Arial 11 negrita
  Filas alternas: blanco / #F2F2F2
  Anchos de columna: auto-ajustados al contenido
  Números: formato Currency para valores monetarios
"""
import io
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side
)
from openpyxl.utils import get_column_letter


AZUL_FILL = PatternFill("solid", fgColor="003366")
GRIS_FILL = PatternFill("solid", fgColor="F2F2F2")
HEADER_FONT = Font(name="Arial", bold=True, color="FFFFFF", size=11)
BODY_FONT   = Font(name="Arial", size=10)
CENTER = Alignment(horizontal="center", vertical="center")


def _auto_width(ws):
    """Ajusta el ancho de cada columna al contenido más largo."""
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = min(max_len + 4, 50)


def generar_reporte_ventas(fecha_inicio, fecha_fin) -> bytes:
    """
    Genera reporte Excel con 3 hojas:
    1. Ventas por período
    2. Pedidos por estado
    3. Inventario valorizado
    """
    wb = Workbook()

    # ── Hoja 1: Ventas por período ─────────────────────────────────────────
    ws1 = wb.active
    ws1.title = "Ventas"
    headers1 = [
        "N° Pedido", "Cliente", "Cédula/RUC",
        "Fecha entrega", "Subtotal USD", "IVA USD", "Total USD"
    ]
    ws1.append(headers1)
    for cell in ws1[1]:
        cell.font   = HEADER_FONT
        cell.fill   = AZUL_FILL
        cell.alignment = CENTER

    from apps.pedidos.models import Pedido
    pedidos = Pedido.objects.filter(
        estado="ENTREGADO",
        fecha_entrega_real__range=[fecha_inicio, fecha_fin]
    ).select_related("cliente").order_by("fecha_entrega_real")

    total_general = 0
    for i, p in enumerate(pedidos, start=2):
        fila = [
            p.numero, p.cliente.nombre_completo, p.cliente.cedula_ruc,
            p.fecha_entrega_real.strftime("%d/%m/%Y") if p.fecha_entrega_real else "",
            float(p.subtotal), float(p.iva), float(p.total),
        ]
        ws1.append(fila)
        total_general += p.total
        if i % 2 == 0:
            for cell in ws1[i]:
                cell.fill = GRIS_FILL

    # Fila de totales
    fila_total = ws1.max_row + 1
    ws1.cell(fila_total, 1, "TOTAL").font = Font(name="Arial", bold=True)
    ws1.cell(fila_total, 7, float(total_general)).font = Font(name="Arial", bold=True)

    _auto_width(ws1)

    # ── Hoja 2: Pedidos por estado ─────────────────────────────────────────
    ws2 = wb.create_sheet("Pedidos por Estado")
    headers2 = [
        "N° Pedido", "Cliente", "Estado", "Fecha creación",
        "Fecha entrega pactada", "Días en sistema", "Margen USD"
    ]
    ws2.append(headers2)
    for cell in ws2[1]:
        cell.font = HEADER_FONT
        cell.fill = AZUL_FILL
        cell.alignment = CENTER

    todos = Pedido.objects.select_related("cliente").order_by("-fecha_creacion")
    from django.utils import timezone
    for i, p in enumerate(todos, start=2):
        dias = (timezone.now().date() - p.fecha_creacion.date()).days
        ws2.append([
            p.numero, p.cliente.nombre_completo,
            p.get_estado_display(),
            p.fecha_creacion.strftime("%d/%m/%Y"),
            p.fecha_entrega_pactada.strftime("%d/%m/%Y") if p.fecha_entrega_pactada else "—",
            dias,
            float(p.margen),
        ])
        if i % 2 == 0:
            for cell in ws2[i]:
                cell.fill = GRIS_FILL
    _auto_width(ws2)

    # ── Hoja 3: Inventario valorizado ──────────────────────────────────────
    ws3 = wb.create_sheet("Inventario")
    headers3 = [
        "Materia Prima", "Unidad", "Stock actual",
        "Stock mínimo", "Costo unitario USD",
        "Valor en stock USD", "Estado"
    ]
    ws3.append(headers3)
    for cell in ws3[1]:
        cell.font = HEADER_FONT
        cell.fill = AZUL_FILL
        cell.alignment = CENTER

    from apps.inventario.models import MateriaPrima
    for i, mp in enumerate(MateriaPrima.objects.filter(activo=True), start=2):
        valor_stock = mp.stock_actual * mp.costo_unitario
        estado = "⚠ CRÍTICO" if mp.en_stock_critico else "OK"
        ws3.append([
            mp.nombre, mp.get_unidad_display(),
            float(mp.stock_actual), float(mp.stock_minimo),
            float(mp.costo_unitario), float(valor_stock), estado,
        ])
        fill = PatternFill("solid", fgColor="FFE0E0") if mp.en_stock_critico \
               else (GRIS_FILL if i % 2 == 0 else None)
        if fill:
            for cell in ws3[i]:
                cell.fill = fill
    _auto_width(ws3)

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
```

### urls.py — Endpoints de reportes
```
GET    /api/v1/reportes/dashboard/           KPIs en tiempo real (una sola petición)
GET    /api/v1/reportes/ventas/excel/        Excel: 3 hojas (params: fecha_inicio, fecha_fin)
GET    /api/v1/reportes/inventario/excel/    Excel: inventario valorizado
GET    /api/v1/reportes/clientes/top/        Top 10 clientes por volumen de compra
```

---

## 📋 LOG DE AUDITORÍA — En PostgreSQL con JSONB

Crea el modelo `LogActividad` en `apps/authentication/models.py`:

```python
class LogActividad(models.Model):
    """
    Auditoría de todas las acciones del sistema.
    Almacenada en PostgreSQL con campos JSONB para los datos
    anteriores y nuevos (en lugar de MongoDB).
    Solo accesible por rol ADMIN.
    """
    MODULO_CHOICES = [
        ("CLIENTES",      "Clientes"),
        ("COTIZACIONES",  "Cotizaciones"),
        ("PEDIDOS",       "Pedidos"),
        ("INVENTARIO",    "Inventario"),
        ("PROVEEDORES",   "Proveedores"),
        ("CATALOGO",      "Catálogo"),
        ("AUTH",          "Autenticación"),
    ]
    ACCION_CHOICES = [
        ("CREAR",         "Crear"),
        ("EDITAR",        "Editar"),
        ("ELIMINAR",      "Eliminar"),
        ("CAMBIO_ESTADO", "Cambio de estado"),
        ("LOGIN",         "Inicio de sesión"),
        ("LOGOUT",        "Cierre de sesión"),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario          = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL,
        null=True, related_name="logs"
    )
    modulo           = models.CharField(max_length=20, choices=MODULO_CHOICES, db_index=True)
    accion           = models.CharField(max_length=20, choices=ACCION_CHOICES, db_index=True)
    entidad_id       = models.CharField(max_length=36, blank=True)
    descripcion      = models.TextField(blank=True)
    datos_anteriores = models.JSONField(null=True, blank=True)  # JSONB en PostgreSQL
    datos_nuevos     = models.JSONField(null=True, blank=True)  # JSONB en PostgreSQL
    ip_address       = models.GenericIPAddressField(null=True, blank=True)
    timestamp        = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "logs_actividad"
        ordering = ["-timestamp"]

# Endpoint: GET /api/v1/admin/logs/ — solo ADMIN
```

---

## 🔧 ARCHIVOS DE CONFIGURACIÓN

### .env.example
```env
# Django
SECRET_KEY=cambia-esto-en-produccion-usa-50-chars-aleatorios
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings.development

# PostgreSQL — una sola base de datos
DATABASE_URL=postgresql://decormimbre_user:password@localhost:5432/decormimbre_db

# JWT — clave diferente a SECRET_KEY
JWT_SIGNING_KEY=clave-jwt-diferente-a-secret-key-tambien-50-chars

# CORS — orígenes permitidos (separados por coma)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Archivos
MAX_UPLOAD_SIZE_MB=5
```

### .gitignore — Obligatorio
```
.env
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
media/
staticfiles/
db.sqlite3
```

### Procfile
```
web: gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT --timeout 120
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

### pytest.ini
```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.development
python_files  = tests/test_*.py
python_classes = Test*
python_functions = test_*
addopts = --cov=apps --cov-report=term-missing --cov-fail-under=70
```

---

## 📐 UTILS OBLIGATORIOS

### utils/responses.py — Formato unificado de respuesta
```python
# Éxito (2xx):
{"success": True, "data": {...}, "message": "Operación exitosa"}

# Lista paginada (200):
{"success": True, "data": [...], "meta": {"total": 150, "pagina": 1,
 "por_pagina": 20, "total_paginas": 8}, "message": "OK"}

# Error (4xx/5xx):
{"success": False, "error": {"code": "CEDULA_INVALIDA",
 "message": "La cédula '...' no es válida.", "field": "cedula_ruc"}}

# Códigos de error personalizados:
CEDULA_INVALIDA       CEDULA_DUPLICADA       TRANSICION_INVALIDA
COTIZACION_NO_EDITABLE  TOKEN_EXPIRADO       CREDENCIALES_INVALIDAS
LIMITE_LOGIN_EXCEDIDO   ARCHIVO_INVALIDO     STOCK_INSUFICIENTE
CAMPO_REQUERIDO         RECURSO_NO_ENCONTRADO  PERMISO_DENEGADO
```

### utils/file_validators.py — Validación MIME type
```python
import magic

ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png":  [".png"],
    "image/webp": [".webp"],
}

def validate_image_file(file):
    """
    Valida: tamaño ≤ 5 MB + MIME type real con python-magic + extensión permitida.
    Raises ValidationError con mensaje descriptivo si falla.
    python-magic lee los magic bytes reales del archivo,
    no confía en la extensión declarada por el usuario.
    """
    pass
```

### utils/pagination.py
```python
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = "por_pagina"
    max_page_size         = 100
    page_query_param      = "pagina"
```

---

## 📐 REGLAS NO NEGOCIABLES

1. **UUIDs en todos los modelos** — nunca `id = AutoField`
2. **DecimalField para dinero** — nunca FloatField (errores de redondeo en IVA)
3. **IVA siempre desde settings.IVA_PORCENTAJE** — nunca `* 0.15` hardcodeado
4. **Soft delete** — nunca `.delete()` en clientes, productos, proveedores
5. **timezone.now()** — nunca `datetime.now()` (siempre timezone-aware)
6. **Credenciales en .env** — nunca en el código ni en settings.py
7. **CORS por entorno** — `CORS_ALLOW_ALL_ORIGINS = True` nunca existe
8. **/api/v1/** en todos los endpoints — versionado desde el inicio
9. **Respuesta unificada** — todos los endpoints usan `utils/responses.py`
10. **Migraciones con nombre** — `makemigrations --name descripcion_clara`
11. **admin.py completo** — registrar todos los modelos con `list_display` útil
12. **select_related / prefetch_related** — en todas las vistas con FK para evitar N+1

---

## ✅ ORDEN DE EJECUCIÓN

```
FASE 1 — Base
  1. Estructura de carpetas completa
  2. requirements.txt y requirements-dev.txt
  3. config/settings/ (base, development, production)
  4. Modelo Usuario + UsuarioManager + migraciones
  5. JWT blacklist + throttle + CORS
  6. utils/ completos (responses, pagination, file_validators)
  7. Tests auth → deben pasar al 100%

FASE 2 — Clientes
  8.  validators.py con Módulo 10
  9.  tests/test_validators.py → pasar antes de continuar
  10. Modelo Cliente + serializer + views + urls
  11. tests/test_views.py de clientes

FASE 3 — Catálogo + Inventario
  12. Modelos Categoria, Producto, Color
  13. Modelos MateriaPrima, Lote, ProductoMateria, MovimientoInventario, AlertaStock
  14. Signal de stock mínimo
  15. ViewSets + urls

FASE 4 — Cotizaciones
  16. utils/fonts/ → DejaVuSans.ttf y DejaVuSans-Bold.ttf
  17. Modelos Cotizacion, ItemCotizacion, VersionCotizacion
  18. pdf_generator.py con ReportLab UTF-8
  19. tests/test_iva.py y test_lifecycle.py

FASE 5 — Pedidos
  20. Modelos Pedido, ItemPedido, LogEstadoPedido, AlertaEntrega
  21. ficha_tecnica.py con muestra de color
  22. Management command verificar_alertas_entrega
  23. Endpoint público /api/v1/public/pedidos/tracking/

FASE 6 — Proveedores
  24. Modelos Proveedor, OrdenTrabajo
  25. ViewSets + urls

FASE 7 — Reportes + Log
  26. Modelo LogActividad en authentication
  27. Dashboard KPIs view
  28. excel_generator.py con 3 hojas

FASE 8 — Validación final
  29. python manage.py migrate → sin errores en BD limpia
  30. pytest --cov → ≥ 70% coverage
  31. Verificar .gitignore excluye .env
  32. Verificar CORS_ALLOW_ALL_ORIGINS no existe en ningún settings
  33. Verificar ninguna credencial hardcodeada fuera de .env.example
```

---

## ✅ CRITERIOS DE ACEPTACIÓN FINALES

- [ ] `python manage.py migrate` sin errores en PostgreSQL limpio
- [ ] `pytest --cov` reporta ≥ 70% en `authentication` y `clientes`
- [ ] `POST /api/v1/auth/token/` retorna access + refresh token
- [ ] Sexto intento de login retorna HTTP 429 con cabecera `Retry-After`
- [ ] `POST /api/v1/clientes/` rechaza cédula inválida con código `CEDULA_INVALIDA`
- [ ] `GET /api/v1/cotizaciones/{id}/pdf/` retorna PDF con tildes correctas
- [ ] `GET /api/v1/pedidos/{id}/ficha-tecnica/` retorna PDF con muestra de color
- [ ] `GET /api/v1/public/pedidos/tracking/` funciona sin token JWT
- [ ] `CORS_ALLOW_ALL_ORIGINS` no existe en ningún archivo `.py`
- [ ] Ninguna credencial hardcodeada fuera de `.env.example`
- [ ] `GET /api/v1/reportes/ventas/excel/` retorna archivo `.xlsx` descargable

---

*Proyecto de titulación: Sistema Web Decormimbre*
*PUCE TEC · Bryan Steven Taco Jaramillo · Ariel Nicolas Rosero Toscano · 2026*
