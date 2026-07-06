from django.urls import path
from .views import (
    ClienteListCreateView, ClienteDetailView,
    ClientePedidosView, ClienteCotizacionesView,
)
from .portal_views import MisCotizacionesView, MisPedidosView, MiPedidoDetalleView

urlpatterns = [
    path("", ClienteListCreateView.as_view(), name="clientes_list"),
    path("<uuid:pk>/", ClienteDetailView.as_view(), name="clientes_detail"),
    path("<uuid:pk>/pedidos/", ClientePedidosView.as_view(), name="clientes_pedidos"),
    path("<uuid:pk>/cotizaciones/", ClienteCotizacionesView.as_view(), name="clientes_cotizaciones"),
    # Portal del cliente autenticado
    path("mis-cotizaciones/", MisCotizacionesView.as_view(), name="mis_cotizaciones"),
    path("mis-pedidos/", MisPedidosView.as_view(), name="mis_pedidos"),
    path("mis-pedidos/<uuid:pk>/", MiPedidoDetalleView.as_view(), name="mi_pedido_detalle"),
]
