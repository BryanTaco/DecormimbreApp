from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Solo usuarios con rol ADMIN."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol == "ADMIN"
        )


class IsPropietario(BasePermission):
    """Solo usuarios con rol PROPIETARIO."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol == "PROPIETARIO"
        )


class IsAdminOrPropietario(BasePermission):
    """Administrador o Propietario (cualquiera de los dos)."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol in ("ADMIN", "PROPIETARIO")
        )


class IsArtesano(BasePermission):
    """Solo usuarios con rol ARTESANO."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol == "ARTESANO"
        )


class IsAdminOrPropietarioOrArtesano(BasePermission):
    """Cualquier usuario autenticado con rol válido del sistema."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol in ("ADMIN", "PROPIETARIO", "ARTESANO")
        )
