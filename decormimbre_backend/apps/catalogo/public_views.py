from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from utils.responses import success_response, error_response, validation_error_response
from apps.authentication.models import Notificacion, Usuario


class CotizacionRapidaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    telefono = serializers.CharField(max_length=15)
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

    def post(self, request):
        serializer = CotizacionRapidaSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer)

        data = serializer.validated_data

        # Try to find an existing account for this email
        usuario_vinculado = Usuario.objects.filter(email=data["email"]).first()

        titulo = f"Nueva cotización rápida de {data['nombre']}"
        mensaje = (
            f"Nombre: {data['nombre']}\n"
            f"Email: {data['email']}\n"
            f"Teléfono: {data['telefono']}\n"
            f"Cantidad: {data['cantidad']}\n"
            f"Descripción: {data['descripcion']}\n"
        )
        if data.get("notas"):
            mensaje += f"Notas adicionales: {data['notas']}\n"

        # Notify all PROPIETARIO and ADMIN users
        destinatarios = Usuario.objects.filter(rol__in=["PROPIETARIO", "ADMIN"], activo=True)
        for dest in destinatarios:
            Notificacion.objects.create(
                destinatario=dest,
                tipo="NUEVA_COTIZACION_RAPIDA",
                titulo=titulo,
                mensaje=mensaje,
                para_propietario=True,
                entidad_tipo="COTIZACION_RAPIDA",
                entidad_id=data["email"],
            )

        # If the sender has a portal account, also send them a notification
        if usuario_vinculado and usuario_vinculado not in destinatarios:
            Notificacion.objects.create(
                destinatario=usuario_vinculado,
                tipo="NUEVA_COTIZACION_RAPIDA",
                titulo="Hemos recibido su solicitud de cotización",
                mensaje=(
                    f"Estimado/a {data['nombre']},\n\n"
                    "Hemos recibido su solicitud de cotización y nos pondremos en contacto "
                    "con usted a la brevedad posible.\n\n"
                    f"Detalle: {data['descripcion']}"
                ),
                para_propietario=False,
                entidad_tipo="COTIZACION_RAPIDA",
                entidad_id=data["email"],
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
