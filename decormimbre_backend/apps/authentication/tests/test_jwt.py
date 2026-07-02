import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import Usuario


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
def propietario(db):
    return Usuario.objects.create_user(
        email="owner@decormimbre.ec",
        nombre="Galortiz",
        password="OwnerPass123!",
        rol="PROPIETARIO",
    )


def login(client, email, password):
    url = reverse("v1:token_obtain_pair")
    return client.post(url, {"email": email, "password": password})


@pytest.mark.django_db
def test_login_exitoso_retorna_access_y_refresh_token(client, admin):
    r = login(client, "admin@decormimbre.ec", "AdminPass123!")
    assert r.status_code == status.HTTP_200_OK
    assert "access" in r.data["data"]
    assert "refresh" in r.data["data"]


@pytest.mark.django_db
def test_login_email_inexistente_retorna_401(client, admin):
    r = login(client, "noexiste@test.com", "AdminPass123!")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_login_password_incorrecta_retorna_401(client, admin):
    r = login(client, "admin@decormimbre.ec", "wrongpassword")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_refresh_rota_token_y_blacklistea_anterior(client, admin):
    tokens = login(client, "admin@decormimbre.ec", "AdminPass123!").data["data"]
    refresh_url = reverse("v1:token_refresh")
    r = client.post(refresh_url, {"refresh": tokens["refresh"]})
    assert r.status_code == status.HTTP_200_OK
    assert "access" in r.data


@pytest.mark.django_db
def test_refresh_token_anterior_ya_no_funciona_despues_de_rotar(client, admin):
    tokens = login(client, "admin@decormimbre.ec", "AdminPass123!").data["data"]
    refresh_url = reverse("v1:token_refresh")
    client.post(refresh_url, {"refresh": tokens["refresh"]})
    r2 = client.post(refresh_url, {"refresh": tokens["refresh"]})
    assert r2.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_logout_invalida_refresh_token(client, admin):
    tokens = login(client, "admin@decormimbre.ec", "AdminPass123!").data["data"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    client.post(reverse("v1:token_blacklist"), {"refresh": tokens["refresh"]})
    r = client.post(reverse("v1:token_refresh"), {"refresh": tokens["refresh"]})
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_logout_refresh_token_ya_invalido_retorna_401(client, admin):
    tokens = login(client, "admin@decormimbre.ec", "AdminPass123!").data["data"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    client.post(reverse("v1:token_blacklist"), {"refresh": tokens["refresh"]})
    r = client.post(reverse("v1:token_blacklist"), {"refresh": tokens["refresh"]})
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_endpoint_protegido_sin_token_retorna_401(client):
    r = client.get(reverse("v1:me"))
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_endpoint_solo_admin_con_propietario_retorna_403(client, propietario):
    tokens = login(client, "owner@decormimbre.ec", "OwnerPass123!").data["data"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    r = client.get(reverse("v1:usuarios_list_create"))
    assert r.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_usuario_inactivo_no_puede_hacer_login(client, db):
    user = Usuario.objects.create_user(
        email="inactivo@decormimbre.ec",
        nombre="Inactivo",
        password="Pass1234!",
        rol="PROPIETARIO",
    )
    user.activo = False
    user.save()
    r = login(client, "inactivo@decormimbre.ec", "Pass1234!")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED
