const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const morgan = require('morgan');
const axios = require("axios");
require("dotenv").config();

const n8nurl = process.env.N8NURL;

// =========================
// DAYJS Y ZONA HORARIA
// =========================

const dayjs = require("dayjs");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isBetween = require("dayjs/plugin/isBetween");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const TZ = "America/Argentina/Buenos_Aires";


const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});
// app.use(cors()); // uso de cors definido anteriormente
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(express.json());

morgan.token("id", (req) => req.id);
app.use(morgan(function (tokens, req, res) {
  return JSON.stringify({
    requestId: tokens.id(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res), 10),
    responseTime: `${tokens["response-time"](req, res)} ms`,
    fecha: new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires"
    }).split("T")[0],
    hora: new Date().toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour12: false
    })
  });
}));

const PORT = process.env.PORT || 3003;

// ======================
// leer configuración
// ======================

const fs = require("fs");

// =========================
// LEER CONFIGURACION
// =========================

function leerConfiguracion() {

  const contenido =
    fs.readFileSync("config.txt", "utf-8")
      .split("\n");

  const fechaEspecial =
    contenido[0].trim();

  const mensajeExtra =
    contenido.slice(2)
      .join("\n")
      .trim();

  return {
    fechaEspecial,
    mensajeExtra
  };

}

// =========================
// OBTENER NÚMEROS DESDE ARCHIVO
// =========================

function obtenerNumerosDesdeArchivo(rutaArchivo) {

  try {

    const data =
      fs.readFileSync(rutaArchivo, "utf8");

    return data
      .split("\n")
      .map(n => n.trim())
      .filter(n => n.length > 0);

  }
  catch (err) {

    console.error(
      "Error al leer archivo:",
      err
    );

    return [];

  }

}

// ======================
// dentro del horario
// ======================

function estaDentroDelHorario() {

  const ahora =
    dayjs().tz(TZ);

  const diaSemana =
    ahora.day();

  let bloques = [];

  if ([1, 3, 5].includes(diaSemana)) {

    bloques = [

      { inicio: "09:30", fin: "13:00" },

      { inicio: "16:30", fin: "20:00" }

    ];

  }

  else if ([2, 4].includes(diaSemana)) {

    bloques = [

      { inicio: "09:30", fin: "13:00" },

      { inicio: "16:30", fin: "20:00" }

    ];

  }

  else {

    return false;

  }

  return bloques.some(({ inicio, fin }) => {

    const inicioHora =
      dayjs(
        `${ahora.format("YYYY-MM-DD")} ${inicio}`,
        "YYYY-MM-DD HH:mm"
      ).tz(TZ);

    const finHora =
      dayjs(
        `${ahora.format("YYYY-MM-DD")} ${fin}`,
        "YYYY-MM-DD HH:mm"
      ).tz(TZ);

    return ahora.isAfter(inicioHora)
      && ahora.isBefore(finHora);

  });

}

// ======================
// Funciones para procesar recibo de mensajes
// ======================

async function procesarMensaje(msg) {
  try {

    const chatId = msg.from;
    const messageId = msg.id._serialized;

    // =========================
    // 🔁 DEDUPLICACIÓN
    // =========================

    if (messageId) {

      if (processedMessages.has(messageId)) {
        console.log("Mensaje duplicado ignorado:", messageId);
        return;
      }

      processedMessages.add(messageId);

      setTimeout(() => {
        processedMessages.delete(messageId);
      }, 60000);
    }

    // =========================
    // 🔕 MODO SILENCIO
    // =========================

    if (mutedUsers.has(chatId)) {

      const expire = mutedUsers.get(chatId);

      if (Date.now() < expire) {
        console.log("Bot silenciado para:", chatId);
        return;
      }

      mutedUsers.delete(chatId);

    }

    if (msg.body && msg.body.toLowerCase().startsWith("nb")) {

      const partes = msg.body.split(" ");
      const minutos = parseInt(partes[1]) || 60;

      mutedUsers.set(chatId, Date.now() + minutos * 60000);

      console.log(`Bot silenciado ${minutos} minutos para`, chatId);

      return;

    }

    if (msg.body && msg.body.toLowerCase() === "bot") {

      mutedUsers.delete(chatId);

      console.log("Bot reactivado para", chatId);

    }

    // =========================
    // FILTROS
    // =========================

    if (
      msg.from === "5492342513085@c.us" ||
      msg.from === "status@broadcast" ||
      msg.from.includes("@g.us")
    ) {
      return;
    }

    if (
      !msg.body &&
      msg.type !== "image" &&
      msg.type !== "ptt" &&
      msg.type !== "audio"
    ) {
      console.log("Evento ignorado");
      return;
    }

    // =========================
    // CONFIGURACIÓN
    // =========================

    const hoy = dayjs().tz(TZ).format("DD/MM");

    const { fechaEspecial, mensajeExtra } =
      leerConfiguracion();

    const excludedPhones =
      obtenerNumerosDesdeArchivo("numeros.txt");

    console.log(
      "Hoy:", hoy,
      "Especial:", fechaEspecial,
      "Horario:", estaDentroDelHorario(),
      "De:", msg.from
    );

    // =========================
    // FUERA DE HORARIO
    // =========================

    if (
      (hoy === fechaEspecial ||
        !estaDentroDelHorario())
    ) {

      if (excludedPhones.includes(msg.from)) {
        return;
      }

      const remitente =
        msg.from.replace("@c.us", "");

      let imageBase64 = null;
      let audioBase64 = null;

      if (msg.hasMedia) {

        const media =
          await msg.downloadMedia();

        if (msg.type === "image") {
          imageBase64 = media.data;
        }

        if (
          msg.type === "audio" ||
          msg.type === "ptt"
        ) {
          audioBase64 = media.data;
        }

      }

      const payload = {

        from: remitente,

        text: msg.body || null,

        pushName:
          msg._data?.notifyName ||
          "Cliente",

        tipo: msg.type,

        imagen: imageBase64,

        audio: audioBase64

      };

      console.log(
        "Payload enviado a n8n:",
        payload
      );

      await axios.post(
        n8nurl,
        payload
      );

    }

    // =========================
    // RESPUESTA A AUDIOS
    // =========================

    else {

      if (
        msg.type === "audio" ||
        msg.type === "ptt"
      ) {

        if (
          excludedPhones.includes(
            msg.from
          )
        ) {
          return;
        }

        await msg.reply(
          "🤖🎙️ Me encantaría escucharte, pero por ahora soy mejor leyendo que oyendo.\n¿Podrías escribirme tu consulta? ✍️"
        );

        console.log(
          "Audio respondido"
        );

      }

    }

  }
  catch (error) {

    console.error(
      "Error procesando mensaje:",
      error.message
    );

  }
}


// ======================
// WHATSAPP
// ======================

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "principal"
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  }
});

// =========================
// VARIABLES GLOBALES
// =========================

// deduplicación de mensajes
const processedMessages = new Set();

// usuarios silenciados temporalmente
const mutedUsers = new Map();


// QR

client.on("qr", (qr) => {
  console.log("Escaneá este QR:");
  qrcode.generate(qr, { small: true });
});

// READY

client.on("ready", () => {
  console.log("WhatsApp conectado");
});

// Receipt MESSAGE

client.on("message", async (msg) => {
  await procesarMensaje(msg);
});

// DISCONNECTED

client.on("disconnected", (reason) => {
  console.log("Desconectado:", reason);
  client.initialize();
});

let isClientReady = false;

client.on("ready", () => {
  console.log("WhatsApp conectado");
  isClientReady = true;
});

client.on("disconnected", (reason) => {
  console.log("WhatsApp desconectado:", reason);
  isClientReady = false;
});

app.get("/wapp/status", (req, res) => {

  res.json({
    conectado: isClientReady,
    fecha: new Date(),
    numero: client.info?.wid?.user || null
  });

});

// ======================
// ENDPOINT TEST
// ======================

app.get("/wapp", (req, res) => {
  res.send("Servidor WhatsApp activo");
});

// ======================
// ENDPOINT PARA ENVIAR MENSAJE
// ======================

app.post("/wapp/send-message", async (req, res) => {
  try {

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    const chatId = to.includes("@c.us")
      ? to
      : `${to}@c.us`;

    await client.sendMessage(chatId, message);

    res.json({
      status: "ok"
    });

  } catch (error) {

    console.error("Error enviando mensaje:", error.message);

    res.status(500).json({
      error: error.message
    });

  }
});

// ======================
// START SERVER Y WHATSAPP
// ======================

// =========================
// RECIBIR DESDE N8N Y ENVIAR MENSAJE
// =========================

app.post("/wapp/recibon8n", async (req, res) => {

  const { destinatario, mensaje, aviso } = req.body;

  console.log(
    "Recibo desde n8n:",
    destinatario,
    mensaje
  );

  try {

    if (!destinatario || !mensaje) {

      return res.status(400).json({
        error: "Faltan datos"
      });

    }

    let enviarA;

    if (destinatario.includes("@lid")) {

      enviarA = destinatario;

    }
    else if (destinatario.includes("@c.us")) {

      enviarA = destinatario;

    }
    else {

      enviarA = `${destinatario}@c.us`;

    }

    // =========================
    // ENVIAR MENSAJE
    // =========================

    await client.sendMessage(
      enviarA,
      mensaje
    );

    console.log(
      "Mensaje respondido por ChatBot"
    );

    // =========================
    // MARCAR COMO NO LEIDO
    // =========================

    if (aviso && aviso === "avisado") {

      console.log(
        "No marco como no leído porque ya se avisó"
      );

      return res.status(200).json({
        message:
          "Recibido en backend, no marco como no leído"
      });

    }

    try {

      const chat =
        await client.getChatById(
          enviarA
        );

      await chat.markUnread();

      console.log(
        "Chat marcado como no leído"
      );

    }
    catch (err) {

      console.log(
        "No se pudo marcar como no leído:",
        err.message
      );

    }

    return res.status(200).json({
      message: "Recibido en backend"
    });

  }
  catch (error) {

    console.log(
      "Error en recibon8n:",
      error.message
    );

    return res.status(400).json({
      error: error.message
    });

  }

});

// const fs = require('fs');
const path = require('path');

const archivoPath = path.join(__dirname, 'config.txt');

// GET: Leer archivo

app.get('/wapp/archivo', (req, res) => {

  fs.readFile(archivoPath, 'utf8', (err, data) => {

    if (err) {

      console.error(
        'Error al leer el archivo:',
        err,
        archivoPath
      );

      return res
        .status(500)
        .send('Error al leer el archivo');

    }

    res.send(data);

  });

});

// POST: Guardar nuevo contenido

app.post('/wapp/archivo', (req, res) => {

  const { contenido } = req.body;

  if (typeof contenido !== 'string') {

    return res
      .status(400)
      .send('Contenido inválido');

  }

  fs.writeFile(
    archivoPath,
    contenido,
    'utf8',
    (err) => {

      if (err) {

        console.error(
          'Error al guardar el archivo:',
          err,
          archivoPath
        );

        return res
          .status(500)
          .send('Error al guardar el archivo');

      }

      res.send(
        'Archivo guardado correctamente'
      );

    }

  );

});

app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});

client.initialize();