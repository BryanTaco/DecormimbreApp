import re
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Limita a 5 intentos de login por IP en una ventana de 15 minutos.
    Tras el 6to intento retorna HTTP 429 con cabecera Retry-After.
    Soporta formatos de rate como "5/15min" además de los estándar de DRF.
    """
    scope = "login"

    def get_cache_key(self, request, view):
        return f"throttle_login_{self.get_ident(request)}"

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        match = re.fullmatch(r"(\d+)/(\d+)(min|sec|hour|day|s|m|h|d)", rate)
        if match:
            num = int(match.group(1))
            multiplier = int(match.group(2))
            unit = match.group(3)
            units = {"s": 1, "sec": 1, "m": 60, "min": 60, "h": 3600, "hour": 3600, "d": 86400, "day": 86400}
            return (num, multiplier * units[unit])
        return super().parse_rate(rate)
