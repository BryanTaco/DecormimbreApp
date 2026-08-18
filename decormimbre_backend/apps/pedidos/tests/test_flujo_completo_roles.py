"""Flujo integral: cotización formal → pedido → taller → entrega.

Este caso protege la coordinación entre cliente, administración y artesano,
incluido el descuento de inventario y el aislamiento de permisos.
"""
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.test import APIClient


def cliente_para(usuario):
    from apps.clientes.models import Cliente

    return Cliente.objects.create(
        usuario_cuenta=usuario,
        cedula_ruc="1710034065",
        nombre_completo="Cliente Flujo QA",
        telefono="+593980572561",
        email=usuario.email,
    )


def api_para(usuario):
    client = APIClient()
    client.force_authenticate(user=usuario)
    return client


@pytest.mark.django_db
def test_solicitud_publica_guarda_color_hex_y_medidas_estructurados():
    from apps.authentication.models import Usuario
    from apps.cotizaciones.models import Cotizacion, SolicitudRapida

    personalizacion = {
        "tipo": "Silla",
        "material": "Polialuminio",
        "color": {"nombre": "Personalizado (#1A6B8A)", "hex": "#1A6B8A"},
        "cojin": {"nombre": "Beige lino", "hex": "#E4D8C4"},
        "medidas": {"ancho_cm": 60, "alto_cm": 90, "profundidad_cm": 55},
    }
    respuesta = APIClient().post(
        "/api/v1/public/cotizacion-rapida/",
        {
            "nombre": "Cliente Personalizado",
            "email": "personalizado@decormimbre.ec",
            "telefono": "+593980572561",
            "descripcion": "Silla personalizada para exterior.",
            "personalizacion": personalizacion,
        },
        format="json",
    )
    assert respuesta.status_code == 201
    solicitud = SolicitudRapida.objects.get(email="personalizado@decormimbre.ec")
    assert solicitud.personalizacion["color"]["hex"] == "#1A6B8A"
    assert solicitud.personalizacion["cojin"]["hex"] == "#E4D8C4"
    assert solicitud.personalizacion["medidas"] == {"ancho_cm": 60.0, "alto_cm": 90.0, "profundidad_cm": 55.0}

    # Administración convierte la solicitud: la ficha no se pierde al pasar
    # de la bandeja web a una cotización formal.
    admin = Usuario.objects.create_user("admin_conversion@decormimbre.ec", "Admin Conversión", "ClaveSegura123!", rol="ADMIN")
    cuenta_cliente = Usuario.objects.create_user("cliente_conversion@decormimbre.ec", "Cliente Conversión", "ClaveSegura123!", rol="CLIENTE")
    cliente = cliente_para(cuenta_cliente)
    conversion = api_para(admin).post(
        f"/api/v1/cotizaciones/solicitudes/{solicitud.id}/convertir/",
        {"cliente_id": str(cliente.id), "forma_pago": "50_50"},
        format="json",
    )
    assert conversion.status_code == 201
    cotizacion = Cotizacion.objects.get(pk=conversion.data["data"]["id"])
    assert cotizacion.configuracion == solicitud.personalizacion


@pytest.mark.django_db
def test_cotizacion_pedido_taller_y_entrega_es_visible_para_cada_rol():
    from apps.authentication.models import Usuario
    from apps.catalogo.models import Categoria, Producto
    from apps.inventario.models import MateriaPrima, ProductoMateria
    from apps.pedidos.models import Pedido, TareaProduccion

    admin = Usuario.objects.create_user("admin_flujo@decormimbre.ec", "Admin Flujo", "ClaveSegura123!", rol="ADMIN")
    usuario_cliente = Usuario.objects.create_user("cliente_flujo@decormimbre.ec", "Cliente Flujo", "ClaveSegura123!", rol="CLIENTE")
    artesano = Usuario.objects.create_user("artesano_flujo@decormimbre.ec", "Artesano Flujo", "ClaveSegura123!", rol="ARTESANO")
    cliente = cliente_para(usuario_cliente)
    categoria = Categoria.objects.create(nombre="QA Flujo")
    producto = Producto.objects.create(
        nombre="Silla QA Flujo", categoria=categoria, precio_base=Decimal("100.00"), activo=True,
    )
    materia = MateriaPrima.objects.create(
        nombre="Rollo QA Flujo", unidad="ROLLO", stock_actual=Decimal("5.000"),
        stock_minimo=Decimal("1.000"), costo_unitario=Decimal("8.00"),
    )
    ProductoMateria.objects.create(producto=producto, materia_prima=materia, cantidad_por_unidad=Decimal("1.000"))

    personalizacion = {
        "tipo": "Silla",
        "material": "Polialuminio",
        "color": {"nombre": "Personalizado", "hex": "#1A6B8A"},
        "cojin": {"nombre": "Beige lino", "hex": "#E4D8C4"},
        "medidas": {"ancho_cm": 60.0, "alto_cm": 90.0, "profundidad_cm": 55.0},
    }
    admin_api = api_para(admin)
    cotizacion = admin_api.post(
        reverse("v1:cotizaciones_list"),
        {"cliente": str(cliente.id), "forma_pago": "50_50", "configuracion": personalizacion}, format="json",
    )
    assert cotizacion.status_code == 201
    cotizacion_id = cotizacion.data["data"]["id"]

    item = admin_api.post(
        reverse("v1:cotizaciones_items_create", kwargs={"pk": cotizacion_id}),
        {"producto": str(producto.id), "cantidad": 1, "precio_unitario": "100.00"}, format="json",
    )
    assert item.status_code == 201

    for estado in ("ENVIADA", "APROBADA"):
        respuesta = admin_api.post(
            reverse("v1:cotizaciones_estado", kwargs={"pk": cotizacion_id}),
            {"nuevo_estado": estado}, format="json",
        )
        assert respuesta.status_code == 200

    pedido = Pedido.objects.get(cotizacion_id=cotizacion_id)
    assert pedido.estado == "PENDIENTE"
    assert pedido.configuracion == personalizacion
    pedido.artesano_estructura = artesano
    pedido.artesano_tejido = artesano
    pedido.save(update_fields=["artesano_estructura", "artesano_tejido"])

    en_produccion = admin_api.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.id}),
        {"nuevo_estado": "EN_PRODUCCION"}, format="json",
    )
    assert en_produccion.status_code == 200
    materia.refresh_from_db()
    assert materia.stock_actual == Decimal("4.000")

    # Cliente ve tanto la cotización aprobada como el pedido ya en producción.
    cliente_api = api_para(usuario_cliente)
    mis_pedidos = cliente_api.get(reverse("v1:mis_pedidos"))
    assert mis_pedidos.status_code == 200
    assert any(p["id"] == str(pedido.id) and p["estado"] == "EN_PRODUCCION" for p in mis_pedidos.data["data"])
    assert cliente_api.get(reverse("v1:pedidos_list")).status_code == 403

    # El artesano recibe únicamente sus tareas y completa las dos que le fueron asignadas.
    artesano_api = api_para(artesano)
    tareas_artesano = artesano_api.get(reverse("v1:mis_tareas"))
    assert tareas_artesano.status_code == 200
    assert {t["tipo"] for t in tareas_artesano.data["data"]} == {"ESTRUCTURA", "TEJIDO"}
    assert all(t["personalizacion"] == personalizacion for t in tareas_artesano.data["data"])

    estructura = TareaProduccion.objects.get(pedido=pedido, tipo="ESTRUCTURA")
    assert artesano_api.post(reverse("v1:tareas_completar", kwargs={"tarea_id": estructura.id}), {"notas": "Estructura terminada"}, format="json").status_code == 200
    tejido = TareaProduccion.objects.get(pedido=pedido, tipo="TEJIDO")
    tejido.refresh_from_db()
    assert tejido.estado == "EN_PROCESO"
    assert artesano_api.post(reverse("v1:tareas_completar", kwargs={"tarea_id": tejido.id}), {"notas": "Tejido terminado"}, format="json").status_code == 200

    # Administración termina acabados y control de calidad, y recibe el pedido listo.
    for tipo in ("ACABADOS", "CONTROL_CALIDAD"):
        tarea = TareaProduccion.objects.get(pedido=pedido, tipo=tipo)
        tarea.refresh_from_db()
        assert tarea.estado == "EN_PROCESO"
        assert admin_api.post(reverse("v1:tareas_completar", kwargs={"tarea_id": tarea.id}), {"notas": "Validado"}, format="json").status_code == 200

    pedido.refresh_from_db()
    assert pedido.estado == "LISTO_ENTREGA"
    entregado = admin_api.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.id}),
        {"nuevo_estado": "ENTREGADO"}, format="json",
    )
    assert entregado.status_code == 200
    pedido.refresh_from_db()
    assert pedido.estado == "ENTREGADO"
    assert pedido.fecha_entrega_real is not None
    from apps.pedidos.ficha_tecnica import generar_ficha_tejedor
    assert generar_ficha_tejedor(pedido).startswith(b"%PDF")
