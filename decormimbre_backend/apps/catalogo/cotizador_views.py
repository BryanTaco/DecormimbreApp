"""Endpoints públicos del cotizador rápido (motor de reglas)."""
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from utils.responses import success_response, error_response, validation_error_response
from .cotizador import PRODUCTOS_BASE, cotizar


class CotizadorProductosView(APIView):
    """GET /api/v1/public/cotizador/productos/ — lista de productos base."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None

    def get(self, request):
        data = [
            {
                "clave": k,
                "nombre": v["nombre"],
                "categoria": v["categoria"],
                "material_base": v["material_base"],
                "precio_base": v["precio_base"],
                "dimensiones": v["dimensiones"],
                "incluye_cojin": v["cojin"],
            }
            for k, v in PRODUCTOS_BASE.items()
        ]
        return success_response(data=data)


class CotizarSerializer(serializers.Serializer):
    producto = serializers.CharField(max_length=60)
    material = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    tamano = serializers.ChoiceField(choices=["pequeno", "estandar", "grande"], required=False, default="estandar")
    color = serializers.CharField(max_length=40, required=False, allow_blank=True, default="estandar")
    cantidad = serializers.IntegerField(required=False, default=1, min_value=1, max_value=100)


class CotizarView(APIView):
    """POST /api/v1/public/cotizador/ — calcula precio y especificaciones."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None

    def post(self, request):
        s = CotizarSerializer(data=request.data)
        if not s.is_valid():
            return validation_error_response(s)
        d = s.validated_data
        cot = cotizar(d["producto"], material=d["material"], tamano=d["tamano"], color=d["color"], cantidad=d["cantidad"])
        if cot is None:
            return error_response("PRODUCTO_NO_ENCONTRADO", "Ese producto no está en el catálogo base.", status_code=404)
        return success_response(data=cot)
