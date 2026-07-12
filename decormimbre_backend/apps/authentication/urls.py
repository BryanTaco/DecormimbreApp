from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    CustomTokenObtainPairView, MeView,
    UsuarioListCreateView, UsuarioDetailView,
    RegistroClienteView, MisNotificacionesView, MarcarNotificacionLeidaView,
    VapidPublicKeyView, PushSubscribeView, PushUnsubscribeView,
)

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("me/", MeView.as_view(), name="me"),
    path("usuarios/", UsuarioListCreateView.as_view(), name="usuarios_list_create"),
    path("usuarios/<uuid:pk>/", UsuarioDetailView.as_view(), name="usuarios_detail"),
    path("registro/", RegistroClienteView.as_view(), name="registro_cliente"),
    path("notificaciones/", MisNotificacionesView.as_view(), name="mis_notificaciones"),
    path("notificaciones/<uuid:pk>/leer/", MarcarNotificacionLeidaView.as_view(), name="leer_notificacion"),
    # Web Push
    path("push/public-key/", VapidPublicKeyView.as_view(), name="push_public_key"),
    path("push/subscribe/", PushSubscribeView.as_view(), name="push_subscribe"),
    path("push/unsubscribe/", PushUnsubscribeView.as_view(), name="push_unsubscribe"),
]
