from django.urls import path
from .public_views import CotizacionRapidaView
from .asistente_views import AsistenteView
from .cotizador_views import CotizadorProductosView, CotizarView

urlpatterns = [
    path("cotizacion-rapida/", CotizacionRapidaView.as_view(), name="cotizacion_rapida"),
    path("asistente/", AsistenteView.as_view(), name="asistente"),
    path("cotizador/productos/", CotizadorProductosView.as_view(), name="cotizador_productos"),
    path("cotizador/", CotizarView.as_view(), name="cotizador"),
]
