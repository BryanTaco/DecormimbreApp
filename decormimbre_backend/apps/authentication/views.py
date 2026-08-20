import base64
import io
import pyotp
import qrcode
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError as DRFValidationError, AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from .models import Usuario, LogActividad, Notificacion, PushSubscription
from .serializers import (
    UsuarioSerializer, UsuarioCreateSerializer,
    UsuarioUpdateSerializer, PerfilUpdateSerializer, LogActividadSerializer,
    RegistroClienteSerializer, NotificacionSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdmin, IsAdminOrPropietario
from .throttles import LoginRateThrottle


def _tiene_codigo(exc, objetivo):
    """Busca recursivamente un código de error dentro de una excepción de DRF."""
    def walk(c):
        if isinstance(c, dict):
            return any(walk(v) for v in c.values())
        if isinstance(c, (list, tuple)):
            return any(walk(v) for v in c)
        return c == objetivo
    return walk(exc.get_codes())


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed:
            return error_response(
                "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        except DRFValidationError as e:
            if _tiene_codigo(e, "otp_required"):
                return success_response(
                    data={"otp_required": True},
                    message="Ingresa el código de tu app de autenticación.",
                )
            if _tiene_codigo(e, "otp_invalid"):
                return success_response(
                    data={"otp_required": True, "otp_error": "Código incorrecto. Intenta de nuevo."},
                    message="Código de verificación incorrecto.",
                )
            return error_response(
                "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        return success_response(
            data=serializer.validated_data, message="Autenticación exitosa.",
        )


# ── Verificación en dos pasos (TOTP) ──────────────────────────────────────────
class TwoFAStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data={"enabled": request.user.otp_enabled})


class TwoFASetupView(APIView):
    """Genera un secreto TOTP pendiente y devuelve el QR para escanear."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.otp_enabled:
            return error_response("2FA_YA_ACTIVO", "La verificación en dos pasos ya está activa.",
                                  status_code=status.HTTP_400_BAD_REQUEST)
        secret = pyotp.random_base32()
        user.otp_secret = secret
        user.save(update_fields=["otp_secret"])
        uri = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="Decormimbre")
        buf = io.BytesIO()
        qrcode.make(uri).save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        return success_response(data={
            "secret": secret,
            "otpauth_url": uri,
            "qr": f"data:image/png;base64,{qr_b64}",
        })


class TwoFAEnableView(APIView):
    """Confirma el código de la app para activar 2FA."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = (request.data.get("code") or "").strip()
        if not user.otp_secret:
            return error_response("2FA_SIN_CONFIGURAR", "Primero genera el código QR.",
                                  status_code=status.HTTP_400_BAD_REQUEST)
        if not pyotp.TOTP(user.otp_secret).verify(code, valid_window=1):
            return error_response("OTP_INVALIDO", "Código incorrecto. Verifica tu app de autenticación.",
                                  status_code=status.HTTP_400_BAD_REQUEST)
        user.otp_enabled = True
        user.save(update_fields=["otp_enabled"])
        return success_response(message="Verificación en dos pasos activada.")


class TwoFADisableView(APIView):
    """Desactiva 2FA (exige el código actual si está activo)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = (request.data.get("code") or "").strip()
        if user.otp_enabled and not pyotp.TOTP(user.otp_secret).verify(code, valid_window=1):
            return error_response("OTP_INVALIDO", "Código incorrecto.",
                                  status_code=status.HTTP_400_BAD_REQUEST)
        user.otp_enabled = False
        user.otp_secret = ""
        user.save(update_fields=["otp_enabled", "otp_secret"])
        return success_response(message="Verificación en dos pasos desactivada.")


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
