from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from utils.responses import success_response, error_response, validation_error_response
from apps.authentication.models import Notificacion, Usuario


class CotizacionRapidaThrottle(AnonRateThrottle):
    """Máximo 5 cotizaciones rápidas por hora por IP (anti-spam del formulario público)."""
    scope = "cotizacion_rapida"


class CotizacionRapidaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    def validate_telefono(self, value):
        import re
        limpio = re.sub(r"[\s\-().]", "", value)
        if limpio and not re.fullmatch(r"(\+\d{8,15}|0\d{8,9})", limpio):
            raise serializers.ValidationError(
                "Escribe un celular válido, ej: 098 057 2561 o +593 99 123 4567."
            )
        return limpio
    descripcion = serializers.CharField(
        help_text="Descripción del producto o mueble que desea cotizar."
    )
    cantidad = serializers.IntegerField(min_value=1, default=1)
    notas = serializers.CharField(required=False, allow_blank=True, default="")


class CotizacionRapidaView(APIView):
    """
    POST /api/v1/public/cotizacion-rapida/

    Public endpoint: receives a quick quote request from the website contact form.
    Does not require authentication.
    Creates a Notificacion for propietario/admin users so they know a new request arrived.
    Optionally links the request to an existing usuario account if email matches.
    """
    permission_classes = [AllowAny]
    throttle_classes = [CotizacionRapidaThrottle]

    def post(self, request):
        serializer = CotizacionRapidaSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer)

        data = serializer.validated_data

        from django.utils import timezone
        from datetime import timedelta
        from apps.cotizaciones.models import SolicitudRapida

        # Anti-spam: mismo email + misma descripción en la última hora → dedup.
        duplicada = SolicitudRapida.objects.filter(
            email=data["email"],
            descripcion__startswith=data["descripcion"][:200],
            fecha_solicitud__gte=timezone.now() - timedelta(hours=1),
        ).exists()
        if duplicada:
            return success_response(
                message="Su solicitud de cotización fue recibida. Nos pondremos en contacto pronto."
            )

        # Vincula con cuenta existente si el email coincide.
        usuario_vinculado = Usuario.objects.filter(email=data["email"]).first()

        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
        ip = ip.split(",")[0].strip() if ip else None

        solicitud = SolicitudRapida.objects.create(
            nombre=data["nombre"],
            email=data["email"],
            telefono=data.get("telefono", ""),
            descripcion=data["descripcion"],
            cantidad=data.get("cantidad", 1),
            notas=data.get("notas", ""),
            ip_origen=ip or None,
            usuario_vinculado=usuario_vinculado,
        )

        titulo = f"Nueva solicitud de cotización de {data['nombre']}"
        mensaje = (
            f"Nombre: {data['nombre']}\n"
            f"Email: {data['email']}\n"
            f"Teléfono: {data.get('telefono', '—')}\n"
            f"Cantidad: {data.get('cantidad', 1)}\n"
            f"Descripción: {data['descripcion']}\n"
        )
        if data.get("notas"):
            mensaje += f"Notas: {data['notas']}\n"

        # Notifica a propietario y admins.
        destinatarios = Usuario.objects.filter(rol__in=["PROPIETARIO", "ADMIN"], activo=True)
        for dest in destinatarios:
            Notificacion.objects.create(
                destinatario=dest,
                tipo="NUEVA_COTIZACION_RAPIDA",
                titulo=titulo,
                mensaje=mensaje,
                para_propietario=True,
                entidad_tipo="SOLICITUD_RAPIDA",
                entidad_id=str(solicitud.id),
            )

        # Si el remitente tiene cuenta en el portal, también le notifica.
        if usuario_vinculado and usuario_vinculado not in destinatarios:
            Notificacion.objects.create(
                destinatario=usuario_vinculado,
                tipo="NUEVA_COTIZACION_RAPIDA",
                titulo="Hemos recibido tu solicitud de cotización",
                mensaje=(
                    f"Estimado/a {data['nombre']},\n\n"
                    "Hemos recibido tu solicitud y nos pondremos en contacto contigo pronto.\n\n"
                    f"Detalle: {data['descripcion']}"
                ),
                para_propietario=False,
                entidad_tipo="SOLICITUD_RAPIDA",
                entidad_id=str(solicitud.id),
            )

        return success_response(
            message="Su solicitud de cotización fue recibida. Nos pondremos en contacto pronto.",
            status_code=status.HTTP_201_CREATED,
        )


# ── Catálogo público (para el sitio) ───────────────────────────────────────────
class ProductosPublicosView(APIView):
    """GET /api/v1/public/productos/ — catálogo activo con el formato del sitio."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None

    MATERIAL_LABEL = {
        "MIMBRE": "Mimbre Natural",
        "POLIALUMINIO": "Polialuminio",
        "COMBINADO": "Polialuminio & Mimbre",
        "TOTORA": "Totora Natural",
    }

    def get(self, request):
        from apps.catalogo.models import Producto
        qs = Producto.objects.filter(activo=True).select_related("categoria").order_by("categoria__nombre", "nombre")
        data = [
            {
                "id": str(p.id),
                "name": p.nombre,
                "category": p.categoria.nombre if p.categoria else "Otros",
                "material": self.MATERIAL_LABEL.get(p.material, p.get_material_display()),
                "price": f"Desde ${int(p.precio_base)}",
                "img": p.imagen_url or "",
                "desc": p.descripcion,
                "stock": p.stock_actual,
                "dias_produccion": p.tiempo_produccion_dias,
                "dimensiones": p.dimensiones or None,
            }
            for p in qs
        ]
        return success_response(data=data)
