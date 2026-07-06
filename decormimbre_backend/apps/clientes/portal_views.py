from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.responses import success_response, error_response
from apps.cotizaciones.serializers import CotizacionSerializer
from apps.pedidos.serializers import PedidoSerializer, ItemPedidoSerializer, LogEstadoPedidoSerializer


class MisCotizacionesView(APIView):
    """GET /api/v1/clientes/mis-cotizaciones/ — returns all quotes for the logged-in client."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cliente = request.user.cliente_vinculado
        except Exception:
            return error_response(
                "SIN_PERFIL_CLIENTE",
                "Su cuenta no tiene un perfil de cliente asociado.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        cotizaciones = cliente.cotizaciones.order_by("-fecha_creacion")
        return success_response(data=CotizacionSerializer(cotizaciones, many=True).data)


class MisPedidosView(APIView):
    """GET /api/v1/clientes/mis-pedidos/ — returns all orders for the logged-in client."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cliente = request.user.cliente_vinculado
        except Exception:
            return error_response(
                "SIN_PERFIL_CLIENTE",
                "Su cuenta no tiene un perfil de cliente asociado.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        pedidos = cliente.pedidos.order_by("-fecha_creacion")
        return success_response(data=PedidoSerializer(pedidos, many=True).data)


class MiPedidoDetalleView(APIView):
    """GET /api/v1/clientes/mis-pedidos/{id}/ — returns one order with items and state timeline."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            cliente = request.user.cliente_vinculado
        except Exception:
            return error_response(
                "SIN_PERFIL_CLIENTE",
                "Su cuenta no tiene un perfil de cliente asociado.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        try:
            pedido = cliente.pedidos.prefetch_related("items", "logs_estado").get(pk=pk)
        except Exception:
            return error_response(
                "RECURSO_NO_ENCONTRADO",
                "Pedido no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        data = PedidoSerializer(pedido).data
        return success_response(data=data)
