# SoftwareFreeMp3

Aplicación web para descargar contenido multimedia utilizando Node.js, yt-dlp y FFmpeg.
El proyecto permite descargar audio y video mediante una interfaz web utilizando herramientas de código abierto.

---

# Requisitos previos

Antes de iniciar el proyecto es necesario instalar las siguientes herramientas.

---

# 1. Dependencias necesarias

## Node.js

Node.js es necesario para ejecutar el servidor y administrar las dependencias del proyecto.

Descargar desde:

https://nodejs.org/es/download

Después de instalar Node.js, abrir una terminal y comprobar que la instalación fue correcta:

```bash
node -v
```

Ejemplo de salida:

```
v24.x.x
```

También comprobar npm:

```bash
npm -v
```

Ejemplo:

```
11.x.x
```

---

## Extensión para obtener cookies de YouTube

Para que yt-dlp pueda acceder correctamente a ciertos videos de YouTube es necesario utilizar un archivo `cookies.txt`.

Instalar la siguiente extensión para Chrome:

https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc

---

# 2. Instalación del proyecto

Abrir el proyecto utilizando Visual Studio Code.

Abrir una terminal dentro del proyecto y ejecutar:

```bash
npm install
```

Este comando instalará todas las dependencias necesarias y creará la carpeta:

```
node_modules/
```

---

# 3. Configuración de cookies

Para utilizar yt-dlp con YouTube es necesario exportar las cookies de una cuenta iniciada.

## Paso 1

Abrir YouTube con una cuenta iniciada.


![Cookies 1.](./public/img/Cookies1.png)


## Paso 2

Abrir la extensión instalada anteriormente.

Seleccionar la opción para exportar las cookies:

```
Export cookies
```

Esto generará un archivo:

```
cookies.txt
```

![Cookies 2.](./public/img/Cookies2.png)


## Paso 3

Mover el archivo generado dentro de la carpeta:

```
src/
```

La estructura final debe quedar así:

```
SoftwareFreeMp3
│
├── src
│   │
│   ├── server.js
│   ├── cookies.txt
│   └── bin
│       └── yt-dlp.exe
│
├── node_modules
│
├── package.json
└── README.md
```

---

# 4. Iniciar el servidor

Una vez completada la configuración ejecutar:

```bash
node src/server.js
```

Si todo funciona correctamente aparecerá un mensaje similar:

```
Ruta de yt-dlp.exe:
C:\laragon\www\SoftwareFreeMp3\src\bin\yt-dlp.exe

Ruta de ffmpeg.exe:
C:\laragon\www\SoftwareFreeMp3\node_modules\ffmpeg-static\ffmpeg.exe

Ruta de cookies.txt:
C:\laragon\www\SoftwareFreeMp3\src\cookies.txt

Servidor corriendo en:
http://localhost:8080
```

---

# 5. Acceso a la aplicación

Abrir el navegador e ingresar:

```
http://localhost:8080
```

La aplicación estará disponible.

---

# Solución de problemas

## Node.js no reconocido

Si aparece:

```
node is not recognized as an internal or external command
```

Reinstalar Node.js y verificar que durante la instalación esté activada la opción:

```
Add to PATH
```

---

## Error con YouTube o yt-dlp

Si aparece un error relacionado con la extracción del video:

- Comprobar que el archivo `cookies.txt` existe.
- Verificar que la cuenta de YouTube siga iniciada.
- Actualizar yt-dlp a la última versión.

---

## Error con FFmpeg

Comprobar que las dependencias estén instaladas correctamente:

```bash
npm install
```

---

# Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| Node.js | Entorno de ejecución |
| Express | Servidor web |
| yt-dlp | Descarga multimedia |
| FFmpeg | Procesamiento de audio y video |
| npm | Gestión de dependencias |

---

# Estructura minimo y obligatoria del proyecto

```
src/
│
├── bin/
│   └── yt-dlp.exe
│
├── cookies.txt
├── server.js
└── ...
```

---

# Autor Jean-Pierre001