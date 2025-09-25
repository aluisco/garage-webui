# Garage Web UI - Desarrollo

Esta guía te ayudará a configurar el entorno de desarrollo para Garage Web UI con hot reload y todas las funcionalidades avanzadas.

## 🚀 Quick Start

### Opción 1: Docker (Recomendado)

```bash
# Clona el repositorio
git clone https://github.com/khairul169/garage-webui.git
cd garage-webui

# Inicia el entorno completo de desarrollo
npm run dev:docker

# O por separado:
npm run dev:docker:frontend  # Solo frontend
npm run dev:docker:backend   # Solo backend
npm run dev:docker:fullstack # Todo en un contenedor
```

### Opción 2: Local

```bash
# Instalar dependencias
pnpm install
npm run install:backend

# Desarrollo local (requiere Garage corriendo)
npm run dev
```

## 📁 Estructura del Proyecto

```
garage-webui/
├── src/                          # Frontend React + TypeScript
│   ├── components/              # Componentes reutilizables
│   ├── pages/                   # Páginas principales
│   │   ├── admin/              # Dashboard de administración
│   │   ├── auth/               # Autenticación
│   │   ├── buckets/            # Gestión de buckets
│   │   ├── cluster/            # Gestión del clúster
│   │   └── keys/               # Gestión de keys
│   ├── hooks/                   # Custom hooks
│   ├── types/                   # TypeScript types
│   └── lib/                     # Utilidades
├── backend/                      # Backend Go
│   ├── middleware/              # Middleware de seguridad
│   ├── router/                  # Endpoints API
│   ├── schema/                  # Modelos de datos
│   └── utils/                   # Utilidades del servidor
├── docker-compose.dev.yml       # Entorno de desarrollo
├── Dockerfile.dev              # Dockerfile para desarrollo
└── README.dev.md               # Esta documentación
```

## 🛠️ Configuración del Entorno

### Variables de Entorno

Crea un archivo `garage.toml` para Garage (ejemplo mínimo):

```toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"

replication_factor = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "1799bccfd7411abbccc9a3f8a0ccc314f5d0d9690e9a2cc4de5ba8faa24a3ee2"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

[admin]
api_bind_addr = "[::]:3903"
admin_token = "admin-token-change-me"
metrics_token = "metrics-token-change-me"
```

### Variables de Entorno para Desarrollo

El proyecto incluye configuración automática para desarrollo:

**Frontend (.env.development):**
```env
VITE_API_URL=http://localhost:3909
VITE_MODE=development
VITE_DEBUG=true
```

**Backend (docker-compose.dev.yml):**
```env
CONFIG_PATH=/etc/garage.toml
API_BASE_URL=http://garage:3903
S3_ENDPOINT_URL=http://garage:3900
DATA_DIR=/app/data
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=1m
```

## 🔥 Hot Reload

### Frontend (React)
- **Puerto**: 5173
- **Hot Module Replacement**: Activado automáticamente
- **Proxy API**: `/api/*` → `http://localhost:3909`
- **File Watching**: Optimizado para Docker con polling

### Backend (Go)
- **Puerto**: 3909
- **Herramienta**: Air (similar a nodemon para Node.js)
- **Auto-rebuild**: Al cambiar archivos `.go`
- **Configuración**: `backend/.air.toml`

## 🐳 Opciones de Docker

### 1. Frontend + Backend Separados (Recomendado)

```bash
# Inicia Garage + Frontend + Backend en contenedores separados
npm run dev:docker

# Accede a:
# - Frontend: http://localhost:5173 (con HMR)
# - Backend API: http://localhost:3909
# - Garage S3: http://localhost:3900
# - Garage Admin: http://localhost:3903
```

**Ventajas:**
- ✅ Mejor aislamiento
- ✅ Hot reload independiente
- ✅ Fácil debugging
- ✅ Logs separados

### 2. Frontend Solo

```bash
npm run dev:docker:frontend
```
Útil cuando quieres desarrollar solo el frontend con un backend en producción.

### 3. Backend Solo

```bash
npm run dev:docker:backend
```
Útil para desarrollo de API con frontend en producción.

### 4. Fullstack (Un Solo Contenedor)

```bash
npm run dev:docker:fullstack
```
**Puertos alternativos:** Frontend: 5174, Backend: 3910

## 📝 Scripts Disponibles

### Desarrollo
```bash
npm run dev                    # Local: Frontend + Backend
npm run dev:client            # Solo frontend local
npm run dev:server            # Solo backend local
npm run dev:docker           # Docker: Todo el entorno
npm run dev:docker:frontend  # Docker: Solo frontend
npm run dev:docker:backend   # Docker: Solo backend
npm run dev:docker:fullstack # Docker: Fullstack
```

### Build y Testing
```bash
npm run build               # Build de producción
npm run build:dev          # Build de desarrollo
npm run type-check         # Verificar tipos TypeScript
npm run lint               # Linter
npm run lint:fix           # Fix automático del linter
npm run test:backend       # Tests del backend Go
```

### Backend
```bash
npm run install:backend    # Instalar dependencias Go
npm run build:backend      # Build del backend
```

### Limpieza
```bash
npm run clean              # Limpiar cache y builds
npm run dev:docker:clean   # Limpiar contenedores y volúmenes
```

## 🔐 Sistema de Autenticación

### Usuario por Defecto
Al iniciar por primera vez, se crea automáticamente:
- **Usuario**: `admin`
- **Contraseña**: `admin`
- **Rol**: Administrador

**⚠️ IMPORTANTE**: Cambia la contraseña después del primer login.

### Roles Disponibles
- **Admin**: Acceso completo al sistema
- **Tenant Admin**: Administración de su tenant
- **User**: Usuario básico con permisos limitados
- **ReadOnly**: Solo lectura

## 🎯 Funcionalidades de Desarrollo

### Dashboard de Administración
- ✅ Gestión completa de usuarios
- ✅ Sistema de tenants (multi-tenancy)
- ✅ Roles y permisos granulares
- ✅ Configuración dinámica de S3
- ✅ Monitoreo del sistema

### Seguridad Implementada
- ✅ Autenticación JWT con sessiones
- ✅ Rate limiting configurable
- ✅ Headers de seguridad (CORS, XSS, etc.)
- ✅ Cifrado bcrypt para contraseñas
- ✅ Middleware de autorización

### Base de Datos
- ✅ Persistencia en JSON local
- ✅ Thread-safe operations
- ✅ Backup automático
- ✅ Migration desde configuración legacy

## 🐛 Debugging

### Logs del Frontend
```bash
# Ver logs del frontend
docker-compose -f docker-compose.dev.yml logs -f webui-frontend

# O desde el navegador
# Abre DevTools → Console
```

### Logs del Backend
```bash
# Ver logs del backend
docker-compose -f docker-compose.dev.yml logs -f webui-backend

# Ver logs de Garage
docker-compose -f docker-compose.dev.yml logs -f garage
```

### Debugging del Backend Go
```bash
# Ejecutar en contenedor para debugging
docker-compose -f docker-compose.dev.yml exec webui-backend sh

# Ver estado de la base de datos
cat /app/data/database.json

# Logs de compilación
cat /app/build-errors.log
```

## 📊 Monitoreo

### Endpoints Útiles para Desarrollo
- `GET /api/auth/status` - Estado de autenticación
- `GET /api/s3/status` - Estado del sistema S3
- `GET /api/s3/config` - Configuración actual
- `POST /api/s3/test` - Test de conectividad
- `GET /api/users` - Lista de usuarios (admin)
- `GET /api/tenants` - Lista de tenants (admin)

### Health Checks
- Garage: `http://localhost:3903/status`
- WebUI Backend: `http://localhost:3909/api/s3/status`

## 🚨 Troubleshooting

### El frontend no se actualiza automáticamente
```bash
# Verificar que el polling esté habilitado
# En vite.config.ts debe estar:
watch: {
  usePolling: true,
  interval: 100,
}
```

### El backend no se recarga
```bash
# Verificar que Air esté corriendo
docker-compose -f docker-compose.dev.yml logs webui-backend

# Debe mostrar: "watching .go files"
```

### Problemas de conectividad
```bash
# Verificar que todos los servicios estén corriendo
docker-compose -f docker-compose.dev.yml ps

# Verificar conectividad a Garage
curl http://localhost:3903/status
```

### Limpiar estado corrupto
```bash
# Limpiar todo y empezar de nuevo
npm run dev:docker:clean
docker system prune -a
npm run dev:docker
```

### Base de datos corrupta
```bash
# Backup automático en dev-data/
cp dev-data/backup-database.json backend/data/database.json

# O eliminar para recrear usuario admin
rm backend/data/database.json
```

## 🎨 Desarrollo del Frontend

### Estructura de Componentes
- `src/components/ui/` - Componentes base (Button, Input, etc.)
- `src/components/containers/` - Contenedores (Sidebar, Theme, etc.)
- `src/components/layouts/` - Layouts de página
- `src/pages/` - Páginas específicas

### Estado Global
- **React Query**: Cache de API y estado servidor
- **Zustand**: Estado global mínimo (theme, etc.)
- **React Hook Form**: Formularios con validación

### Estilos
- **Tailwind CSS**: Utility-first CSS
- **DaisyUI**: Componentes pre-diseñados
- **CSS Modules**: Estilos específicos cuando es necesario

## 🔧 Desarrollo del Backend

### Arquitectura
```
backend/
├── main.go              # Entry point
├── router/              # Endpoints HTTP
│   ├── auth.go         # Autenticación
│   ├── users.go        # Gestión usuarios
│   ├── tenants.go      # Gestión tenants
│   └── s3config.go     # Configuración S3
├── middleware/         # Middleware HTTP
│   ├── auth.go        # Autenticación
│   └── security.go    # Seguridad (CORS, Rate limiting)
├── schema/            # Modelos de datos
├── utils/             # Utilidades
└── .air.toml         # Configuración hot reload
```

### Adding New Endpoints
```go
// 1. Agregar al router (router/router.go)
users := &Users{}
router.HandleFunc("GET /users", users.GetAll)

// 2. Implementar handler (router/users.go)
func (u *Users) GetAll(w http.ResponseWriter, r *http.Request) {
    // Verificar permisos
    if !u.checkPermission(r, schema.PermissionReadUsers) {
        utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
        return
    }

    // Lógica del endpoint
    users, err := utils.DB.ListUsers()
    if err != nil {
        utils.ResponseError(w, err)
        return
    }

    utils.ResponseSuccess(w, users)
}
```

## 🔒 Seguridad en Desarrollo

### HTTPS Local (Opcional)
Para testing de características que requieren HTTPS:

```bash
# Generar certificados locales
mkcert localhost 127.0.0.1

# Actualizar vite.config.ts para usar HTTPS
server: {
  https: {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem'),
  },
  // ... resto de config
}
```

### Variables de Entorno Sensibles
```bash
# NO commitear archivos con secretos reales
# Usar valores de desarrollo como:
rpc_secret = "dev-secret-not-for-production"
admin_token = "dev-admin-token"
```

## 📋 Checklist Pre-Commit

- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run test:backend` pasa todos los tests
- [ ] Hot reload funciona en frontend y backend
- [ ] Dashboard de admin funciona correctamente
- [ ] No hay secrets hardcodeados en el código

## 🚀 Deployment

Una vez que el desarrollo esté listo, usa el docker-compose.yml original para producción:

```bash
# Build de producción
npm run build

# Deploy con el docker-compose.yml original
docker-compose up --build
```

## 💡 Tips de Desarrollo

### VS Code Extensions Recomendadas
- TypeScript Importer
- Tailwind CSS IntelliSense
- Go Extension
- Docker Extension
- Thunder Client (para testing de APIs)

### Chrome Extensions Útiles
- React Developer Tools
- TanStack Query DevTools

---

**¿Problemas?** Abre un issue en el repositorio con:
1. Comando que causó el problema
2. Logs completos (`docker-compose logs`)
3. Sistema operativo y versión de Docker
4. Pasos para reproducir