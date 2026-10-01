# Despliegue en Oracle Cloud (OCI)

Guía completa para poner OpenShorts en marcha en un servidor Oracle Cloud y acceder
a la aplicación web desde cualquier lugar.

---

## 1. Qué se despliega

| Servicio | Contenedor | Puerto | Expuesto a internet |
|----------|-----------|--------|---------------------|
| Backend (FastAPI + pipeline de video) | `openshorts-backend` | 8000 | No (solo interno) |
| Frontend (React/Vite) | `openshorts-frontend` | 5175 | Sí (o vía proxy HTTPS) |

- El navegador solo habla con el **frontend (5175)**; Vite hace de proxy hacia el backend.
- La **API key de Gemini vive en tu navegador** (la pegas en Settings). El servidor nunca
  necesita `GEMINI_API_KEY`.
- Los clips se generan en `./output/` y se borran solos tras `JOB_RETENTION_SECONDS` (1 h).

---

## 2. Elegir la instancia (importante)

El pipeline carga **PyTorch, Whisper, OpenCV y MediaPipe** al procesar: necesita RAM de verdad.

| Shape | RAM | Recomendación |
|-------|-----|---------------|
| **VM.Standard.A1.Flex** (ARM, Ampere) hasta 4 OCPU / 24 GB en Always Free | 24 GB | **Recomendado** — sobra RAM, gratis |
| VM.Standard.E2.1.Micro (AMD, Always Free) | 1 GB | Solo aguantará con swap y trabajando en plan hard; riesgo de OOM al transcribir |
| Instancia pagada (E5, VM.Standard.*) | ≥ 4 GB | Cómodo |

Todas las dependencias (`torch`, `mediapipe`, `ctranslate2`) tienen wheels para **x86_64 y aarch64 (ARM)**,
así que el build funciona en ambos.

Antes de nada, mira qué tienes:

```bash
free -h && nproc && df -h /
```

**Si tienes < 4 GB de RAM, crea swap** (evita que el sistema mate el proceso al transcribir):

```bash
sudo fallocate -l 6G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # debe aparecer "Swap: 6.0Gi"
```

---

## 3. Desde tu máquina: sube tu fork a GitHub

La guía asume que tu código está en GitHub:

```bash
# en tu máquina (este directorio)
git push -u origin personal-main   # o main, el nombre de tu rama
```

---

## 4. En el servidor: acceso e instalación de Docker

### 4.1 Conéctate

```bash
ssh -i ~/.ssh/clave_privada opc@IP_DEL_SERVIDOR
```

### 4.2 Actualiza el sistema e instala Docker

**Ubuntu / Debian:**

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # o cierra y vuelve a entrar por SSH
docker --version && docker compose version
```

**Oracle Linux / RHEL:**

```bash
sudo dnf update -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```

Verifica que Docker arranque en cada boot (lo hace por defecto con el script oficial):

```bash
sudo systemctl is-enabled docker   # debe decir "enabled"
```

---

## 5. Clona el repo y configúralo

```bash
cd ~
git clone https://github.com/TU-USUARIO/TU-REPO.git openshorts
cd openshorts
git checkout personal-main   # o main
```

Crea el `.env` de servidor:

```bash
cp .env.example .env
nano .env
```

Contenido mínimo recomendado:

```bash
# Modelo Gemini para detectar clips (default: gemini-3.1-flash-lite)
# GEMINI_MODEL=gemini-3.1-flash-lite

# En un servidor pequeño, limita concurrencia (default: 5)
MAX_CONCURRENT_JOBS=1

# Retención de jobs/clips en segundos (default 3600 = 1 h)
# JOB_RETENTION_SECONDS=3600

# Si en tu región YouTube bloquea mucho, añade cookies:
# YOUTUBE_COOKIES=cookies.txt   (con el archivo cookies.txt en esta misma carpeta)

# ⚠️ NO pongas GEMINI_API_KEY: la key la pones tú en el navegador (Settings).
# ⚠️ Si no usas backup S3, NO rellenes las variables AWS_*.
```

> Si dejas credenciales AWS, cualquier persona que logre disparar un job subiría
> artefactos a tu bucket. Si no necesitas backup, déjalas vacías.

---

## 6. Abrir puertos en Oracle Cloud (paso que olvida todo el mundo)

Oracle **no bloquea** el tráfico, pero su Security List por defecto solo deja entrar
el puerto 22 (SSH). Abre lo necesario:

1. Consola OCI → **Compute → Instances → tu instancia → Attached VNICs → VNIC →
   Subnet → Security List** (o NSG si usas uno).
2. **Add Ingress Rules**, con estos valores:

| Prioridad | Source | Dest. Port | Protocolo |
|-----------|--------|------------|-----------|
| 1 | 0.0.0.0/0 | 22 | TCP |
| 1 | 0.0.0.0/0 | 80 | TCP |
| 1 | 0.0.0.0/0 | 443 | TCP |
| 1 | 0.0.0.0/0 | 5175 | TCP *(solo si NO usas proxy HTTPS; si usas Caddy, no la abras)* |

Guarda. Si usas **Cloud Shell o NSG**, aplica las reglas ahí también.

---

## 7. Construye y levanta

```bash
cd ~/openshorts
docker compose up -d --build
```

- La **primera compilación tarda 10–30 min** (descarga PyTorch, FFmpeg, Node…):
  la imagen final ocupa ~7 GB. Vigila el disco con `df -h`.
- Verifica:

```bash
docker compose ps            # ambos servicios "running"
docker compose logs -f backend   # debe terminar con "Uvicorn running..."
```

Abre en el navegador:

```
http://IP_DEL_SERVIDOR:5175
```

---

## 8. Prueba end-to-end

1. Abre la app → **Settings** → pega tu **Gemini API key**
   (https://aistudio.google.com/app/apikey) → se guarda solo en tu navegador.
2. Pega una URL de YouTube (o sube un archivo), marca la casilla de contenido,
   **Process**.
3. En los logs en vivo deberías ver:
   `🎙️ Transcribing…` → `🤖 Analyzing with Gemini... Initializing Gemini with model: gemini-3.1-flash-lite`
   → `🔥 Found N viral clips!` → los clips 9:16 apareciendo.
4. Prueba añadir **Subtitles** y **Viral Hook** a un clip y **Download**.

Notas del primer uso:
- El modelo Whisper (`base`, ~140 MB) se descarga en el primer job.
- `yolov8n.pt` ya se pre-descarga en el build.

---

## 9. (Opcional) Dominio + HTTPS con Caddy

Sin HTTPS, la API key viaja en claro por HTTP. Si tienes un **domenio** apuntando al
IP del servidor (registro A → IP), pon un proxy automático con TLS:

Crea `docker-compose.override.yml` en la raíz del proyecto (Docker Compose lo mezcla solo):

```yaml
services:
  caddy:
    image: caddy:2
    container_name: openshorts-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    depends_on:
      - frontend

volumes:
  caddy_data:
  caddy_config:
```

Crea el archivo `caddy/Caddyfile`:

```caddy
tudominio.com {
    reverse_proxy frontend:5173
}
```

Con `docker compose override` mezcla automáticamente los dos archivos. Crea la
carpeta y los dos archivos en la raíz del proyecto:

```bash
mkdir -p caddy
nano docker-compose.override.yml   # pega el YAML de arriba
nano caddy/Caddyfile               # pega el Caddyfile de arriba
docker compose up -d
```

- Caddy obtiene certificado Let's Encrypt solo, renueva solo.
- Como `caddy` entra en la red del compose, usa el nombre del servicio `frontend`
  (el `5175:5173` del compose solo es para pruebas sin dominio).
- Con esto ya **no necesitas abrir ni 5175 ni 8000**: solo 22, 80 y 443.
- Acceso final: `https://tudominio.com`

---

## 10. Operación diaria

**Arranque automático** — los contenedores ya llevan `restart: unless-stopped` y
Docker arranca en el boot: tras un reboot la app vuelve sola.

**Ver logs en vivo:**

```bash
docker compose logs -f            # todo
docker compose logs -f backend    # solo pipeline
```

**Actualizar tras cambiar código:**

```bash
cd ~/openshorts
git pull
docker compose up -d --build
```

**Estado y recursos:**

```bash
docker compose ps
free -h
df -h /
```

**Limpieza:**
- Los jobs/clips se borran solos tras 1 h (`JOB_RETENTION_SECONDS`).
- Limpiar imágenes Docker viejas tras varios builds:
  ```bash
  docker system prune -af --filter "until=720h"
  ```

**Backup (opcional):** instala `oci` CLI o usa rsync de `~/openshorts` y de `./output/`.

---

## 11. Seguridad (resumen)

- ✅ Solo expón 22 + 80/443 (vía Caddy). No abras 8000.
- ✅ `GEMINI_API_KEY` solo en el navegador; el server no la tiene.
- ✅ No rellenes `AWS_*` en `.env` si no usas backup S3.
- ✅ HTTPS con dominio → la key viaja cifrada.
- ✅ El backend no tiene autenticación: cualquiera que alcance el puerto puede
  subir videos. Con solo 80/443 abiertos y proxy correcto, el riesgo se limita a
  que usen tu servicio (y solo procesan con **su** key de Gemini). Si quieres
  restringirlo, limita las reglas de ingress a las IP desde donde accedes.

---

## 12. Problemas comunes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `Killed` al transcribir / job muere sin error | Poca RAM (OOM) | Aumenta swap (paso 2) y/o `MAX_CONCURRENT_JOBS=1`; mejor shape con más RAM |
| `❌ Gemini Error … model ... not found` o 404 | Modelo no disponible en tu proyecto | `GEMINI_MODEL=gemini-3.5-flash` en `.env` y reinicia: `docker compose restart backend` |
| `429` / `overloaded` de Gemini | Límite de cuota | El pipeline reintenta solo (3 intentos); baja la frecuencia de uso |
| YouTube: `HTTP Error 403` / bot detection | YouTube bloquea IPs de datacenter | Añade `YOUTUBE_COOKIES` (archivo de cookies exportado) en `.env` |
| Job falla con `NO_AUDIO` | Video sin pista de audio | Error esperado; procesa videos con audio |
| `docker compose up` falla en el build de `mediapipe`/`torch` | Arquitectura o red | Verifica `uname -m` (x86_64/aarch64 soportados); reintenta (docker cachea capas) |
| 502/504 en Caddy | Frontend reiniciándose | `docker compose ps` y `docker compose logs frontend` |
| No arranca tras reboot | Docker deshabilitado | `sudo systemctl enable docker` |
| Puerto 5175 no responde desde fuera | Security List OCI sin la regla | Paso 6 |
