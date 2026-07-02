import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Usuario
from apps.clientes.models import Cliente


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        email="admin@decormimbre.ec",
        nombre="Bryan Taco",
        password="AdminPass123!",
        rol="ADMIN",
    )


@pytest.fixture
def auth_client(client, admin):
    r = client.post(reverse("v1:token_obtain_pair"), {"email": "admin@decormimbre.ec", "password": "AdminPass123!"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
    return client


@pytest.mark.django_db
def test_crear_cliente_con_cedula_valida(auth_client):
    r = auth_client.post(reverse("v1:clientes_list"), {
        "cedula_ruc": "1710034065",
        "nombre_completo": "Juan Pérez",
        "tipo": "NATURAL",
        "telefono": "0991234567",
    })
    assert r.status_code == status.HTTP_201_CREATED
    assert r.data["success"] is True


@pytest.mark.django_db
def test_crear_cliente_cedula_invalida_retorna_CEDULA_INVALIDA(auth_client):
    r = auth_client.post(reverse("v1:clientes_list"), {
        "cedula_ruc": "1234567891",
        "nombre_completo": "Inválido",
        "tipo": "NATURAL",
        "telefono": "0991234567",
    })
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert r.data["error"]["code"] == "CEDULA_INVALIDA"


@pytest.mark.django_db
def test_listar_clientes_requiere_autenticacion(client):
    r = client.get(reverse("v1:clientes_list"))
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_soft_delete_desactiva_sin_borrar(auth_client, admin):
    c = Cliente.objects.create(
        cedula_ruc="1750777516",
        nombre_completo="Test",
        tipo="NATURAL",
        telefono="0991111111",
        creado_por=admin,
    )
    r = auth_client.delete(reverse("v1:clientes_detail", kwargs={"pk": c.pk}))
    assert r.status_code == status.HTTP_200_OK
    c.refresh_from_db()
    assert c.activo is False
    assert Cliente.objects.filter(pk=c.pk).exists()


@pytest.mark.django_db
def test_cedula_no_modificable_en_update(auth_client, admin):
    c = Cliente.objects.create(
        cedula_ruc="1710034065",
        nombre_completo="Original",
        tipo="NATURAL",
        telefono="0991111111",
        creado_por=admin,
    )
    r = auth_client.put(reverse("v1:clientes_detail", kwargs={"pk": c.pk}), {
        "cedula_ruc": "1750777516",
        "nombre_completo": "Modificado",
        "tipo": "NATURAL",
        "telefono": "0991111111",
    })
    assert r.status_code == status.HTTP_400_BAD_REQUEST
