"""
Server-Sent Events para tracking de pedidos en tiempo real.
No requiere Redis ni Django Channels — usa long-polling sobre WSGI con StreamingHttpResponse.
"""
import json
import time
from django.core.cache import cache
from django.http import StreamingHttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Pedido


INTERVALO_POLL = 5  # segundos entre consultas a la BD
TIMEOUT_MAX = 300    # cierra la conexión tras 5 min (cliente reconecta)

# Límite de conexiones SSE simultáneas por IP (previene agotamiento de workers).
# NOTA: con gunicorn WSGI síncrono cada conexión SSE ocupa un worker durante
# hasta TIMEOUT_MAX segundos. En producción se debe usar un worker asíncrono
# (--worker-class gevent) para que estas conexiones no bloqueen el servidor.
MAX_SSE_POR_IP = 3
SSE_LOCK_TTL = TIMEOUT_MAX + 10


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _snapshot_pedido(pedido):
    """Devuelve un dict con el estado actual del pedido para SSE."""
    pedido.refresh_from_db()
    tareas = list(
        pedido.tareas.values(
            "tipo", "estado", "artesano__nombre", "iniciada_en", "completada_en"
        )
    )
    return {
        "numero": pedido.numero,
        "estado": pedido.estado,
        "etapa_produccion": pedido.etapa_produccion,
        "porcentaje_completado": pedido.porcentaje_completado(),
        "fecha_promesa_entrega": (
            pedido.fecha_promesa_entrega.isoformat() if pedido.fecha_promesa_entrega else None
        ),
        "tareas": [
            {
                "tipo": t["tipo"],
                "estado": t["estado"],
                "artesano": t["artesano__nombre"],
                "iniciada_en": t["iniciada_en"].isoformat() if t["iniciada_en"] else None,
                "completada_en": t["completada_en"].isoformat() if t["completada_en"] else None,
            }
            for t in tareas
        ],
    }


def _sse_stream(pedido, on_close=None):
    """Generador que emite eventos SSE hasta que el pedido está en estado final."""
    estados_finales = {"ENTREGADO", "CANCELADO"}
    elapsed = 0
    ultimo_estado = None

    try:
        while elapsed < TIMEOUT_MAX:
            snapshot = _snapshot_pedido(pedido)
            estado_actual = snapshot["estado"]

            # Solo emitir si hay cambio (o es la primera vez)
            if snapshot != ultimo_estado:
                payload = json.dumps(snapshot, ensure_ascii=False)
                yield f"data: {payload}\n\n"
                ultimo_estado = snapshot

            if estado_actual in estados_finales:
                yield "event: fin\ndata: {}\n\n"
                return

            time.sleep(INTERVALO_POLL)
            elapsed += INTERVALO_POLL

        # Timeout — indica al cliente que reconecte
        yield "event: timeout\ndata: {}\n\n"
    finally:
        if on_close is not None:
            on_close()


@method_decorator(csrf_exempt, name="dispatch")
class TrackingSSEPublicoView(View):
    """
    SSE público. El cliente pasa ?numero=PED-000001&cedula=0900168568
    No requiere token JWT.
    """

    def get(self, request):
        from utils.responses import error_response

        numero = request.GET.get("numero", "").strip()
        cedula = request.GET.get("cedula", "").strip()
        if not numero or not cedula:
            return error_response(
                "PARAMETROS_REQUERIDOS",
                "Se requieren 'numero' y 'cedula'.",
                status_code=400,
            )

        # Límite de conexiones SSE simultáneas por IP (anti-DoS / anti-enumeración)
        ip = _client_ip(request)
        lock_key = f"sse_conn_{ip}"
        actuales = cache.get(lock_key, 0)
        if actuales >= MAX_SSE_POR_IP:
            return error_response(
                "LIMITE_CONEXIONES",
                "Demasiadas conexiones de seguimiento simultáneas. Intente más tarde.",
                status_code=429,
            )

        try:
            pedido = Pedido.objects.prefetch_related("tareas").get(
                numero=numero, cliente__cedula_ruc=cedula
            )
        except Pedido.DoesNotExist:
            return error_response(
                "PEDIDO_NO_ENCONTRADO",
                "No se encontró un pedido con ese número y cédula.",
                status_code=404,
            )

        cache.set(lock_key, actuales + 1, SSE_LOCK_TTL)

        def _release():
            restante = cache.get(lock_key, 1) - 1
            if restante > 0:
                cache.set(lock_key, restante, SSE_LOCK_TTL)
            else:
                cache.delete(lock_key)

        response = StreamingHttpResponse(
            _sse_stream(pedido, on_close=_release), content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


@method_decorator(csrf_exempt, name="dispatch")
class TrackingSSEAdminView(View):
    """
    SSE autenticado (admin/propietario/artesano).
    El cliente pasa el JWT como query param ?token=<access_token>
    porque EventSource del browser no soporta headers personalizados.

    NOTA DE SEGURIDAD: pasar el JWT en la URL puede filtrarlo a logs de acceso,
    proxies y cabeceras Referer. Mitigación actual: el access token es de vida
    corta (15 min). Mitigación recomendada a futuro: emitir un "ticket" SSE de un
    solo uso y corta duración en vez del access token, o usar fetch + ReadableStream.
    """

    def get(self, request, pk):
        # Autenticar via query param token (JWT access token)
        token_str = request.GET.get("token", "").strip()
        if not token_str:
            from django.http import HttpResponse
            return HttpResponse("No autorizado — se requiere ?token=<jwt>", status=401)

        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError
        from apps.authentication.models import Usuario
        try:
            access = AccessToken(token_str)
            user_id = access["user_id"]
            user = Usuario.objects.get(pk=user_id)
        except (TokenError, KeyError, Usuario.DoesNotExist):
            from django.http import HttpResponse
            return HttpResponse("Token inválido o expirado.", status=401)

        if user.rol not in ("ADMIN", "PROPIETARIO", "ARTESANO"):
            from django.http import HttpResponse
            return HttpResponse("Acceso denegado.", status=403)

        try:
            pedido = Pedido.objects.prefetch_related("tareas").get(pk=pk)
        except Pedido.DoesNotExist:
            from django.http import HttpResponse
            return HttpResponse("Pedido no encontrado.", status=404)

        response = StreamingHttpResponse(
            _sse_stream(pedido), content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
