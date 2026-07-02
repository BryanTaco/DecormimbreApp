import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker
from django.core.cache import cache


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def admin_client(db):
    from apps.authentication.models import Usuario
    user = Usuario.objects.create_user(
        email="admin_ped@decormimbre.ec",
        nombre="Admin Pedidos",
        password="Admin1234!",
        rol="ADMIN",
    )
    client = APIClient()
    r = client.post(reverse("v1:token_obtain_pair"), {"email": "admin_ped@decormimbre.ec", "password": "Admin1234!"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
    return client


@pytest.mark.django_db
def test_pedidos_list_retorna_200(admin_client):
    r = admin_client.get(reverse("v1:pedidos_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_pedidos_list_sin_auth_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:pedidos_list"))
    assert r.status_code == 401


@pytest.mark.django_db
def test_pedido_detail_retorna_200(admin_client):
    from apps.clientes.models import Cliente
    from apps.pedidos.models import Pedido
    from apps.authentication.models import Usuario
    cliente = baker.make(Cliente)
    usuario = baker.make(Usuario)
    pedido = baker.make(Pedido, cliente=cliente, creado_por=usuario, estado="PENDIENTE")
    r = admin_client.get(reverse("v1:pedidos_detail", kwargs={"pk": pedido.pk}))
    assert r.status_code == 200
    assert r.data["data"]["numero"] == pedido.numero


@pytest.mark.django_db
def test_pedido_cambiar_estado_valido(admin_client):
    from apps.clientes.models import Cliente
    from apps.pedidos.models import Pedido
    from apps.authentication.models import Usuario
    cliente = baker.make(Cliente)
    usuario = baker.make(Usuario)
    pedido = baker.make(Pedido, cliente=cliente, creado_por=usuario, estado="PENDIENTE")
    r = admin_client.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.pk}),
        {"nuevo_estado": "EN_PRODUCCION"},
    )
    assert r.status_code == 200
    pedido.refresh_from_db()
    assert pedido.estado == "EN_PRODUCCION"


@pytest.mark.django_db
def test_pedido_cambiar_estado_invalido_retorna_error(admin_client):
    from apps.clientes.models import Cliente
    from apps.pedidos.models import Pedido
    from apps.authentication.models import Usuario
    cliente = baker.make(Cliente)
    usuario = baker.make(Usuario)
    pedido = baker.make(Pedido, cliente=cliente, creado_por=usuario, estado="PENDIENTE")
    r = admin_client.post(
        reverse("v1:pedidos_estado", kwargs={"pk": pedido.pk}),
        {"nuevo_estado": "ENTREGADO"},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_alertas_entrega_list_retorna_200(admin_client):
    r = admin_client.get(reverse("v1:alertas_entrega_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_tracking_publico_con_numero_y_cedula_validos():
    from apps.clientes.models import Cliente
    from apps.pedidos.models import Pedido
    from apps.authentication.models import Usuario
    cliente = baker.make(Cliente, cedula_ruc="1710034065")
    usuario = baker.make(Usuario)
    pedido = baker.make(Pedido, cliente=cliente, creado_por=usuario, estado="PENDIENTE")
    client = APIClient()
    r = client.get(
        reverse("public:pedidos_tracking"),
        {"numero": pedido.numero, "cedula": "1710034065"},
    )
    assert r.status_code == 200
    assert r.data["data"]["numero"] == pedido.numero


@pytest.mark.django_db
def test_tracking_publico_sin_parametros_retorna_400():
    client = APIClient()
    r = client.get(reverse("public:pedidos_tracking"))
    assert r.status_code == 400


@pytest.mark.django_db
def test_tracking_publico_cedula_erronea_retorna_404():
    client = APIClient()
    r = client.get(
        reverse("public:pedidos_tracking"),
        {"numero": "PED-000001", "cedula": "9999999999"},
    )
    assert r.status_code == 404
