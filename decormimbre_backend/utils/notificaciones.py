"""
Sistema de notificaciones por email para Decormimbre.
Todos los métodos fallan silenciosamente para no romper flujos de negocio.
"""
from django.core.mail import send_mail, send_mass_mail
from django.conf import settings as django_settings


REMITENTE = getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@decormimbre.ec")
EMPRESA = "Decormimbre · Muebles Artesanales Ecológicos"


def _enviar(destinatario: str, asunto: str, cuerpo: str) -> bool:
    if not destinatario:
        return False
    try:
        send_mail(
            subject=f"[Decormimbre] {asunto}",
            message=cuerpo,
            from_email=REMITENTE,
            recipient_list=[destinatario],
            fail_silently=False,
        )
        return True
    except Exception:
        return False


def _enviar_masivo(mensajes: list) -> int:
    """mensajes = [(asunto, cuerpo, from, [destinatarios]), ...]"""
    if not mensajes:
        return 0
    try:
        return send_mass_mail(mensajes, fail_silently=False)
    except Exception:
        return 0


# ── Notificaciones al cliente ──────────────────────────────────────────────────

def notificar_pedido_listo(pedido) -> bool:
    """Cliente: su pedido está listo para ser entregado o retirado."""
    cliente = pedido.cliente
    if not cliente.email:
        return False

    entrega = (
        pedido.fecha_promesa_entrega.strftime("%d/%m/%Y")
        if pedido.fecha_promesa_entrega else "a coordinar"
    )
    cuerpo = f"""Estimado/a {cliente.nombre_completo},

Nos complace informarle que su pedido ya está listo.

  Número de pedido : {pedido.numero}
  Fecha de entrega : {entrega}
  Total            : ${pedido.total:,.2f}

Por favor comuníquese con nosotros para coordinar la entrega o el retiro.

Gracias por elegir {EMPRESA}.

---
Este es un mensaje automático, por favor no responda a este correo.
"""
    return _enviar(cliente.email, f"Pedido {pedido.numero} listo para entrega", cuerpo)


def notificar_pedido_confirmado(pedido) -> bool:
    """Cliente: su pedido fue confirmado y entra en producción."""
    cliente = pedido.cliente
    if not cliente.email:
        return False

    entrega = (
        pedido.fecha_promesa_entrega.strftime("%d/%m/%Y")
        if pedido.fecha_promesa_entrega else "a definir"
    )
    cuerpo = f"""Estimado/a {cliente.nombre_completo},

Su pedido ha sido confirmado y ha ingresado a producción.

  Número de pedido   : {pedido.numero}
  Fecha de entrega   : {entrega}
  Total              : ${pedido.total:,.2f}

Puede consultar el estado de su pedido en nuestro portal de seguimiento.

Gracias por confiar en {EMPRESA}.

---
Este es un mensaje automático, por favor no responda a este correo.
"""
    return _enviar(cliente.email, f"Pedido {pedido.numero} en producción", cuerpo)


def notificar_pedido_cancelado(pedido) -> bool:
    """Cliente: su pedido fue cancelado."""
    cliente = pedido.cliente
    if not cliente.email:
        return False

    cuerpo = f"""Estimado/a {cliente.nombre_completo},

Le informamos que su pedido {pedido.numero} ha sido cancelado.

Si tiene alguna pregunta, por favor contáctenos directamente.

{EMPRESA}
"""
    return _enviar(cliente.email, f"Pedido {pedido.numero} cancelado", cuerpo)


# ── Notificaciones al artesano ─────────────────────────────────────────────────

def notificar_inicio_produccion(pedido) -> int:
    """Artesanos asignados: el pedido acaba de entrar en producción."""
    destinatarios = set()
    if pedido.artesano_estructura and pedido.artesano_estructura.email:
        destinatarios.add((pedido.artesano_estructura.nombre, pedido.artesano_estructura.email))
    if pedido.artesano_tejido and pedido.artesano_tejido.email:
        destinatarios.add((pedido.artesano_tejido.nombre, pedido.artesano_tejido.email))

    if not destinatarios:
        return 0

    enviados = 0
    for nombre, email in destinatarios:
        cuerpo = f"""Hola {nombre},

Se ha iniciado la producción del pedido {pedido.numero}.

Ingresa al sistema para ver los detalles de tu tarea asignada:
  - Medidas, colores y especificaciones de cada ítem
  - Fecha de entrega comprometida al cliente

Por favor marca tu tarea como completada cuando termines.

{EMPRESA}
"""
        if _enviar(email, f"Nueva tarea — Pedido {pedido.numero}", cuerpo):
            enviados += 1
    return enviados


def notificar_tarea_asignada(tarea) -> bool:
    """Artesano: se le asignó (o reasignó) una tarea."""
    artesano = tarea.artesano
    if not artesano or not artesano.email:
        return False

    pedido = tarea.pedido
    entrega = (
        pedido.fecha_promesa_entrega.strftime("%d/%m/%Y")
        if pedido.fecha_promesa_entrega else "a definir"
    )
    cuerpo = f"""Hola {artesano.nombre},

Se te ha asignado la siguiente tarea:

  Pedido   : {pedido.numero}
  Tarea    : {tarea.get_tipo_display()}
  Estado   : {tarea.get_estado_display()}
  Entrega  : {entrega}

Ingresa al sistema para ver todos los detalles del pedido.

{EMPRESA}
"""
    return _enviar(artesano.email, f"Tarea asignada — {tarea.get_tipo_display()}", cuerpo)


def notificar_tarea_completada_a_admin(tarea, administradores) -> int:
    """Admin/propietario: un artesano completó su tarea."""
    if not administradores:
        return 0

    artesano_nombre = tarea.artesano.nombre if tarea.artesano else "Sin asignar"
    pedido = tarea.pedido
    mensajes = []
    for admin in administradores:
        if not admin.email:
            continue
        cuerpo = (
            f"El artesano {artesano_nombre} completó la tarea "
            f"'{tarea.get_tipo_display()}' del pedido {pedido.numero}.\n\n"
            f"Estado del pedido: {pedido.get_estado_display()}\n"
            f"Progreso: {pedido.porcentaje_completado()}% completado\n"
        )
        mensajes.append((
            f"[Decormimbre] Tarea completada — Pedido {pedido.numero}",
            cuerpo,
            REMITENTE,
            [admin.email],
        ))
    return _enviar_masivo(mensajes)
