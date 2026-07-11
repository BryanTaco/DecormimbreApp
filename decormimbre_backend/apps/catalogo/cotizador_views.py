"""Endpoints públicos del cotizador rápido (motor de reglas sobre el catálogo)."""
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from utils.responses import success_response, error_response, validation_error_response
from .models import Producto
from .cotizador import cotizar_catalogo


class CotizadorProductosView(APIView):
    """GET /api/v1/public/cotizador/productos/ — todo el catálogo activo, cotizable."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None

    def get(self, request):
        qs = Producto.objects.filter(activo=True).select_related("categoria").order_by("categoria__nombre", "nombre")
        data = [
            {
                "clave": str(p.id),
                "nombre": p.nombre,
                "imagen": p.imagen_url or "",
                "categoria": p.categoria.nombre if p.categoria else "Otros",
                "material_base": p.material,
                "precio_base": float(p.precio_base),
            }
            for p in qs
        ]
        return success_response(data=data)


class CotizarSerializer(serializers.Serializer):
    producto = serializers.CharField(max_length=64)  # id del producto
    material = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    tamano = serializers.ChoiceField(choices=["pequeno", "estandar", "grande"], required=False, default="estandar")
    color = serializers.CharField(max_length=40, required=False, allow_blank=True, default="estandar")
    cantidad = serializers.IntegerField(required=False, default=1, min_value=1, max_value=100)


class CotizarView(APIView):
    """POST /api/v1/public/cotizador/ — calcula precio y especificaciones de un producto del catálogo."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None

    def post(self, request):
        s = CotizarSerializer(data=request.data)
        if not s.is_valid():
            return validation_error_response(s)
        d = s.validated_data
        try:
            p = Producto.objects.select_related("categoria").get(pk=d["producto"], activo=True)
        except (Producto.DoesNotExist, ValueError, Exception):
            return error_response("PRODUCTO_NO_ENCONTRADO", "Ese producto no está en el catálogo.", status_code=404)

        cot = cotizar_catalogo(
            nombre=p.nombre,
            categoria=p.categoria.nombre if p.categoria else "Otros",
            material_base=p.material,
            precio_base=p.precio_base,
            imagen=p.imagen_url or "",
            material=d["material"], tamano=d["tamano"], color=d["color"], cantidad=d["cantidad"],
        )
        return success_response(data=cot)
