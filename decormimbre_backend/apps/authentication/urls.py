from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    CustomTokenObtainPairView, MeView,
    UsuarioListCreateView, UsuarioDetailView,
)

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("me/", MeView.as_view(), name="me"),
    path("usuarios/", UsuarioListCreateView.as_view(), name="usuarios_list_create"),
    path("usuarios/<uuid:pk>/", UsuarioDetailView.as_view(), name="usuarios_detail"),
]
