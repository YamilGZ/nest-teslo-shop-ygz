<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Teslo Shop API

API REST desarrollada con NestJS para la gestión de productos de una tienda online. Incluye autenticación JWT, gestión de productos, subida de imágenes, sistema de roles y documentación completa con Swagger.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Docker](#-docker)
- [Ejecución](#-ejecución)
- [Documentación Swagger](#-documentación-swagger)
- [Endpoints](#-endpoints)
- [Seeds y Datos de Ejemplo](#-seeds-y-datos-de-ejemplo)
- [Estructura del Proyecto](#-estructura-del-proyecto)

## ✨ Características

- 🔐 **Autenticación JWT**: Sistema de autenticación con tokens JWT válidos por 1 hora
- 👥 **Sistema de Roles**: Control de acceso basado en roles (user, admin, super-user)
- 📦 **Gestión de Productos**: CRUD completo para productos con paginación
- 🖼️ **Subida de Imágenes**: Gestión de imágenes para productos
- 📝 **Validación de Datos**: Validación automática con class-validator
- 📚 **Documentación Swagger**: Documentación interactiva de la API
- 🗄️ **Base de Datos PostgreSQL**: Persistencia de datos con TypeORM
- 🐳 **Docker**: Configuración con Docker Compose para la base de datos
- 🌱 **Seeds**: Datos de ejemplo para desarrollo y testing

## 🛠️ Tecnologías

- **NestJS** - Framework de Node.js
- **TypeScript** - Lenguaje de programación
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **Passport** - Middleware de autenticación
- **Swagger** - Documentación de API
- **bcrypt** - Encriptación de contraseñas
- **class-validator** - Validación de DTOs
- **Multer** - Manejo de archivos
- **Docker** - Contenedorización

## 📦 Requisitos

- Node.js (v18 o superior)
- npm o yarn
- Docker y Docker Compose
- PostgreSQL 14.3 (o usar Docker)

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd teslo-shopv3
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env basado en .env.template
cp .env.template .env
```

4. **Editar el archivo .env** con tus configuraciones (ver sección de Variables de Entorno)

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teslodb
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_segura

# JWT
JWT_SECRET=tu_secret_key_super_segura_aqui

# Servidor
PORT=3000
HOST_API=http://localhost:3000/api
```

**Importante**: 
- Cambia `JWT_SECRET` por una cadena aleatoria segura
- Asegúrate de que `DB_PASSWORD` coincida con la configuración de Docker

## 🐳 Docker

### Levantar la Base de Datos

El proyecto incluye un `docker-compose.yaml` para levantar PostgreSQL fácilmente:

```bash
# Levantar la base de datos en segundo plano
docker-compose up -d

# Ver los logs de la base de datos
docker-compose logs -f db

# Detener la base de datos
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina los datos)
docker-compose down -v
```

### Configuración de Docker

El `docker-compose.yaml` está configurado con:
- **Imagen**: PostgreSQL 14.3
- **Puerto**: 5432
- **Volumen**: `./postgres` (persistencia de datos)
- **Container name**: `teslodb`

Las variables de entorno de la base de datos se toman del archivo `.env`:
- `POSTGRES_PASSWORD`: Debe coincidir con `DB_PASSWORD` en tu `.env`
- `POSTGRES_DB`: Debe coincidir con `DB_NAME` en tu `.env`

## ▶️ Ejecución

### Modo Desarrollo

```bash
npm run start:dev
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado en `.env`)

### Modo Producción

```bash
# Compilar el proyecto
npm run build

# Ejecutar en producción
npm run start:prod
```

### Otros Comandos

```bash
# Formatear código
npm run format

# Linter
npm run lint

# Tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## 📚 Documentación Swagger

Una vez que el servidor esté corriendo, accede a la documentación interactiva de Swagger en:

**URL**: `http://localhost:3000/api/docs`

### Características de Swagger

- 📖 Documentación completa de todos los endpoints
- 🔍 Prueba de endpoints directamente desde el navegador
- 🔐 Autenticación JWT integrada (botón "Authorize")
- 📝 Ejemplos de requests y responses
- 🎯 Validación de esquemas

### Cómo usar Swagger

1. Abre `http://localhost:3000/api/docs` en tu navegador
2. Para endpoints protegidos:
   - Haz clic en el botón **"Authorize"** (🔒)
   - Ingresa tu token JWT obtenido del endpoint `/api/auth/login`
   - Haz clic en **"Authorize"** y luego en **"Close"**
3. Explora los endpoints y prueba las peticiones directamente

## 🔌 Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/check-status` | Verificar estado de autenticación | Sí |
| GET | `/api/auth/private` | Ruta privada de prueba | Sí |
| GET | `/api/auth/private2` | Ruta con rol super-user | Sí (super-user) |
| GET | `/api/auth/private3` | Ruta con rol super-user (decorador) | Sí (super-user) |

### Productos (`/api/products`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Listar productos (paginado) | Sí |
| GET | `/api/products/:term` | Buscar producto por ID/slug/título | Sí |
| POST | `/api/products` | Crear nuevo producto | Sí |
| PATCH | `/api/products/:id` | Actualizar producto | Sí |
| DELETE | `/api/products/:id` | Eliminar producto | Sí |

**Query Parameters para GET `/api/products`**:
- `limit` (opcional): Número de productos a retornar (default: 10)
- `offset` (opcional): Número de productos a omitir (default: 0)

### Archivos (`/api/files`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/files/product/:imageName` | Obtener imagen de producto | No |
| POST | `/api/files/product` | Subir imagen de producto | No |

**Nota**: El endpoint de subida acepta archivos multipart/form-data con el campo `file`.

### Seed (`/api/seed`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/seed` | Ejecutar seed de base de datos | No |

## 🌱 Seeds y Datos de Ejemplo

El proyecto incluye un sistema de seeds que pobla la base de datos con datos de ejemplo.

### Ejecutar Seed

```bash
# Opción 1: Desde el navegador
http://localhost:3000/api/seed

# Opción 2: Con curl
curl http://localhost:3000/api/seed
```

### Datos que se Crean

#### Usuarios de Prueba

1. **Usuario Admin**
   - Email: `test1@google.com`
   - Password: `Abc123`
   - Roles: `['admin']`

2. **Usuario Super User**
   - Email: `test2@google.com`
   - Password: `Abc123`
   - Roles: `['user', 'super']`

#### Productos

Se crean **50 productos** de ejemplo con las siguientes características:

- **Categorías**: men, women, kid, unisex
- **Tipos**: shirts, pants, hoodies, hats
- **Tallas**: XS, S, M, L, XL, XXL, XXXL
- **Información completa**: título, descripción, precio, stock, imágenes, tags

### Ejemplos de Productos

```json
{
  "title": "Men's Chill Crew Neck Sweatshirt",
  "price": 75,
  "description": "Introducing the Tesla Chill Collection...",
  "slug": "mens_chill_crew_neck_sweatshirt",
  "stock": 7,
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
  "gender": "men",
  "tags": ["sweatshirt"],
  "images": [
    "1740176-00-A_0_2000.jpg",
    "1740176-00-A_1.jpg"
  ]
}
```

### Estructura de Datos de Seed

Los datos de seed se encuentran en `src/seed/data/seed-data.ts` y incluyen:

- **Usuarios**: Array de usuarios con contraseñas encriptadas
- **Productos**: Array de productos con toda su información

## 📁 Estructura del Proyecto

```
teslo-shopv3/
├── src/
│   ├── auth/                 # Módulo de autenticación
│   │   ├── decorators/       # Decoradores personalizados
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entities/         # Entidades de TypeORM
│   │   ├── guards/           # Guards de autorización
│   │   ├── interfaces/       # Interfaces y tipos
│   │   ├── strategies/       # Estrategias de Passport
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── products/             # Módulo de productos
│   │   ├── dto/              # DTOs de productos
│   │   ├── entities/         # Entidades de productos
│   │   ├── products.controller.ts
│   │   ├── products.module.ts
│   │   └── products.service.ts
│   ├── files/                # Módulo de archivos
│   │   ├── helpers/          # Helpers para manejo de archivos
│   │   ├── files.controller.ts
│   │   ├── files.module.ts
│   │   └── files.service.ts
│   ├── seed/                 # Módulo de seeds
│   │   ├── data/             # Datos de seed
│   │   ├── seed.controller.ts
│   │   ├── seed.module.ts
│   │   └── seed.service.ts
│   ├── common/               # Módulo común
│   │   └── dtos/             # DTOs compartidos
│   ├── app.module.ts         # Módulo principal
│   └── main.ts               # Punto de entrada
├── static/                   # Archivos estáticos
│   └── products/            # Imágenes de productos
├── postgres/                 # Volumen de PostgreSQL (Docker)
├── docker-compose.yaml       # Configuración de Docker
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Autenticación

### Flujo de Autenticación

1. **Registro o Login**: Obtén un token JWT
   ```bash
   POST /api/auth/login
   {
     "email": "test1@google.com",
     "password": "Abc123"
   }
   ```

2. **Usar el Token**: Incluye el token en las peticiones protegidas
   ```
   Authorization: Bearer <tu_token_jwt>
   ```

3. **Verificar Estado**: Renueva el token si es necesario
   ```bash
   GET /api/auth/check-status
   Authorization: Bearer <tu_token_jwt>
   ```

### Roles Disponibles

- `user`: Usuario básico
- `admin`: Administrador
- `super-user`: Super usuario

### Protección de Endpoints

- `@Auth()`: Requiere autenticación
- `@Auth(ValidRoles.admin)`: Requiere rol específico
- `@Auth(ValidRoles.superUser)`: Requiere super usuario

## 📝 Ejemplos de Uso

### Crear un Producto

```bash
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nuevo Producto",
  "price": 99.99,
  "description": "Descripción del producto",
  "stock": 10,
  "sizes": ["S", "M", "L"],
  "gender": "men",
  "tags": ["nuevo", "oferta"]
}
```

### Subir una Imagen

```bash
POST /api/files/product
Content-Type: multipart/form-data

file: <archivo_imagen>
```

### Buscar Productos con Paginación

```bash
GET /api/products?limit=5&offset=0
Authorization: Bearer <token>
```

## 🐛 Troubleshooting

### Error de conexión a la base de datos

- Verifica que Docker esté corriendo: `docker ps`
- Verifica que el contenedor esté activo: `docker-compose ps`
- Revisa las variables de entorno en `.env`
- Asegúrate de que `DB_PASSWORD` coincida en `.env` y `docker-compose.yaml`

### Error de autenticación

- Verifica que el token JWT sea válido
- Revisa que `JWT_SECRET` esté configurado en `.env`
- Asegúrate de que el token no haya expirado (válido por 1 hora)

### Error al subir imágenes

- Verifica que la carpeta `static/products` exista
- Revisa los permisos de escritura
- Asegúrate de que el archivo sea una imagen válida (jpg, jpeg, png, gif)


---

<p align="center">
  Hecho con ❤️ usando NestJS
</p>
