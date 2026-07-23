from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from .models import Usuario, LogActividad, Notificacion, PushSubscription
from .serializers import (
    UsuarioSerializer, UsuarioCreateSerializer,
    UsuarioUpdateSerializer, PerfilUpdateSerializer, LogActividadSerializer,
    RegistroClienteSerializer, NotificacionSerializer,
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
        serializer = PerfilUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=UsuarioSerializer(request.user).data,
                message="Perfil actualizado.",
            )
        return validation_error_response(serializer)


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
        return validation_error_response(serializer)


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
        return validation_error_response(serializer)

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


class RegistroClienteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroClienteSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer)

        data = serializer.validated_data
        nombre_completo = f"{data['nombre'].strip()} {data['apellido'].strip()}"

        usuario = Usuario(
            email=data["email"],
            nombre=nombre_completo,
            rol="CLIENTE",
        )
        usuario.set_password(data["password"])
        usuario.save()

        from apps.clientes.models import Cliente
        Cliente.objects.create(
            nombre_completo=nombre_completo,
            email=data["email"],
            telefono=data["telefono"],
            cedula_ruc=data["cedula"],
            usuario_cuenta=usuario,
            creado_por=None,
        )

        return success_response(
            data={"id": str(usuario.id), "email": usuario.email, "nombre": usuario.nombre},
            message="Cuenta creada exitosamente.",
            status_code=status.HTTP_201_CREATED,
        )


class MisNotificacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # No leídas primero, luego las leídas recientes (máx. 20 en total).
        qs = Notificacion.objects.filter(
            destinatario=request.user,
        ).order_by("leida", "-fecha_creacion")[:20]
        return success_response(data=NotificacionSerializer(qs, many=True).data)


class MarcarNotificacionLeidaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notificacion = Notificacion.objects.get(pk=pk, destinatario=request.user)
        except Notificacion.DoesNotExist:
            return error_response(
                "RECURSO_NO_ENCONTRADO",
                "Notificación no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        notificacion.leida = True
        notificacion.save(update_fields=["leida"])
        return success_response(message="Notificación marcada como leída.")


# ── Web Push ───────────────────────────────────────────────────────────────────
class VapidPublicKeyView(APIView):
    """GET público: clave pública VAPID para suscribirse desde el navegador."""
    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings
        return success_response(data={"publicKey": getattr(settings, "VAPID_PUBLIC_KEY", "")})


class PushSubscribeView(APIView):
    """POST: guarda la suscripción Web Push del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get("endpoint")
        keys = request.data.get("keys") or {}
        p256dh, auth = keys.get("p256dh"), keys.get("auth")
        if not endpoint or not p256dh or not auth:
            return error_response("DATOS_INVALIDOS", "Suscripción incompleta.", status_code=400)
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={"usuario": request.user, "p256dh": p256dh, "auth": auth},
        )
        return success_response(message="Notificaciones activadas.")


class PushUnsubscribeView(APIView):
    """POST: elimina la suscripción del usuario."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get("endpoint")
        if endpoint:
            PushSubscription.objects.filter(endpoint=endpoint, usuario=request.user).delete()
        return success_response(message="Notificaciones desactivadas.")
