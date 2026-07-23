from django.urls import path
from .views import (
    CotizacionListCreateView, CotizacionDetailView,
    CambiarEstadoCotizacionView, CotizacionPDFView,
    VersionesCotizacionView, ItemCotizacionCreateView,
    ItemCotizacionDetailView,
    SolicitudRapidaListView, SolicitudRapidaConvertirView,
)

urlpatterns = [
    path("", CotizacionListCreateView.as_view(), name="cotizaciones_list"),
    path("solicitudes/", SolicitudRapidaListView.as_view(), name="solicitudes_list"),
    path("solicitudes/<uuid:pk>/convertir/", SolicitudRapidaConvertirView.as_view(), name="solicitudes_convertir"),
    path("<uuid:pk>/", CotizacionDetailView.as_view(), name="cotizaciones_detail"),
    path("<uuid:pk>/cambiar-estado/", CambiarEstadoCotizacionView.as_view(), name="cotizaciones_estado"),
    path("<uuid:pk>/pdf/", CotizacionPDFView.as_view(), name="cotizaciones_pdf"),
    path("<uuid:pk>/versiones/", VersionesCotizacionView.as_view(), name="cotizaciones_versiones"),
    path("<uuid:pk>/items/", ItemCotizacionCreateView.as_view(), name="cotizaciones_items_create"),
    path("<uuid:pk>/items/<uuid:item_id>/", ItemCotizacionDetailView.as_view(), name="cotizaciones_items_detail"),
]
