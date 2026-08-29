# Wapp

API en Node.js para automatizar mensajeria de WhatsApp, con integracion a `waapi.app`, `n8n` y Google Sheets.

## Que hace

- Envía mensajes individuales o masivos por WhatsApp.
- Recibe webhooks de mensajes entrantes.
- Deriva mensajes a `n8n` segun horario, tipo de mensaje y contenido.
- Lee credenciales y estados desde Google Sheets.
- Responde con mensajes automáticos fuera de horario.
- Permite actualizar archivos de configuracion desde la API.

## Requisitos

- Node.js 18 o superior.
- Una cuenta/instancia de `waapi.app`.
- Un proyecto de Google Cloud con Service Account y acceso a Google Sheets.
- Un flujo en `n8n` para recibir los payloads enviados por este backend.

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm run dev
```

Por defecto levanta en `http://localhost:3003`.

## Variables de entorno

Configurar en `.env` las variables requeridas por la app. Las claves cubren:

- Puerto y entorno.
- Credenciales de `waapi.app`.
- URL de `n8n` y API interna.
- Datos de Google Sheets y Service Account.
- Valores usados por el programador de tareas.

## Archivos de apoyo

- `config.txt`: configuracion de mensajes y fecha especial.
- `numeros.txt`: lista de numeros excluidos.
- `src/horario.txt`: texto usado por el programador de tareas.

## Endpoints principales

- `GET /wapp`: health check.
- `POST /wapp/send/`: envio masivo a todos por canal.
- `POST /wapp/sendacti/`: envio masivo a activos por canal.
- `POST /wapp/sendinac/`: envio masivo a inactivos por canal.
- `POST /wapp/send-messages`: envio personalizado por destinatario.
- `POST /wapp/pedir-cuenta`: busca cuenta/clave en Google Sheets y las envia por WhatsApp.
- `POST /wapp/receipt`: webhook principal de entrada desde waapi.
- `POST /wapp/recibon8n`: recibe datos desde n8n y envia mensaje por WhatsApp.
- `POST /wapp/recibon8ntest`: modo de prueba para n8n.
- `POST /wapp/send-mail`: envio de correo.
- `GET /wapp/archivo` y `POST /wapp/archivo`: leer/guardar `config.txt`.
- `GET /wapp/numeros`: leer `numeros.txt`.

## Flujo general

1. El backend recibe mensajes desde `waapi.app`.
2. Filtra duplicados, silencios temporales y numeros excluidos.
3. Si el mensaje pide usuario/clave o llega fuera de horario, se reenvia a `n8n`.
4. Si corresponde, responde automaticamente al usuario por WhatsApp.
5. Tambien puede consultar Google Sheets para encontrar datos de acceso.

## Estructura

- `index.js`: servidor principal y endpoints.
- `src/programador.js`: tareas programadas y envios masivos.
- `src/mensaje.js`: helper de envio.
- `googleClient.js`: cliente de Google Sheets.

## Nota

La logica principal vive en `index.js`; los endpoints expuestos estan pensados para integrarse con `waapi.app`, `n8n` y Google Sheets.
