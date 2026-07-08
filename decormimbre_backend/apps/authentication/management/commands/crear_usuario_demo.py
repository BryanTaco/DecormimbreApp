"""
Crea usuarios de demostración para probar el login (idempotente).

Uso:
    python manage.py crear_usuario_demo
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authentication.models import Usuario


DEMOS = [
    # email, nombre, password, rol, is_staff, is_superuser
    ("admin@decormimbre.ec", "Administrador Demo", "Decormimbre2026", "ADMIN", True, True),
    ("cliente@decormimbre.ec", "Cliente Demo", "Cliente2026", "CLIENTE", False, False),
]


class Command(BaseCommand):
    help = "Crea/actualiza usuarios demo (admin y cliente) para probar el login."

    @transaction.atomic
    def handle(self, *args, **options):
        for email, nombre, password, rol, is_staff, is_superuser in DEMOS:
            usuario, created = Usuario.objects.get_or_create(
                email=email,
                defaults={"nombre": nombre, "rol": rol, "is_staff": is_staff, "is_superuser": is_superuser},
            )
            usuario.nombre = nombre
            usuario.rol = rol
            usuario.is_staff = is_staff
            usuario.is_superuser = is_superuser
            usuario.activo = True
            usuario.set_password(password)
            usuario.save()

            # Para el cliente demo, asegurar un perfil de Cliente vinculado
            if rol == "CLIENTE":
                try:
                    from apps.clientes.models import Cliente
                    Cliente.objects.get_or_create(
                        usuario_cuenta=usuario,
                        defaults={
                            "nombre_completo": nombre,
                            "email": email,
                            "telefono": "0980572561",
                            "cedula_ruc": "9999999999",
                        },
                    )
                except Exception as exc:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"  (No se pudo crear perfil de cliente: {exc})"))

            estado = "Creado" if created else "Actualizado"
            self.stdout.write(self.style.SUCCESS(f"{estado}: {email} / {password}  ({rol})"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Listo. Admin → /admin/login   ·   Cliente → /login"))
