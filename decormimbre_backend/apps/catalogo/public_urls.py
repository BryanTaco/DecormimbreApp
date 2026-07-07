from django.urls import path
from .public_views import CotizacionRapidaView
from .asistente_views import AsistenteView

urlpatterns = [
    path("cotizacion-rapida/", CotizacionRapidaView.as_view(), name="cotizacion_rapida"),
    path("asistente/", AsistenteView.as_view(), name="asistente"),
]
