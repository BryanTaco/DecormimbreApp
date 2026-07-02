from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from utils.responses import success_response, error_response
from utils.pagination import StandardPagination
from .models import Usuario, LogActividad
from .serializers import (
    UsuarioSerializer, UsuarioCreateSerializer,
    UsuarioUpdateSerializer, LogActividadSerializer,
)
from .permissions import IsAdmin, IsAdminOrPropietario
from .throttles import LoginRateThrottle


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return success_response(
                data=response.data,
                message="Autenticación exitosa.",
                status_code=status.HTTP_200_OK,
            )
        return error_response(
            "CREDENCIALES_INVALIDAS",
            "Email o contraseña incorrectos.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data=UsuarioSerializer(request.user).data)

    def put(self, request):
        serializer = UsuarioUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=UsuarioSerializer(request.user).data,
                message="Perfil actualizado.",
            )
        return error_response("VALIDACION_ERROR", str(serializer.errors))


class UsuarioListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        usuarios = Usuario.objects.all().order_by("nombre")
        return success_response(data=UsuarioSerializer(usuarios, many=True).data)

    def post(self, request):
        serializer = UsuarioCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=serializer.data,
                message="Usuario creado.",
                status_code=status.HTTP_201_CREATED,
            )
        return error_response("VALIDACION_ERROR", str(serializer.errors))


class UsuarioDetailView(APIView):
    permission_classes = [IsAdmin]

    def _get_user(self, pk):
        try:
            return Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return None

    def put(self, request, pk):
        usuario = self._get_user(pk)
        if not usuario:
            return error_response("RECURSO_NO_ENCONTRADO", "Usuario no encontrado.", status_code=404)
        serializer = UsuarioUpdateSerializer(usuario, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=UsuarioSerializer(usuario).data, message="Usuario actualizado.")
        return error_response("VALIDACION_ERROR", str(serializer.errors))

    def delete(self, request, pk):
        usuario = self._get_user(pk)
        if not usuario:
            return error_response("RECURSO_NO_ENCONTRADO", "Usuario no encontrado.", status_code=404)
        if usuario == request.user:
            return error_response("OPERACION_INVALIDA", "No puede desactivar su propia cuenta.")
        usuario.activo = False
        usuario.save()
        return success_response(message="Usuario desactivado.")


class LogActividadListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        paginator = StandardPagination()
        qs = LogActividad.objects.select_related("usuario").all()
        modulo = request.query_params.get("modulo")
        accion = request.query_params.get("accion")
        if modulo:
            qs = qs.filter(modulo=modulo)
        if accion:
            qs = qs.filter(accion=accion)
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(LogActividadSerializer(page, many=True).data)
