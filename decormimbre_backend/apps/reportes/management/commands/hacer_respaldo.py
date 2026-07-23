"""
Comando: python manage.py hacer_respaldo [--mantener N]

Genera un pg_dump comprimido de la base de datos PostgreSQL y rota backups antiguos.

Uso típico:
    python manage.py hacer_respaldo            # guarda en backups/, mantiene 30
    python manage.py hacer_respaldo --mantener 7
"""
import gzip
import os
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Genera un respaldo comprimido de PostgreSQL y rota backups antiguos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--mantener",
            type=int,
            default=30,
            help="Número de respaldos a conservar (default: 30).",
        )
        parser.add_argument(
            "--directorio",
            type=str,
            default=None,
            help="Directorio destino (default: <BASE_DIR>/backups/).",
        )

    def handle(self, *args, **options):
        mantener = options["mantener"]
        directorio = Path(options["directorio"]) if options["directorio"] else settings.BASE_DIR / "backups"
        directorio.mkdir(parents=True, exist_ok=True)

        db = settings.DATABASES["default"]
        engine = db.get("ENGINE", "")
        if "postgresql" not in engine and "postgis" not in engine:
            self.stderr.write(self.style.ERROR("Este comando solo funciona con PostgreSQL."))
            return

        # ── Construir nombre de archivo ───────────────────────────────────────
        ts = datetime.now().strftime("%Y-%m-%d_%H-%M")
        nombre_archivo = directorio / f"decormimbre_{ts}.sql.gz"

        # ── Variables de entorno para pg_dump ─────────────────────────────────
        env = os.environ.copy()
        host = db.get("HOST", "localhost")
        port = str(db.get("PORT", 5432))
        nombre_db = db.get("NAME", "")
        usuario = db.get("USER", "")
        password = db.get("PASSWORD", "")

        if password:
            env["PGPASSWORD"] = password

        # ── Ejecutar pg_dump ──────────────────────────────────────────────────
        pg_dump = shutil.which("pg_dump") or "pg_dump"
        cmd = [
            pg_dump,
            "--host", host,
            "--port", port,
            "--username", usuario,
            "--no-password",
            "--format", "plain",
            "--no-owner",
            "--no-acl",
            nombre_db,
        ]

        self.stdout.write(f"Generando respaldo → {nombre_archivo.name} ...")

        try:
            proceso = subprocess.run(
                cmd,
                capture_output=True,
                env=env,
                timeout=300,
            )
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(
                "No se encontró pg_dump. Instala postgresql-client o agrega pg_dump al PATH."
            ))
            return
        except subprocess.TimeoutExpired:
            self.stderr.write(self.style.ERROR("pg_dump tardó demasiado (>5 min). Abortado."))
            return

        if proceso.returncode != 0:
            self.stderr.write(self.style.ERROR(
                f"pg_dump falló (código {proceso.returncode}):\n{proceso.stderr.decode()}"
            ))
            return

        # ── Comprimir con gzip ────────────────────────────────────────────────
        with gzip.open(nombre_archivo, "wb", compresslevel=6) as f:
            f.write(proceso.stdout)

        tam_mb = nombre_archivo.stat().st_size / 1_048_576
        self.stdout.write(self.style.SUCCESS(
            f"Respaldo creado: {nombre_archivo.name}  ({tam_mb:.2f} MB)"
        ))

        # ── Rotar: eliminar respaldos más antiguos ────────────────────────────
        pattern = re.compile(r"^decormimbre_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.sql\.gz$")
        todos = sorted(
            [f for f in directorio.iterdir() if pattern.match(f.name)],
            key=lambda f: f.stat().st_mtime,
        )
        a_eliminar = todos[:-mantener] if len(todos) > mantener else []
        for viejo in a_eliminar:
            viejo.unlink()
            self.stdout.write(f"  eliminado (rotación): {viejo.name}")

        self.stdout.write(
            f"Respaldos guardados: {min(len(todos), mantener)} / {mantener} máximo."
        )
