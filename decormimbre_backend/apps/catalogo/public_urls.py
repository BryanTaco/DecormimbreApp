from django.urls import path
from .public_views import CotizacionRapidaView

urlpatterns = [
    path("cotizacion-rapida/", CotizacionRapidaView.as_view(), name="cotizacion_rapida"),
]
