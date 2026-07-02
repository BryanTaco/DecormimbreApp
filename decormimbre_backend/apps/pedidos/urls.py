from django.urls import path
from .views import (
    PedidoListCreateView, PedidoDetailView, CambiarEstadoPedidoView,
    PedidoFichaTecnicaView, TareaFichaView, ItemPedidoCreateView, ItemPedidoDetailView,
    AlertaEntregaListView, AlertaEntregaRevisarView,
    MisTareasView, CompletarTareaView, TareasPedidoView, AsignarArtesanoTareaView,
)
from .sse import TrackingSSEAdminView

urlpatterns = [
    # Pedidos CRUD
    path("", PedidoListCreateView.as_view(), name="pedidos_list"),
    path("<uuid:pk>/", PedidoDetailView.as_view(), name="pedidos_detail"),
    path("<uuid:pk>/cambiar-estado/", CambiarEstadoPedidoView.as_view(), name="pedidos_estado"),
    path("<uuid:pk>/ficha-tecnica/", PedidoFichaTecnicaView.as_view(), name="pedidos_ficha"),

    # Ítems de pedido
    path("<uuid:pk>/items/", ItemPedidoCreateView.as_view(), name="pedidos_items_create"),
    path("<uuid:pk>/items/<uuid:item_id>/", ItemPedidoDetailView.as_view(), name="pedidos_items_detail"),

    # Alertas de entrega
    path("alertas/", AlertaEntregaListView.as_view(), name="alertas_entrega_list"),
    path("alertas/<uuid:pk>/revisar/", AlertaEntregaRevisarView.as_view(), name="alertas_entrega_revisar"),

    # Tareas de producción
    path("<uuid:pk>/tareas/", TareasPedidoView.as_view(), name="pedidos_tareas"),
    path("tareas/<uuid:tarea_id>/asignar/", AsignarArtesanoTareaView.as_view(), name="tareas_asignar"),
    path("tareas/<uuid:tarea_id>/completar/", CompletarTareaView.as_view(), name="tareas_completar"),
    path("tareas/<uuid:tarea_id>/ficha/", TareaFichaView.as_view(), name="tareas_ficha"),

    # Vista de artesano
    path("artesano/mis-tareas/", MisTareasView.as_view(), name="mis_tareas"),

    # SSE tiempo real (autenticado via ?token=<jwt>)
    path("<uuid:pk>/tracking/stream/", TrackingSSEAdminView.as_view(), name="tracking_sse"),
]
