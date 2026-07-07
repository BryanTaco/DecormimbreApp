from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from utils.log_actividad import registrar_actividad
from apps.authentication.permissions import IsAdminOrPropietario
from .models import Cotizacion, ItemCotizacion, VersionCotizacion
from .serializers import (
    CotizacionSerializer, ItemCotizacionSerializer,
    VersionCotizacionSerializer, CambiarEstadoSerializer,
)
from .pdf_generator import generar_pdf_cotizacion


class CotizacionListCreateView(ListCreateAPIView):
    serializer_class = CotizacionSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Cotizacion.objects.select_related("cliente", "creado_por")
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
            return success_response(data=s.data, message="Cotización creada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class CotizacionDetailView(RetrieveUpdateAPIView):
    serializer_class = CotizacionSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Cotizacion.objects.prefetch_related("items", "versiones")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        cot = self.get_object()
        if cot.estado != "BORRADOR":
            return error_response(
                "COTIZACION_NO_EDITABLE",
                f"Solo se puede editar una cotización en estado BORRADOR. Estado actual: {cot.estado}.",
            )
        s = self.get_serializer(cot, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Cotización actualizada.")
        return validation_error_response(s)


class CambiarEstadoCotizacionView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def post(self, request, pk):
        cot = get_object_or_404(Cotizacion, pk=pk)
        s = CambiarEstadoSerializer(data=request.data)
        if not s.is_valid():
            return validation_error_response(s)
        nuevo_estado = s.validated_data["nuevo_estado"]
        estado_anterior = cot.estado
        try:
            cot.cambiar_estado(nuevo_estado, request.user)
        except DjangoValidationError as e:
            return error_response("TRANSICION_INVALIDA", str(e.message))
        registrar_actividad(
            request.user, "COTIZACIONES", "CAMBIO_ESTADO",
            entidad_id=cot.pk,
            descripcion=f"Cotización {cot.numero}: {estado_anterior} → {cot.estado}",
            request=request,
        )
        return success_response(
            data=CotizacionSerializer(cot).data,
            message=f"Estado cambiado a {cot.estado}.",
        )


class CotizacionPDFView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request, pk):
        cot = get_object_or_404(Cotizacion.objects.prefetch_related("items__producto", "items__color"), pk=pk)
        try:
            pdf_bytes = generar_pdf_cotizacion(cot)
        except Exception as e:
            return error_response("PDF_ERROR", f"Error generando PDF: {str(e)}", status_code=500)
        from django.http import HttpResponse
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="cotizacion-{cot.numero}.pdf"'
        return response


class VersionesCotizacionView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request, pk):
        cot = get_object_or_404(Cotizacion, pk=pk)
        versiones = cot.versiones.all()
        return success_response(data=VersionCotizacionSerializer(versiones, many=True).data)


class ItemCotizacionCreateView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def post(self, request, pk):
        cot = get_object_or_404(Cotizacion, pk=pk)
        if cot.estado != "BORRADOR":
            return error_response("COTIZACION_NO_EDITABLE", "Solo se pueden agregar ítems en BORRADOR.")
        s = ItemCotizacionSerializer(data=request.data)
        if s.is_valid():
            s.save(cotizacion=cot)
            return success_response(data=s.data, message="Ítem agregado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class ItemCotizacionDetailView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def _get_item(self, pk, item_id):
        return get_object_or_404(ItemCotizacion, pk=item_id, cotizacion__id=pk)

    def put(self, request, pk, item_id):
        item = self._get_item(pk, item_id)
        if item.cotizacion.estado != "BORRADOR":
            return error_response("COTIZACION_NO_EDITABLE", "Solo se puede editar ítems en BORRADOR.")
        s = ItemCotizacionSerializer(item, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Ítem actualizado.")
        return validation_error_response(s)

    def delete(self, request, pk, item_id):
        item = self._get_item(pk, item_id)
        if item.cotizacion.estado != "BORRADOR":
            return error_response("COTIZACION_NO_EDITABLE", "Solo se puede eliminar ítems en BORRADOR.")
        cot = item.cotizacion
        item.delete()
        cot.calcular_totales()
        return success_response(message="Ítem eliminado.")
