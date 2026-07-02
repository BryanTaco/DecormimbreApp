import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """
    Limpia la caché de throttle antes de cada test para que
    los tests no acumulen contadores de LoginRateThrottle entre sí.
    """
    cache.clear()
    yield
    cache.clear()
