"""Tests de vistas de cotizaciones: CRUD, ciclo de vida y PDF."""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="admin_cot@decormimbre.ec",
        nombre="Admin Cot",
        password="Admin1234!",
        rol="ADMIN",
    )


@pytest.fixture
def api(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client, admin


@pytest.fixture
def cliente(db):
    from apps.clientes.models import Cliente
    return baker.make(Cliente, cedula_ruc="1710034065")


@pytest.fixture
def producto(db):
    from apps.catalogo.models import Producto, Categoria
    cat = baker.make(Categoria)
    return baker.make(Producto, categoria=cat, precio_base=Decimal("200.00"))


@pytest.fixture
def cotizacion(db, cliente, admin):
    from apps.cotizaciones.models import Cotizacion
    return baker.make(Cotizacion, cliente=cliente, creado_por=admin, estado="BORRADOR")


# ── CRUD Cotizaciones ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_cotizaciones_retorna_200(api):
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_crear_cotizacion_retorna_201(api, cliente):
    client, _ = api
    r = client.post(reverse("v1:cotizaciones_list"), {"cliente": str(cliente.pk), "forma_pago": "50_50"})
    assert r.status_code == 201
    assert r.data["data"]["estado"] == "BORRADOR"


@pytest.mark.django_db
def test_crear_cotizacion_sin_cliente_retorna_error(api):
    client, _ = api
    r = client.post(reverse("v1:cotizaciones_list"), {})
    assert r.status_code == 400


@pytest.mark.django_db
def test_listar_cotizaciones_filtrar_por_estado(api, cotizacion):
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_list"), {"estado": "BORRADOR"})
    assert r.status_code == 200
    assert any(c["numero"] == cotizacion.numero for c in r.data["data"])


@pytest.mark.django_db
def test_listar_cotizaciones_filtrar_por_cliente(api, cotizacion, cliente):
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_list"), {"cliente": str(cliente.pk)})
    assert r.status_code == 200


@pytest.mark.django_db
def test_detalle_cotizacion_retorna_200(api, cotizacion):
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_detail", kwargs={"pk": cotizacion.pk}))
    assert r.status_code == 200
    assert r.data["data"]["numero"] == cotizacion.numero


@pytest.mark.django_db
def test_actualizar_cotizacion_borrador(api, cotizacion):
    client, _ = api
    r = client.put(
        reverse("v1:cotizaciones_detail", kwargs={"pk": cotizacion.pk}),
        {"observaciones": "Actualizada"},
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_actualizar_cotizacion_no_borrador_retorna_error(api, cotizacion, admin):
    cotizacion.estado = "ENVIADA"
    cotizacion.save()
    client, _ = api
    r = client.put(
        reverse("v1:cotizaciones_detail", kwargs={"pk": cotizacion.pk}),
        {"observaciones": "Intentando editar"},
    )
    assert r.status_code == 400


# ── Ítems de cotización ────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_agregar_item_a_cotizacion_borrador(api, cotizacion, producto):
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_items_create", kwargs={"pk": cotizacion.pk}),
        {"producto": str(producto.pk), "cantidad": 2, "precio_unitario": "180.00"},
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_agregar_item_a_cotizacion_no_borrador_retorna_error(api, cotizacion, producto):
    cotizacion.estado = "ENVIADA"
    cotizacion.save()
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_items_create", kwargs={"pk": cotizacion.pk}),
        {"producto": str(producto.pk), "cantidad": 1, "precio_unitario": "100.00"},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_actualizar_item_cotizacion(api, cotizacion, producto):
    from apps.cotizaciones.models import ItemCotizacion
    item = baker.make(
        ItemCotizacion, cotizacion=cotizacion, producto=producto,
        cantidad=1, precio_unitario=Decimal("100.00"), subtotal=Decimal("100.00"),
    )
    client, _ = api
    r = client.put(
        reverse("v1:cotizaciones_items_detail", kwargs={"pk": cotizacion.pk, "item_id": item.pk}),
        {"cantidad": 3, "precio_unitario": "100.00"},
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_eliminar_item_cotizacion(api, cotizacion, producto):
    from apps.cotizaciones.models import ItemCotizacion
    item = baker.make(
        ItemCotizacion, cotizacion=cotizacion, producto=producto,
        cantidad=1, precio_unitario=Decimal("100.00"), subtotal=Decimal("100.00"),
    )
    client, _ = api
    r = client.delete(
        reverse("v1:cotizaciones_items_detail", kwargs={"pk": cotizacion.pk, "item_id": item.pk}),
    )
    assert r.status_code == 200
    assert not cotizacion.items.filter(pk=item.pk).exists()


@pytest.mark.django_db
def test_eliminar_item_en_cotizacion_no_borrador_retorna_error(api, cotizacion, producto):
    from apps.cotizaciones.models import ItemCotizacion
    item = baker.make(
        ItemCotizacion, cotizacion=cotizacion, producto=producto,
        cantidad=1, precio_unitario=Decimal("100.00"), subtotal=Decimal("100.00"),
    )
    cotizacion.estado = "ENVIADA"
    cotizacion.save()
    client, _ = api
    r = client.delete(
        reverse("v1:cotizaciones_items_detail", kwargs={"pk": cotizacion.pk, "item_id": item.pk}),
    )
    assert r.status_code == 400


# ── Cambiar estado ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_cambiar_estado_borrador_a_enviada(api, cotizacion):
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_estado", kwargs={"pk": cotizacion.pk}),
        {"nuevo_estado": "ENVIADA"},
    )
    assert r.status_code == 200
    cotizacion.refresh_from_db()
    assert cotizacion.estado == "ENVIADA"


@pytest.mark.django_db
def test_cambiar_estado_invalido_retorna_error(api, cotizacion):
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_estado", kwargs={"pk": cotizacion.pk}),
        {"nuevo_estado": "APROBADA"},  # BORRADOR → APROBADA no permitido
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_cambiar_estado_serializer_invalido(api, cotizacion):
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_estado", kwargs={"pk": cotizacion.pk}),
        {"nuevo_estado": "ESTADO_INEXISTENTE"},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_aprobacion_crea_pedido_automatico(api, cotizacion, producto, admin):
    from apps.cotizaciones.models import ItemCotizacion
    baker.make(
        ItemCotizacion, cotizacion=cotizacion, producto=producto,
        cantidad=1, precio_unitario=Decimal("200.00"), subtotal=Decimal("200.00"),
    )
    cotizacion.cambiar_estado("ENVIADA", admin)
    client, _ = api
    r = client.post(
        reverse("v1:cotizaciones_estado", kwargs={"pk": cotizacion.pk}),
        {"nuevo_estado": "APROBADA"},
    )
    assert r.status_code == 200
    cotizacion.refresh_from_db()
    assert cotizacion.estado == "APROBADA"
    assert hasattr(cotizacion, "pedido")


# ── Versiones ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_versiones_cotizacion(api, cotizacion, admin):
    cotizacion.cambiar_estado("ENVIADA", admin)
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_versiones", kwargs={"pk": cotizacion.pk}))
    assert r.status_code == 200
    assert len(r.data["data"]) >= 1


# ── PDF de cotización ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_pdf_cotizacion_retorna_bytes_pdf(api, cotizacion, producto):
    from apps.cotizaciones.models import ItemCotizacion
    baker.make(
        ItemCotizacion, cotizacion=cotizacion, producto=producto,
        cantidad=2, precio_unitario=Decimal("150.00"), subtotal=Decimal("300.00"),
    )
    client, _ = api
    r = client.get(reverse("v1:cotizaciones_pdf", kwargs={"pk": cotizacion.pk}))
    assert r.status_code == 200
    assert r["Content-Type"] == "application/pdf"
    content = b"".join(r.streaming_content) if hasattr(r, "streaming_content") else r.content
    assert content[:4] == b"%PDF"


@pytest.mark.django_db
def test_generar_pdf_cotizacion_directo():
    """Cubre pdf_generator.py directamente."""
    from decimal import Decimal
    from apps.cotizaciones.pdf_generator import generar_pdf_cotizacion
    from apps.cotizaciones.models import Cotizacion, ItemCotizacion
    from apps.clientes.models import Cliente
    from apps.catalogo.models import Producto, Categoria, Color
    from apps.authentication.models import Usuario

    usuario = baker.make(Usuario)
    cliente = baker.make(Cliente, cedula_ruc="1710034065", email="test@test.com")
    cat = baker.make(Categoria)
    producto = baker.make(Producto, categoria=cat)
    color = baker.make(Color, r=100, g=150, b=200)
    cot = baker.make(Cotizacion, cliente=cliente, creado_por=usuario, estado="BORRADOR")
    baker.make(
        ItemCotizacion, cotizacion=cot, producto=producto, color=color,
        cantidad=1, precio_unitario=Decimal("100.00"), subtotal=Decimal("100.00"),
        ancho_cm=Decimal("60.00"), alto_cm=Decimal("80.00"),
    )
    result = generar_pdf_cotizacion(cot)
    assert isinstance(result, bytes)
    assert result[:4] == b"%PDF"


@pytest.mark.django_db
def test_generar_pdf_con_fecha_expiracion():
    """Cubre la rama de fecha_expiracion en pdf_generator.py."""
    from decimal import Decimal
    from django.utils import timezone
    from apps.cotizaciones.pdf_generator import generar_pdf_cotizacion
    from apps.cotizaciones.models import Cotizacion
    from apps.clientes.models import Cliente
    from apps.authentication.models import Usuario

    usuario = baker.make(Usuario)
    cliente = baker.make(Cliente, cedula_ruc="0900168568")
    cot = baker.make(
        Cotizacion, cliente=cliente, creado_por=usuario, estado="ENVIADA",
        fecha_expiracion=timezone.now() + timezone.timedelta(days=15),
    )
    result = generar_pdf_cotizacion(cot)
    assert result[:4] == b"%PDF"


# ── Sin autenticación ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_cotizaciones_sin_auth_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:cotizaciones_list"))
    assert r.status_code == 401
