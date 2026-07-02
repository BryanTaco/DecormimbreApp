def registrar_actividad(
    usuario,
    modulo: str,
    accion: str,
    entidad_id="",
    descripcion: str = "",
    datos_anteriores=None,
    datos_nuevos=None,
    request=None,
):
    """
    Escribe una entrada en LogActividad.

    Uso típico desde una vista:
        registrar_actividad(
            request.user, "PEDIDOS", "CAMBIO_ESTADO",
            entidad_id=str(pedido.pk),
            descripcion=f"Estado cambiado a {pedido.estado}",
            request=request,
        )
    """
    from apps.authentication.models import LogActividad

    ip = None
    if request:
        ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()

    try:
        LogActividad.objects.create(
            usuario=usuario,
            modulo=modulo,
            accion=accion,
            entidad_id=str(entidad_id),
            descripcion=descripcion,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip_address=ip,
        )
    except Exception:
        pass
