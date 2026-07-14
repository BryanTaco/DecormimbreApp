"""Envío de notificaciones Web Push (VAPID). Falla en silencio para no romper flujos."""
import json
from django.conf import settings


def enviar_push(usuario, titulo, mensaje, url="/cuenta") -> int:
    """Envía una notificación push a todas las suscripciones del usuario. Devuelve cuántas se enviaron."""
    if usuario is None or not getattr(settings, "VAPID_PRIVATE_KEY", ""):
        return 0
    try:
        from pywebpush import webpush, WebPushException
        from py_vapid import Vapid
    except ImportError:
        return 0

    # pywebpush interpreta un str como clave base64url cruda, NO como PEM;
    # el objeto Vapid se construye explícitamente desde el PEM del .env.
    try:
        vapid = Vapid.from_pem(settings.VAPID_PRIVATE_KEY.encode())
    except Exception:
        return 0

    payload = json.dumps({"title": titulo, "body": mensaje, "url": url})
    enviados = 0
    for sub in usuario.push_subscriptions.all():
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=payload,
                vapid_private_key=vapid,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
            enviados += 1
        except WebPushException as exc:
            resp = getattr(exc, "response", None)
            if resp is not None and resp.status_code in (404, 410):
                sub.delete()  # suscripción caducada
        except Exception:
            pass
    return enviados
