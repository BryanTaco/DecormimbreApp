from django.urls import path
from .views import (
    ClienteListCreateView, ClienteDetailView,
    ClientePedidosView, ClienteCotizacionesView,
)

urlpatterns = [
    path("", ClienteListCreateView.as_view(), name="clientes_list"),
    path("<uuid:pk>/", ClienteDetailView.as_view(), name="clientes_detail"),
    path("<uuid:pk>/pedidos/", ClientePedidosView.as_view(), name="clientes_pedidos"),
    path("<uuid:pk>/cotizaciones/", ClienteCotizacionesView.as_view(), name="clientes_cotizaciones"),
]
