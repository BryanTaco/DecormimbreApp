from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from utils.log_actividad import registrar_actividad
from utils.notificaciones import (
    notificar_pedido_listo, notificar_pedido_confirmado, notificar_pedido_cancelado, notificar_pedido_entregado,
    notificar_inicio_produccion, notificar_tarea_asignada, notificar_tarea_completada_a_admin,
    notificacion_app_cliente, notificar_avance_etapa,
)
from apps.authentication.permissions import (
    IsAdminOrPropietario, IsArtesano, IsAdminOrPropietarioOrArtesano,
)
from .models import Pedido, ItemPedido, AlertaEntrega, TareaProduccion
from .serializers import (
    PedidoSerializer, ItemPedidoSerializer, AlertaEntregaSerializer,
    PedidoPublicoSerializer, CambiarEstadoPedidoSerializer,
    TareaProduccionSerializer, CompletarTareaSerializer, AgregarTareaSerializer,
)
from .ficha_tecnica import generar_ficha_tecnica, generar_ficha_tejedor, generar_ficha_estructurista


class PedidoListCreateView(ListCreateAPIView):
    serializer_class = PedidoSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Pedido.objects.select_related("cliente", "creado_por").prefetch_related("tareas")
        if estado := self.request.query_params.get("estado"):
            qs = qs.filter(estado=estado)
        if cliente := self.request.query_params.get("cliente"):
            qs = qs.filter(cliente__id=cliente)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save(creado_por=request.user)
            return success_response(data=s.data, message="Pedido creado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class PedidoDetailView(RetrieveUpdateAPIView):
    serializer_class = PedidoSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Pedido.objects.prefetch_related("items", "logs_estado", "tareas")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        pedido = self.get_object()
        if pedido.estado not in ("PENDIENTE", "EN_PRODUCCION"):
            return error_response(
                "PEDIDO_NO_EDITABLE",
                f"No se puede editar un pedido en estado {pedido.estado}.",
            )
        s = self.get_serializer(pedido, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Pedido actualizado.")
        return validation_error_response(s)


class CambiarEstadoPedidoView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def post(self, request, pk):
        from django.db import transaction
        pedido = get_object_or_404(Pedido, pk=pk)
        s = CambiarEstadoPedidoSerializer(data=request.data)
        if not s.is_valid():
            return validation_error_response(s)
        nuevo_estado = s.validated_data["nuevo_estado"]
        estado_anterior = pedido.estado
        try:
            with transaction.atomic():
                pedido.cambiar_estado(nuevo_estado, request.user)
                if nuevo_estado == "EN_PRODUCCION":
                    pedido._descontar_inventario()
        except DjangoValidationError as e:
            return error_response("TRANSICION_INVALIDA", str(e.message))
        registrar_actividad(
            request.user, "PEDIDOS", "CAMBIO_ESTADO",
            entidad_id=pedido.pk,
            descripcion=f"Pedido {pedido.numero}: {estado_anterior} → {pedido.estado}",
            request=request,
        )
        # Notificaciones al cliente (in-app + email) y artesanos según estado
        if nuevo_estado == "EN_PRODUCCION":
            notificar_pedido_confirmado(pedido)
            notificar_inicio_produccion(pedido)
            notificacion_app_cliente(pedido, "PEDIDO_EN_PRODUCCION", f"Pedido {pedido.numero} en producción", "Tu pedido fue confirmado y entró en producción.")
        elif nuevo_estado == "LISTO_ENTREGA":
            notificar_pedido_listo(pedido)
            notificacion_app_cliente(pedido, "PEDIDO_LISTO", f"Pedido {pedido.numero} listo", "Tu pedido está listo para entrega o retiro.")
        elif nuevo_estado == "ENTREGADO":
            notificar_pedido_entregado(pedido)
            notificacion_app_cliente(pedido, "PEDIDO_ENTREGADO", f"Pedido {pedido.numero} entregado", "Tu pedido fue entregado. ¡Gracias por confiar en Decormimbre!")
        elif nuevo_estado == "CANCELADO":
            notificar_pedido_cancelado(pedido)
            notificacion_app_cliente(pedido, "PEDIDO_CANCELADO", f"Pedido {pedido.numero} cancelado", "Tu pedido fue cancelado. Escríbenos si tienes dudas.")

        return success_response(
            data=PedidoSerializer(pedido).data,
            message=f"Estado cambiado a {pedido.estado}.",
        )


class PedidoFichaTecnicaView(APIView):
    """
    Ficha técnica PDF de un pedido.
    Query param opcional: ?rol=TEJIDO | ?rol=ESTRUCTURA
    Sin query param devuelve la ficha completa (admin).
    """
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def get(self, request, pk):
        pedido = get_object_or_404(
            Pedido.objects.select_related(
                "cliente", "artesano_estructura", "artesano_tejido"
            ).prefetch_related("items__producto", "items__color"),
            pk=pk,
        )
        rol = request.query_params.get("rol", "").upper()
        try:
            if rol == "TEJIDO":
                pdf_bytes = generar_ficha_tejedor(pedido)
                nombre = f"ficha-tejedor-{pedido.numero}.pdf"
            elif rol == "ESTRUCTURA":
                pdf_bytes = generar_ficha_estructurista(pedido)
                nombre = f"ficha-estructura-{pedido.numero}.pdf"
            else:
                pdf_bytes = generar_ficha_tecnica(pedido)
                nombre = f"ficha-{pedido.numero}.pdf"
        except Exception as e:
            return error_response("PDF_ERROR", f"Error generando ficha técnica: {str(e)}", status_code=500)
        from django.http import HttpResponse
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{nombre}"'
        return response


class TareaFichaView(APIView):
    """Ficha PDF específica para la tarea del artesano (acceso directo desde mis-tareas)."""
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def get(self, request, tarea_id):
        tarea = get_object_or_404(TareaProduccion, pk=tarea_id)

        if request.user.is_artesano and tarea.artesano != request.user:
            return error_response("ACCESO_DENEGADO", "Esta tarea no te pertenece.", status_code=403)

        pedido = get_object_or_404(
            Pedido.objects.select_related(
                "cliente", "artesano_estructura", "artesano_tejido"
            ).prefetch_related("items__producto", "items__color"),
            pk=tarea.pedido_id,
        )
        try:
            if tarea.tipo == "TEJIDO":
                pdf_bytes = generar_ficha_tejedor(pedido)
                nombre = f"tarea-tejido-{pedido.numero}.pdf"
            elif tarea.tipo == "ESTRUCTURA":
                pdf_bytes = generar_ficha_estructurista(pedido)
                nombre = f"tarea-estructura-{pedido.numero}.pdf"
            else:
                pdf_bytes = generar_ficha_tecnica(pedido)
                nombre = f"tarea-{tarea.tipo.lower()}-{pedido.numero}.pdf"
        except Exception as e:
            return error_response("PDF_ERROR", str(e), status_code=500)

        from django.http import HttpResponse
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{nombre}"'
        return response


class ItemPedidoCreateView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def post(self, request, pk):
        pedido = get_object_or_404(Pedido, pk=pk)
        if pedido.estado not in ("PENDIENTE",):
            return error_response("PEDIDO_NO_EDITABLE", "Solo se pueden agregar ítems a pedidos en PENDIENTE.")
        s = ItemPedidoSerializer(data=request.data)
        if s.is_valid():
            s.save(pedido=pedido)
            pedido.calcular_totales()
            return success_response(data=s.data, message="Ítem agregado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class ItemPedidoDetailView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def _get_item(self, pk, item_id):
        return get_object_or_404(ItemPedido, pk=item_id, pedido__id=pk)

    def put(self, request, pk, item_id):
        item = self._get_item(pk, item_id)
        if item.pedido.estado not in ("PENDIENTE",):
            return error_response("PEDIDO_NO_EDITABLE", "Solo se puede editar ítems en PENDIENTE.")
        s = ItemPedidoSerializer(item, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            item.pedido.calcular_totales()
            return success_response(data=s.data, message="Ítem actualizado.")
        return validation_error_response(s)

    def delete(self, request, pk, item_id):
        item = self._get_item(pk, item_id)
        if item.pedido.estado not in ("PENDIENTE",):
            return error_response("PEDIDO_NO_EDITABLE", "Solo se puede eliminar ítems en PENDIENTE.")
        pedido = item.pedido
        item.delete()
        pedido.calcular_totales()
        return success_response(message="Ítem eliminado.")


class AlertaEntregaListView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request):
        solo_no_revisadas = request.query_params.get("no_revisadas") == "1"
        qs = AlertaEntrega.objects.select_related("pedido")
        if solo_no_revisadas:
            qs = qs.filter(revisada=False)
        return success_response(data=AlertaEntregaSerializer(qs, many=True).data)


class AlertaEntregaRevisarView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def put(self, request, pk):
        alerta = get_object_or_404(AlertaEntrega, pk=pk)
        alerta.revisada = True
        alerta.save(update_fields=["revisada"])
        return success_response(message="Alerta marcada como revisada.")


class TrackingPublicoView(APIView):
    """Endpoint público — sin autenticación. Consulta por número de pedido.

    Throttled por IP para prevenir enumeración de cédulas/RUC (fuga de PII).
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "tracking"

    def get(self, request):
        numero = request.query_params.get("numero", "").strip()
        cedula = request.query_params.get("cedula", "").strip()
        if not numero or not cedula:
            return error_response(
                "PARAMETROS_REQUERIDOS",
                "Se requieren los parámetros 'numero' y 'cedula'.",
                status_code=400,
            )
        try:
            pedido = Pedido.objects.select_related("cliente").prefetch_related(
                "items__producto", "items__color", "tareas"
            ).get(numero=numero, cliente__cedula_ruc=cedula)
        except Pedido.DoesNotExist:
            return error_response(
                "PEDIDO_NO_ENCONTRADO",
                "No se encontró un pedido con ese número y cédula/RUC.",
                status_code=404,
            )
        return success_response(data=PedidoPublicoSerializer(pedido).data)


class SeguimientoTokenView(APIView):
    """Endpoint público — seguimiento por token opaco: /seguimiento/<tracking_token>."""
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "tracking"

    def get(self, request, token):
        try:
            pedido = Pedido.objects.select_related("cliente").prefetch_related(
                "items__producto", "items__color", "tareas"
            ).get(tracking_token=token)
        except Pedido.DoesNotExist:
            return error_response("PEDIDO_NO_ENCONTRADO", "Enlace de seguimiento no válido.", status_code=404)
        return success_response(data=PedidoPublicoSerializer(pedido).data)


# ──────────────────────────────────────────────
# VISTAS DE ARTESANO
# ──────────────────────────────────────────────

def _estado_produccion_tarea(tarea):
    """Info de espera (etapas previas incompletas) y verificación de materiales/inventario."""
    from decimal import Decimal
    from apps.inventario.models import ProductoMateria
    pedido = tarea.pedido

    previa = (TareaProduccion.objects
              .filter(pedido=pedido, orden__lt=tarea.orden)
              .exclude(estado="COMPLETADA")
              .order_by("orden").first())

    req: dict[str, dict] = {}
    for item in pedido.items.select_related("producto").all():
        for pm in ProductoMateria.objects.filter(producto=item.producto).select_related("materia_prima"):
            m = pm.materia_prima
            e = req.setdefault(str(m.id), {"nombre": m.nombre, "unidad": m.get_unidad_display(),
                                           "requerido": Decimal("0"), "disponible": m.stock_actual})
            e["requerido"] += pm.cantidad_por_unidad * item.cantidad

    materiales, requiere_pedido = [], False
    for e in req.values():
        suficiente = e["disponible"] >= e["requerido"]
        requiere_pedido = requiere_pedido or not suficiente
        materiales.append({
            "nombre": e["nombre"], "unidad": e["unidad"],
            "requerido": str(e["requerido"].normalize()), "disponible": str(e["disponible"].normalize()),
            "faltante": str((e["requerido"] - e["disponible"]).normalize()) if not suficiente else "0",
            "suficiente": suficiente,
        })
    return {
        "esperando": previa.get_tipo_display() if previa else None,
        "bloqueada": previa is not None,
        "materiales": materiales,
        "requiere_pedido": requiere_pedido,
    }


class MisTareasView(APIView):
    """GET: artesano ve sus tareas activas y pendientes."""
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def get(self, request):
        if request.user.is_artesano:
            qs = TareaProduccion.objects.filter(
                artesano=request.user,
                estado__in=["EN_PROCESO", "PENDIENTE"],
            ).select_related("pedido__cliente").order_by("estado", "pedido__fecha_promesa_entrega")
        else:
            # Admin/propietario ve todas
            qs = TareaProduccion.objects.filter(
                estado__in=["EN_PROCESO", "PENDIENTE"],
            ).select_related("pedido__cliente", "artesano").order_by("pedido__numero", "orden")

        data = []
        for tarea in qs:
            pedido = tarea.pedido
            data.append({
                "tarea_id": str(tarea.id),
                "tipo": tarea.tipo,
                "tipo_display": tarea.get_tipo_display(),
                "estado": tarea.estado,
                "pedido_numero": pedido.numero,
                "pedido_id": str(pedido.id),
                "cliente": pedido.cliente.nombre_completo,
                "fecha_promesa_entrega": (
                    pedido.fecha_promesa_entrega.isoformat()
                    if pedido.fecha_promesa_entrega else None
                ),
                "items": [
                    {
                        "producto": str(item.producto),
                        "cantidad": item.cantidad,
                        "ancho_cm": str(item.ancho_cm) if item.ancho_cm else None,
                        "alto_cm": str(item.alto_cm) if item.alto_cm else None,
                        "largo_cm": str(item.largo_cm) if item.largo_cm else None,
                        "color": str(item.color) if item.color else None,
                        "observaciones": item.observaciones,
                    }
                    for item in pedido.items.select_related("producto", "color").all()
                ],
                "iniciada_en": tarea.iniciada_en.isoformat() if tarea.iniciada_en else None,
                "notas": tarea.notas,
                **_estado_produccion_tarea(tarea),
            })
        return success_response(data=data)


class CompletarTareaView(APIView):
    """POST: artesano marca su tarea como completada."""
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def post(self, request, tarea_id):
        tarea = get_object_or_404(TareaProduccion, pk=tarea_id)

        # Artesano solo puede completar sus propias tareas
        if request.user.is_artesano and tarea.artesano != request.user:
            return error_response("ACCESO_DENEGADO", "Esta tarea no te pertenece.", status_code=403)

        if tarea.estado == "COMPLETADA":
            return error_response("TAREA_YA_COMPLETADA", "Esta tarea ya fue completada.")

        if tarea.estado == "PENDIENTE":
            return error_response(
                "TAREA_NO_INICIADA",
                "La tarea aún está pendiente. Debe estar en proceso para completarse.",
            )

        s = CompletarTareaSerializer(data=request.data)
        if not s.is_valid():
            return validation_error_response(s)

        try:
            tarea.completar(request.user, notas=s.validated_data.get("notas", ""))
        except DjangoValidationError as e:
            return error_response("ERROR", str(e.message))

        tarea.refresh_from_db()
        registrar_actividad(
            request.user, "PEDIDOS", "TAREA_COMPLETADA",
            entidad_id=tarea.pedido.pk,
            descripcion=f"Tarea {tarea.get_tipo_display()} completada — Pedido {tarea.pedido.numero}",
            request=request,
        )
        # Notificar a admins/propietarios
        from apps.authentication.models import Usuario
        admins = list(Usuario.objects.filter(rol__in=["ADMIN", "PROPIETARIO"], activo=True))
        notificar_tarea_completada_a_admin(tarea, admins)

        # Notificar al cliente el avance (o el "listo" si fue la última etapa)
        pedido = tarea.pedido
        pedido.refresh_from_db()
        if pedido.estado == "LISTO_ENTREGA":
            notificar_pedido_listo(pedido)
            notificacion_app_cliente(pedido, "PEDIDO_LISTO", f"Pedido {pedido.numero} listo", "Tu pedido está listo para entrega o retiro.")
        else:
            etapa = pedido.get_etapa_produccion_display() if pedido.etapa_produccion else "En producción"
            notificar_avance_etapa(pedido, etapa)

        return success_response(
            data=TareaProduccionSerializer(tarea).data,
            message=f"Tarea '{tarea.get_tipo_display()}' marcada como completada.",
        )


class SolicitarMaterialView(APIView):
    """POST: el artesano avisa a administración que falta material/color para pedir al proveedor."""
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def post(self, request, tarea_id):
        from apps.authentication.models import Usuario, Notificacion
        tarea = get_object_or_404(TareaProduccion, pk=tarea_id)
        if request.user.is_artesano and tarea.artesano != request.user:
            return error_response("ACCESO_DENEGADO", "Esta tarea no te pertenece.", status_code=403)

        info = _estado_produccion_tarea(tarea)
        faltantes = [m for m in info["materiales"] if not m["suficiente"]]
        pedido = tarea.pedido
        colores = ", ".join(sorted({i.color.nombre for i in pedido.items.select_related("color").all() if i.color}))
        nota = (request.data.get("nota") or "").strip()

        detalle = "; ".join(f"{m['nombre']} (faltan {m['faltante']} {m['unidad']})" for m in faltantes) or "material para el tejido"
        titulo = f"Solicitud de material — {pedido.numero}"
        mensaje = (
            f"{request.user.nombre} (tejido) solicita material para {pedido.numero}. "
            f"Faltante: {detalle}. Color pedido: {colores or 'a definir'}. "
            f"Revisar inventario y pedir al proveedor." + (f" Nota: {nota}" if nota else "")
        )
        objetivos = Usuario.objects.filter(rol__in=["ADMIN", "PROPIETARIO"], activo=True)
        creadas = 0
        for u in objetivos:
            Notificacion.objects.create(
                destinatario=u, tipo="ALERTA_INVENTARIO", titulo=titulo, mensaje=mensaje,
                para_propietario=True, entidad_tipo="pedido", entidad_id=str(pedido.id),
            )
            creadas += 1
        return success_response(
            data={"faltantes": faltantes, "color": colores, "avisos_enviados": creadas},
            message="Solicitud enviada a administración para pedir al proveedor.",
        )


class TareasPedidoView(APIView):
    """
    GET: lista las tareas de un pedido (admin/propietario/artesano).
    POST: admin agrega una tarea extra (ej. COJINES) a un pedido en producción.
    """
    permission_classes = [IsAdminOrPropietarioOrArtesano]

    def get(self, request, pk):
        pedido = get_object_or_404(Pedido, pk=pk)
        tareas = TareaProduccion.objects.filter(pedido=pedido).select_related("artesano")
        return success_response(data=TareaProduccionSerializer(tareas, many=True).data)

    def post(self, request, pk):
        if not (request.user.rol in ("ADMIN", "PROPIETARIO")):
            return error_response("ACCESO_DENEGADO", "Solo admin/propietario puede agregar tareas.", status_code=403)

        pedido = get_object_or_404(Pedido, pk=pk)
        if pedido.estado != "EN_PRODUCCION":
            return error_response(
                "PEDIDO_NO_EN_PRODUCCION",
                "Solo se pueden agregar tareas a pedidos en producción.",
            )

        s = AgregarTareaSerializer(data=request.data, context={"pedido": pedido})
        if not s.is_valid():
            return validation_error_response(s)

        tipo = s.validated_data["tipo"]
        artesano_id = s.validated_data.get("artesano")
        orden = s.validated_data.get("orden")

        artesano = None
        if artesano_id:
            from apps.authentication.models import Usuario
            try:
                artesano = Usuario.objects.get(pk=artesano_id, rol="ARTESANO")
            except Usuario.DoesNotExist:
                return error_response("ARTESANO_NO_ENCONTRADO", "Artesano no encontrado.")

        # Si no se especifica orden, insertar antes de CONTROL_CALIDAD
        if not orden:
            control = TareaProduccion.objects.filter(pedido=pedido, tipo="CONTROL_CALIDAD").first()
            orden = (control.orden - 1) if control and control.orden > 1 else 99

        tarea = TareaProduccion.objects.create(
            pedido=pedido,
            tipo=tipo,
            artesano=artesano,
            orden=orden,
            estado="PENDIENTE",
        )
        return success_response(
            data=TareaProduccionSerializer(tarea).data,
            message=f"Tarea '{tarea.get_tipo_display()}' agregada al pedido.",
            status_code=status.HTTP_201_CREATED,
        )


class AsignarArtesanoTareaView(APIView):
    """PATCH: admin asigna o reasigna un artesano a una tarea."""
    permission_classes = [IsAdminOrPropietario]

    def patch(self, request, tarea_id):
        tarea = get_object_or_404(TareaProduccion, pk=tarea_id)
        artesano_id = request.data.get("artesano")

        if artesano_id:
            from apps.authentication.models import Usuario
            try:
                artesano = Usuario.objects.get(pk=artesano_id, rol="ARTESANO")
            except Usuario.DoesNotExist:
                return error_response("ARTESANO_NO_ENCONTRADO", "Artesano no encontrado.")
            tarea.artesano = artesano
        else:
            tarea.artesano = None

        tarea.save(update_fields=["artesano"])
        if tarea.artesano:
            notificar_tarea_asignada(tarea)
        return success_response(
            data=TareaProduccionSerializer(tarea).data,
            message="Artesano asignado.",
        )
