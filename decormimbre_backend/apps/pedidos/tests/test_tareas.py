"""Tests del sistema de etapas de producción (TareaProduccion)."""
import pytest
from django.core.exceptions import ValidationError
from model_bakery import baker


@pytest.mark.django_db
class TestCreacionTareas:
    def _pedido_pendiente(self):
        return baker.make("pedidos.Pedido", estado="PENDIENTE")

    def _usuario(self):
        return baker.make("authentication.Usuario")

    def test_al_pasar_a_produccion_crea_cuatro_tareas(self):
        from apps.pedidos.models import TareaProduccion
        pedido = self._pedido_pendiente()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        assert pedido.tareas.count() == 4

    def test_primera_tarea_es_estructura_y_esta_en_proceso(self):
        pedido = self._pedido_pendiente()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        primera = pedido.tareas.order_by("orden").first()
        assert primera.tipo == "ESTRUCTURA"
        assert primera.estado == "EN_PROCESO"
        assert primera.iniciada_en is not None

    def test_tareas_restantes_inician_pendiente(self):
        pedido = self._pedido_pendiente()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        pendientes = pedido.tareas.filter(estado="PENDIENTE")
        assert pendientes.count() == 3

    def test_tareas_tienen_orden_correcto(self):
        pedido = self._pedido_pendiente()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        tipos = list(pedido.tareas.order_by("orden").values_list("tipo", flat=True))
        assert tipos == ["ESTRUCTURA", "TEJIDO", "ACABADOS", "CONTROL_CALIDAD"]

    def test_artesano_estructura_asignado_a_tarea_estructura(self):
        from apps.authentication.models import Usuario
        artesano = baker.make(Usuario, rol="ARTESANO")
        pedido = baker.make("pedidos.Pedido", estado="PENDIENTE", artesano_estructura=artesano)
        pedido.cambiar_estado("EN_PRODUCCION", baker.make(Usuario))
        tarea = pedido.tareas.get(tipo="ESTRUCTURA")
        assert tarea.artesano == artesano

    def test_artesano_tejido_asignado_a_tarea_tejido(self):
        from apps.authentication.models import Usuario
        artesano = baker.make(Usuario, rol="ARTESANO")
        pedido = baker.make("pedidos.Pedido", estado="PENDIENTE", artesano_tejido=artesano)
        pedido.cambiar_estado("EN_PRODUCCION", baker.make(Usuario))
        tarea = pedido.tareas.get(tipo="TEJIDO")
        assert tarea.artesano == artesano

    def test_no_crea_tareas_duplicadas_en_segunda_llamada(self):
        pedido = self._pedido_pendiente()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        pedido._crear_tareas_produccion(u)  # segunda vez
        assert pedido.tareas.count() == 4

    def test_etapa_produccion_pedido_se_setea_a_estructura(self):
        pedido = self._pedido_pendiente()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        pedido.refresh_from_db()
        assert pedido.etapa_produccion == "ESTRUCTURA"


@pytest.mark.django_db
class TestAvanceTareas:
    def _pedido_en_produccion(self):
        pedido = baker.make("pedidos.Pedido", estado="PENDIENTE")
        u = baker.make("authentication.Usuario")
        pedido.cambiar_estado("EN_PRODUCCION", u)
        return pedido, u

    def test_completar_tarea_avanza_a_siguiente(self):
        pedido, u = self._pedido_en_produccion()
        primera = pedido.tareas.order_by("orden").first()
        primera.completar(u)
        segunda = pedido.tareas.order_by("orden")[1]
        segunda.refresh_from_db()
        assert segunda.estado == "EN_PROCESO"
        assert segunda.iniciada_en is not None

    def test_completar_primera_actualiza_etapa_pedido(self):
        pedido, u = self._pedido_en_produccion()
        primera = pedido.tareas.order_by("orden").first()
        primera.completar(u)
        pedido.refresh_from_db()
        assert pedido.etapa_produccion == "TEJIDO"

    def test_completar_tarea_registra_timestamp(self):
        pedido, u = self._pedido_en_produccion()
        primera = pedido.tareas.order_by("orden").first()
        primera.completar(u)
        primera.refresh_from_db()
        assert primera.completada_en is not None

    def test_completar_con_notas_las_guarda(self):
        pedido, u = self._pedido_en_produccion()
        primera = pedido.tareas.order_by("orden").first()
        primera.completar(u, notas="Material mimbre grueso usado")
        primera.refresh_from_db()
        assert primera.notas == "Material mimbre grueso usado"

    def test_completar_todas_pasa_pedido_a_listo_entrega(self):
        pedido, u = self._pedido_en_produccion()
        for tarea in pedido.tareas.order_by("orden"):
            tarea.refresh_from_db()
            tarea.completar(u)
        pedido.refresh_from_db()
        assert pedido.estado == "LISTO_ENTREGA"

    def test_completar_todas_registra_log_en_listo_entrega(self):
        from apps.pedidos.models import LogEstadoPedido
        pedido, u = self._pedido_en_produccion()
        for tarea in pedido.tareas.order_by("orden"):
            tarea.refresh_from_db()
            tarea.completar(u)
        log = LogEstadoPedido.objects.filter(
            pedido=pedido, estado_nuevo="LISTO_ENTREGA"
        ).first()
        assert log is not None


@pytest.mark.django_db
class TestPorcentajeCompletado:
    def _pedido_en_produccion(self):
        pedido = baker.make("pedidos.Pedido", estado="PENDIENTE")
        u = baker.make("authentication.Usuario")
        pedido.cambiar_estado("EN_PRODUCCION", u)
        return pedido, u

    def test_porcentaje_inicial_es_cero(self):
        pedido, _ = self._pedido_en_produccion()
        # Primera tarea EN_PROCESO pero no COMPLETADA
        assert pedido.porcentaje_completado() == 0

    def test_porcentaje_tras_primera_tarea_es_25(self):
        pedido, u = self._pedido_en_produccion()
        pedido.tareas.order_by("orden").first().completar(u)
        assert pedido.porcentaje_completado() == 25

    def test_porcentaje_tras_dos_tareas_es_50(self):
        pedido, u = self._pedido_en_produccion()
        for tarea in pedido.tareas.order_by("orden")[:2]:
            tarea.refresh_from_db()
            tarea.completar(u)
        assert pedido.porcentaje_completado() == 50

    def test_porcentaje_sin_tareas_es_cero(self):
        pedido = baker.make("pedidos.Pedido", estado="PENDIENTE")
        assert pedido.porcentaje_completado() == 0

    def test_porcentaje_100_al_completar_todas(self):
        pedido, u = self._pedido_en_produccion()
        for tarea in pedido.tareas.order_by("orden"):
            tarea.refresh_from_db()
            tarea.completar(u)
        # pedido pasa a LISTO_ENTREGA, pero porcentaje se calcula igual
        assert pedido.porcentaje_completado() == 100


@pytest.mark.django_db
class TestTareasViews:
    @pytest.fixture(autouse=True)
    def _clear_cache(self):
        from django.core.cache import cache
        cache.clear()
        yield
        cache.clear()

    @pytest.fixture
    def admin_client(self, db):
        from apps.authentication.models import Usuario
        from rest_framework.test import APIClient
        from django.urls import reverse
        from django.core.cache import cache
        cache.clear()
        user = Usuario.objects.create_user(
            email="admin_tareas@decormimbre.ec",
            nombre="Admin Tareas",
            password="Admin1234!",
            rol="ADMIN",
        )
        client = APIClient()
        r = client.post(
            reverse("v1:token_obtain_pair"),
            {"email": "admin_tareas@decormimbre.ec", "password": "Admin1234!"},
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
        return client

    @pytest.fixture
    def artesano_client(self, db):
        from apps.authentication.models import Usuario
        from rest_framework.test import APIClient
        from django.urls import reverse
        from django.core.cache import cache
        cache.clear()
        user = Usuario.objects.create_user(
            email="tejedor@decormimbre.ec",
            nombre="Juan Tejedor",
            password="Artesano1234!",
            rol="ARTESANO",
        )
        client = APIClient()
        r = client.post(
            reverse("v1:token_obtain_pair"),
            {"email": "tejedor@decormimbre.ec", "password": "Artesano1234!"},
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
        return client, user

    def test_listar_tareas_pedido_retorna_200(self, admin_client):
        from django.urls import reverse
        from apps.pedidos.models import Pedido
        pedido = baker.make(Pedido, estado="PENDIENTE")
        u = baker.make("authentication.Usuario")
        pedido.cambiar_estado("EN_PRODUCCION", u)
        r = admin_client.get(reverse("v1:pedidos_tareas", kwargs={"pk": pedido.pk}))
        assert r.status_code == 200
        assert len(r.data["data"]) == 4

    def test_mis_tareas_artesano_retorna_solo_sus_tareas(self, artesano_client):
        from django.urls import reverse
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido
        client, artesano = artesano_client
        pedido = baker.make(Pedido, estado="PENDIENTE", artesano_estructura=artesano)
        u = baker.make(Usuario)
        pedido.cambiar_estado("EN_PRODUCCION", u)
        r = client.get(reverse("v1:mis_tareas"))
        assert r.status_code == 200
        # Artesano solo ve sus tareas
        for tarea_data in r.data["data"]:
            assert tarea_data["pedido_numero"] == pedido.numero

    def test_completar_tarea_retorna_200(self, artesano_client):
        from django.urls import reverse
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido, TareaProduccion
        client, artesano = artesano_client
        pedido = baker.make(Pedido, estado="PENDIENTE", artesano_estructura=artesano)
        u = baker.make(Usuario)
        pedido.cambiar_estado("EN_PRODUCCION", u)
        tarea = pedido.tareas.get(tipo="ESTRUCTURA")
        r = client.post(
            reverse("v1:tareas_completar", kwargs={"tarea_id": tarea.pk}),
            {"notas": "Estructura lista"},
        )
        assert r.status_code == 200
        tarea.refresh_from_db()
        assert tarea.estado == "COMPLETADA"

    def test_artesano_no_puede_completar_tarea_ajena(self, artesano_client):
        from django.urls import reverse
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido
        client, artesano = artesano_client
        otro_artesano = baker.make(Usuario, rol="ARTESANO")
        pedido = baker.make(Pedido, estado="PENDIENTE", artesano_estructura=otro_artesano)
        u = baker.make(Usuario)
        pedido.cambiar_estado("EN_PRODUCCION", u)
        tarea = pedido.tareas.get(tipo="ESTRUCTURA")
        r = client.post(
            reverse("v1:tareas_completar", kwargs={"tarea_id": tarea.pk}),
        )
        assert r.status_code == 403

    def test_agregar_tarea_cojines_a_pedido_en_produccion(self, admin_client):
        from django.urls import reverse
        from apps.pedidos.models import Pedido
        pedido = baker.make(Pedido, estado="PENDIENTE")
        u = baker.make("authentication.Usuario")
        pedido.cambiar_estado("EN_PRODUCCION", u)
        r = admin_client.post(
            reverse("v1:pedidos_tareas", kwargs={"pk": pedido.pk}),
            {"tipo": "COJINES"},
        )
        assert r.status_code == 201
        assert pedido.tareas.filter(tipo="COJINES").exists()

    def test_no_puede_agregar_tarea_duplicada(self, admin_client):
        from django.urls import reverse
        from apps.pedidos.models import Pedido
        pedido = baker.make(Pedido, estado="PENDIENTE")
        u = baker.make("authentication.Usuario")
        pedido.cambiar_estado("EN_PRODUCCION", u)
        r = admin_client.post(
            reverse("v1:pedidos_tareas", kwargs={"pk": pedido.pk}),
            {"tipo": "ESTRUCTURA"},
        )
        assert r.status_code == 400


@pytest.mark.django_db
class TestFichasTecnicas:
    """Tests para generación de PDFs de fichas técnicas."""

    def _pedido_con_items(self):
        from decimal import Decimal
        from apps.pedidos.models import Pedido, ItemPedido
        from apps.catalogo.models import Producto, Color
        pedido = baker.make(Pedido, estado="PENDIENTE")
        producto = baker.make(Producto, nombre="Silla Mimbre")
        # r, g, b en rango 0-255 para que hex = #RRGGBB sea exactamente 7 chars
        color = baker.make(Color, nombre="Natural", r=196, g=163, b=90)
        baker.make(
            ItemPedido,
            pedido=pedido,
            producto=producto,
            cantidad=2,
            precio_unitario=Decimal("150.00"),
            ancho_cm=Decimal("60.00"),
            alto_cm=Decimal("90.00"),
            largo_cm=Decimal("55.00"),
            color=color,
        )
        return pedido

    def test_generar_ficha_tecnica_retorna_bytes_pdf(self):
        from apps.pedidos.ficha_tecnica import generar_ficha_tecnica
        pedido = self._pedido_con_items()
        result = generar_ficha_tecnica(pedido)
        assert isinstance(result, bytes)
        assert result[:4] == b"%PDF"

    def test_generar_ficha_tejedor_retorna_bytes_pdf(self):
        from apps.pedidos.ficha_tecnica import generar_ficha_tejedor
        pedido = self._pedido_con_items()
        result = generar_ficha_tejedor(pedido)
        assert isinstance(result, bytes)
        assert result[:4] == b"%PDF"

    def test_generar_ficha_estructurista_retorna_bytes_pdf(self):
        from apps.pedidos.ficha_tecnica import generar_ficha_estructurista
        pedido = self._pedido_con_items()
        result = generar_ficha_estructurista(pedido)
        assert isinstance(result, bytes)
        assert result[:4] == b"%PDF"

    def test_ficha_tecnica_endpoint_retorna_pdf(self):
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido
        from rest_framework.test import APIClient
        from django.urls import reverse
        from django.core.cache import cache
        cache.clear()
        admin = Usuario.objects.create_user(
            email="admin_ficha@decormimbre.ec",
            nombre="Admin Ficha",
            password="Admin1234!",
            rol="ADMIN",
        )
        pedido = self._pedido_con_items()
        client = APIClient()
        r = client.post(
            reverse("v1:token_obtain_pair"),
            {"email": "admin_ficha@decormimbre.ec", "password": "Admin1234!"},
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
        r = client.get(reverse("v1:pedidos_ficha", kwargs={"pk": pedido.pk}))
        assert r.status_code == 200
        assert r["Content-Type"] == "application/pdf"

    def test_ficha_tejedor_endpoint_retorna_pdf(self):
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido
        from rest_framework.test import APIClient
        from django.urls import reverse
        from django.core.cache import cache
        cache.clear()
        admin = Usuario.objects.create_user(
            email="admin_ficha2@decormimbre.ec",
            nombre="Admin Ficha2",
            password="Admin1234!",
            rol="ADMIN",
        )
        pedido = self._pedido_con_items()
        client = APIClient()
        r = client.post(
            reverse("v1:token_obtain_pair"),
            {"email": "admin_ficha2@decormimbre.ec", "password": "Admin1234!"},
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
        r = client.get(
            reverse("v1:pedidos_ficha", kwargs={"pk": pedido.pk}),
            {"rol": "TEJIDO"},
        )
        assert r.status_code == 200
        assert r["Content-Type"] == "application/pdf"

    def test_ficha_estructura_endpoint_retorna_pdf(self):
        from apps.authentication.models import Usuario
        from apps.pedidos.models import Pedido
        from rest_framework.test import APIClient
        from django.urls import reverse
        from django.core.cache import cache
        cache.clear()
        admin = Usuario.objects.create_user(
            email="admin_ficha3@decormimbre.ec",
            nombre="Admin Ficha3",
            password="Admin1234!",
            rol="ADMIN",
        )
        pedido = self._pedido_con_items()
        client = APIClient()
        r = client.post(
            reverse("v1:token_obtain_pair"),
            {"email": "admin_ficha3@decormimbre.ec", "password": "Admin1234!"},
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
        r = client.get(
            reverse("v1:pedidos_ficha", kwargs={"pk": pedido.pk}),
            {"rol": "ESTRUCTURA"},
        )
        assert r.status_code == 200
        assert r["Content-Type"] == "application/pdf"
