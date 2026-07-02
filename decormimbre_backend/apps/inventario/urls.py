from django.urls import path
from .views import (
    MateriaPrimaListCreateView, MateriaPrimaDetailView,
    LoteListCreateView, MovimientoListView,
    AjusteCreateView, AlertaStockListView, AlertaStockRevisarView,
)

urlpatterns = [
    path("materias/", MateriaPrimaListCreateView.as_view(), name="materias_list"),
    path("materias/<uuid:pk>/", MateriaPrimaDetailView.as_view(), name="materias_detail"),
    path("lotes/", LoteListCreateView.as_view(), name="lotes_list"),
    path("movimientos/", MovimientoListView.as_view(), name="movimientos_list"),
    path("ajustes/", AjusteCreateView.as_view(), name="ajustes_create"),
    path("alertas/", AlertaStockListView.as_view(), name="alertas_stock"),
    path("alertas/<int:pk>/revisar/", AlertaStockRevisarView.as_view(), name="alertas_revisar"),
]
