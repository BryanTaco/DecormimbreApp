from django.urls import path
from apps.pedidos.views import TrackingPublicoView
from apps.pedidos.sse import TrackingSSEPublicoView

app_name = "public"

urlpatterns = [
    path("pedidos/tracking/", TrackingPublicoView.as_view(), name="pedidos_tracking"),
    path("pedidos/tracking/stream/", TrackingSSEPublicoView.as_view(), name="pedidos_tracking_sse"),
]
