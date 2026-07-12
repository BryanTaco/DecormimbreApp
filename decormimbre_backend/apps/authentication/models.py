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
        ("ADMIN", "Administrador"),
        ("PROPIETARIO", "Propietario"),
        ("ARTESANO", "Artesano"),
        ("CLIENTE", "Cliente"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default="PROPIETARIO")
    activo = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombre"]
    objects = UsuarioManager()

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre} ({self.get_rol_display()})"

    @property
    def is_active(self):
        return self.activo

    @property
    def is_admin(self):
        return self.rol == "ADMIN"

    @property
    def is_propietario(self):
        return self.rol == "PROPIETARIO"

    @property
    def is_artesano(self):
        return self.rol == "ARTESANO"

    @property
    def is_cliente(self):
        return self.rol == "CLIENTE"


class LogActividad(models.Model):
    """
    Auditoría de todas las acciones del sistema en PostgreSQL con JSONB.
    Solo accesible por rol ADMIN.
    """
    MODULO_CHOICES = [
        ("CLIENTES", "Clientes"),
        ("COTIZACIONES", "Cotizaciones"),
        ("PEDIDOS", "Pedidos"),
        ("INVENTARIO", "Inventario"),
        ("PROVEEDORES", "Proveedores"),
        ("CATALOGO", "Catálogo"),
        ("AUTH", "Autenticación"),
    ]
    ACCION_CHOICES = [
        ("CREAR", "Crear"),
        ("EDITAR", "Editar"),
        ("ELIMINAR", "Eliminar"),
        ("CAMBIO_ESTADO", "Cambio de estado"),
        ("LOGIN", "Inicio de sesión"),
        ("LOGOUT", "Cierre de sesión"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        related_name="logs",
    )
    modulo = models.CharField(max_length=20, choices=MODULO_CHOICES, db_index=True)
    accion = models.CharField(max_length=20, choices=ACCION_CHOICES, db_index=True)
    entidad_id = models.CharField(max_length=36, blank=True)
    descripcion = models.TextField(blank=True)
    datos_anteriores = models.JSONField(null=True, blank=True)
    datos_nuevos = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "logs_actividad"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.modulo}:{self.accion} por {self.usuario} @ {self.timestamp}"


class Notificacion(models.Model):
    TIPO_CHOICES = [
        ("NUEVA_COTIZACION_RAPIDA", "Nueva cotización rápida web"),
        ("COTIZACION_APROBADA", "Cotización aprobada"),
        ("PEDIDO_EN_PRODUCCION", "Pedido en producción"),
        ("PEDIDO_LISTO", "Pedido listo para entrega"),
        ("PEDIDO_ENTREGADO", "Pedido entregado"),
        ("ALERTA_INVENTARIO", "Alerta de inventario"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    destinatario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="notificaciones",
        null=True,
        blank=True,
    )
    tipo = models.CharField(max_length=40, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    entidad_tipo = models.CharField(max_length=30, blank=True)
    entidad_id = models.CharField(max_length=36, blank=True)
    para_propietario = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notificaciones"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.tipo} — {self.titulo}"


class PushSubscription(models.Model):
    """Suscripción Web Push del navegador de un usuario (para notificaciones al celular)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "push_subscriptions"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"Push[{self.usuario_id}] {self.endpoint[:40]}"
