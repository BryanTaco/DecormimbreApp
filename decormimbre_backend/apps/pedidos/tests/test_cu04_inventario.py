"""
CU-04 — Control de existencias al iniciar producción.

El módulo de inventario debe impedir que un pedido entre a producción cuando
los componentes de su lista de materiales (BOM) no tienen stock suficiente.
Estas pruebas evidencian el flujo alterno de CU-04: el sistema valida la
disponibilidad ANTES de descontar y bloquea la operación si falta material,
dejando el pedido en su estado original y sin generar movimientos de inventario.
"""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin_client(db):
    from apps.authentication.models import Usuario
    Usuario.objects.create_user(
        email="admin_cu04@decormimbre.ec",
        nombre="Admin CU04",
        password="Admin1234!",
        rol="ADMIN",
    )
    client = APIClient()
    r = client.post(
        reverse("v1:token_obtain_pair"),
        {"email": "admin_cu04@decormimbre.ec", "password": "Admin1234!"},
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
    return client


def _pedido_con_bom(stock_materia):
    """Crea un pedido PENDIENTE con un ítem cuyo producto consume 5 unidades
    de una materia prima que tiene `stock_materia` disponibles."""
    from apps.catalogo.models import Producto
    from apps.inventario.models import MateriaPrima, ProductoMateria
    from apps.pedidos.models import Pedido, ItemPedido

    producto = baker.make(Producto)
    materia = baker.make(
        MateriaPrima,
        nombre="Mimbre natural",
        unidad="METRO",
        stock_actual=Decimal(stock_materia),
        stock_minimo=Decimal("1.000"),
        costo_unitario=Decimal("2.50"),
    )
    ProductoMateria.objects.create(
        producto=producto,
        materia_prima=materia,
        cantidad_por_unidad=Decimal("5.000"),
    )
    pedido = baker.make(Pedido, estado="PENDIENTE")
    baker.make(
        ItemPedido,
        pedido=pedido,
        producto=producto,
        cantidad=1,
        precio_unitario=Decimal("100.00"),
    )
    return pedido, materia


@pytest.mark.django_db
def test_inicio_produccion_bloqueado_por_stock_insuficiente(admin_client):
    """Flujo alterno CU-04: stock BOM insuficiente → HTTP 400, pedido sin cambios."""
    from apps.pedidos.models import Pedido
    from apps.inventario.models import MovimientoInventario

    # La materia tiene 3 metros pero el pedido necesita 5 → debe bloquear.
    pedido, materia = _pedido_con_bom("3.000")

    r = admin_client.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.pk}),
        {"nuevo_estado": "EN_PRODUCCION"},
    )

    assert r.status_code == 400
    # El estado NO cambió: la transacción atómica revierte todo.
    pedido.refresh_from_db()
    assert pedido.estado == "PENDIENTE"
    # El stock quedó intacto.
    materia.refresh_from_db()
    assert materia.stock_actual == Decimal("3.000")
    # No se registró ninguna salida de inventario.
    assert not MovimientoInventario.objects.filter(
        pedido=pedido, tipo="SALIDA_PRODUCCION"
    ).exists()


@pytest.mark.django_db
def test_inicio_produccion_descuenta_stock_cuando_es_suficiente(admin_client):
    """Flujo principal CU-04: stock suficiente → HTTP 200, stock descontado."""
    from apps.inventario.models import MovimientoInventario

    # La materia tiene 20 metros y el pedido necesita 5 → debe proceder.
    pedido, materia = _pedido_con_bom("20.000")

    r = admin_client.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.pk}),
        {"nuevo_estado": "EN_PRODUCCION"},
    )

    assert r.status_code == 200
    pedido.refresh_from_db()
    assert pedido.estado == "EN_PRODUCCION"
    # 20 - (5 por unidad × 1 unidad) = 15 metros restantes.
    materia.refresh_from_db()
    assert materia.stock_actual == Decimal("15.000")
    # Se registró la salida de producción con trazabilidad al pedido.
    mov = MovimientoInventario.objects.get(pedido=pedido, tipo="SALIDA_PRODUCCION")
    assert mov.cantidad == Decimal("5.000")
    assert mov.stock_antes == Decimal("20.000")
    assert mov.stock_despues == Decimal("15.000")
