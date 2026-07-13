# Guía rápida: Web Push (VAPID) y prueba en el celular

## 1. Generar las claves VAPID

Solo se hace una vez. `py_vapid` ya viene instalado con `pywebpush`:

```bash
cd decormimbre_backend
source .venv/bin/activate

vapid --gen                    # crea private_key.pem y public_key.pem
vapid --applicationServerKey   # imprime "Application Server Key" (la clave pública)
base64 -i private_key.pem | tr -d '\n' && echo   # valor para VAPID_PRIVATE_KEY_B64
```

Copia los valores en `decormimbre_backend/.env`:

```dotenv
VAPID_PUBLIC_KEY=<Application Server Key impresa por el segundo comando>
VAPID_PRIVATE_KEY_B64=<salida del comando base64>
VAPID_SUBJECT=mailto:decormimbre@yahoo.com
```

> No subas `private_key.pem` al repo. Bórralo o guárdalo fuera del proyecto
> después de copiar los valores. Si `VAPID_PUBLIC_KEY` queda vacío, el push
> simplemente se deshabilita (email e in-app siguen funcionando).

Reinicia el backend para que tome el `.env`:

```bash
python manage.py runserver
```

Verifica: `curl http://localhost:8000/api/auth/push/public-key/` debe devolver la clave.

## 2. Probar en el celular con un túnel

El push requiere **HTTPS**, por eso `localhost` no sirve desde el celular.
Un túnel expone tu Vite dev server (que ya hace proxy de `/api` al backend)
con un certificado válido.

Con **cloudflared** (gratis, sin cuenta):

```bash
brew install cloudflared

# Terminal 1 — backend
cd decormimbre_backend && source .venv/bin/activate && python manage.py runserver

# Terminal 2 — frontend
cd decormimbre_frontend && npm run dev

# Terminal 3 — túnel hacia Vite
cloudflared tunnel --url http://localhost:5173
```

Cloudflared imprime una URL tipo `https://algo-aleatorio.trycloudflare.com`.
Ábrela en el celular. (El `vite.config.ts` ya permite hosts `*.trycloudflare.com`;
si usas ngrok u otro túnel, agrega su dominio a `server.allowedHosts`.)

Alternativa con ngrok: `ngrok http 5173`.

## 3. Activar y probar la notificación

1. En el celular, inicia sesión con una cuenta de cliente.
2. Ve a **Mi cuenta** y activa las notificaciones (el navegador pedirá permiso).
   - **Android (Chrome):** funciona directo desde la web.
   - **iPhone (iOS 16.4+):** primero toca *Compartir → Añadir a pantalla de inicio*
     y abre la app desde ese ícono; Safari solo permite push en PWA instalada.
3. Desde el admin, cambia el estado de un pedido/cotización de ese cliente.
4. La notificación debe llegar al celular aunque la pestaña esté cerrada.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| "El servidor no tiene el push configurado" | `VAPID_PUBLIC_KEY` vacío o backend sin reiniciar |
| El permiso se concede pero no llega nada | `VAPID_PRIVATE_KEY_B64` mal copiada (regenera y vuelve a copiar) |
| No aparece el diálogo de permiso en iPhone | No está instalada como PWA (paso 2 de arriba) |
| Vite responde "Blocked request. This host is not allowed" | Falta el dominio del túnel en `server.allowedHosts` |
| Llega en la laptop pero no en el celular | El celular se suscribió antes de configurar VAPID: desactiva y reactiva las notificaciones |
