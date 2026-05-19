// reminder's scheduler
const { programador_tareas, envio_anuncio_all, envio_anuncio_active, envio_anuncio_inactive } = require('./src/programador.js');
const { Router } = require('express');
const express = require('express');
const morgan = require('morgan');
// const nodemailer = require('nodemailer')
require('dotenv').config();
const autor = process.env.AUTOR
const idinsta = process.env.INSTANCE
// const qrcode = require('qrcode-terminal');
const QRcode = require('qrcode');
const axios = require('axios');
const n8nurl = process.env.N8NURL
const waapiKey = process.env.WKEY


const crypto = require("crypto");

const sheets = require('./googleClient.js');

const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;
const environment = process.env.NODE_ENV || 'development';

// variables para obtener ruta actual
const fs = require('fs')/* .promises */;
const path = require('path');

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isBetween = require("dayjs/plugin/isBetween");
const NodeCache = require("node-cache");
const e = require('express');
const { env, send } = require('process');
const { devNull } = require('os');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

// const cors = require('cors');
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
app.use(express.json({ limit: "50mb" }));
morgan.token("id", (req) => req.id);
app.use(morgan(function (tokens, req, res) {
  return JSON.stringify({
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
    }),
    remoteAddr: tokens["remote-addr"](req, res),
    remoteUserAgent: tokens["user-agent"](req, res),
    requestId: tokens.id(req, res),
  });
}));

// Reemplaza CONTACTO en programador.js por tu número de celular
// Define a JavaScript function called lastday with parameters y (year) and m (month)
var lastday = function (y, m) {
  // Create a new Date object representing the last day of the specified month
  // By passing m + 1 as the month parameter and 0 as the day parameter, it represents the last day of the specified month
  return new Date(y, m + 1, 0).getDate();
}

const february = () => {
  var datetime = new Date();
  var diadeaviso = datetime.toISOString().slice(8, 10) < 10 ? datetime.toISOString().slice(9, 10) : datetime.toISOString().slice(8, 10)
  var venci = datetime.toISOString().slice(2, 4) + datetime.toISOString().slice(5, 7)
  var seavisa
  if (datetime.getMonth() === 1) {
    var ultimodia = lastday(2025, 1)
    if (ultimodia === 28) {
      seavisa = parseInt(diadeaviso) + 3
    } else if (ultimodia === 29) {
      seavisa = parseInt(diadeaviso) + 2
    }
  }
  diadeaviso = seavisa
  console.log(diadeaviso, seavisa)
}

// Función que verifica si estamos dentro del horario de atención
/* function estaDentroDelHorario() {
  const ahora = new Date();
  const horaArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));

  const dia = horaArgentina.getDay(); // 0 (domingo) a 6 (sábado)
  const hora = horaArgentina.getHours();
  const minutos = horaArgentina.getMinutes();

  if (dia === 0 || dia === 6) return false; // Sábado o Domingo

  const minutosTotales = hora * 60 + minutos;

  const inicioManana = 9 * 60 + 30;   // 9:30
  const finManana = 12 * 60 + 30;     // 12:30
  const inicioTarde = 16 * 60 + 30;   // 16:30
  const finTarde = 19 * 60 + 30;      // 19:30

  return (minutosTotales >= inicioManana && minutosTotales <= finManana) ||
    (minutosTotales >= inicioTarde && minutosTotales <= finTarde);
} */

// Función que verifica si estamos dentro del horario de atención

const cache = new NodeCache(); // Cache por IP o ID, expira en 4h

const TZ = "America/Argentina/Buenos_Aires";

/* const HORARIOS = {
  lunes: [
    { inicio: "09:30", fin: "12:30" },
    { inicio: "16:30", fin: "19:30" },
  ],
  martes: [
    { inicio: "09:30", fin: "12:30" },
    { inicio: "16:30", fin: "19:30" },
  ],
  miércoles: [
    { inicio: "09:30", fin: "12:30" },
    { inicio: "16:30", fin: "19:30" },
  ],
  jueves: [
    { inicio: "09:30", fin: "12:30" },
    { inicio: "16:30", fin: "19:30" },
  ],
  viernes: [
    { inicio: "09:30", fin: "12:30" },
    { inicio: "16:30", fin: "19:30" },
  ],
}; */

/* function estaDentroDelHorario() {
  const ahora = dayjs().tz(TZ);
  const diaSemana = ahora.format("dddd").toLowerCase();

  const bloques = HORARIOS[diaSemana];
  if (!bloques) return false;

  console.log("A ver", bloques)

  return bloques.some(({ inicio, fin }) => {
    const inicioHora = dayjs(ahora.format("YYYY-MM-DD") + " " + inicio, "YYYY-MM-DD HH:mm");
    const finHora = dayjs(ahora.format("YYYY-MM-DD") + " " + fin, "YYYY-MM-DD HH:mm");
    return ahora.isBetween(inicioHora, finHora);
  });
} */

function estaDentroDelHorario() {
  const ahora = dayjs().tz(TZ);
  const diaSemana = ahora.day(); // 0 (domingo) a 6 (sábado)

  // Mapear días a bloques de horario
  let bloques = [];
  if ([1, 3, 5].includes(diaSemana)) { // lunes, miércoles, viernes
    bloques = [
      { inicio: "09:30", fin: "13:00" },
      { inicio: "16:30", fin: "20:00" },
    ];
  } else if ([2, 4].includes(diaSemana)) { // martes, jueves
    bloques = [
      { inicio: "09:30", fin: "13:00" },
      { inicio: "16:30", fin: "20:00" },
    ];
  } else {
    return false; // Sábado y domingo cerrado
  }

  // Verificar si el horario actual está dentro de alguno de los bloques
  return bloques.some(({ inicio, fin }) => {
    const inicioHora = dayjs(`${ahora.format("YYYY-MM-DD")} ${inicio}`, "YYYY-MM-DD HH:mm").tz(TZ);
    const finHora = dayjs(`${ahora.format("YYYY-MM-DD")} ${fin}`, "YYYY-MM-DD HH:mm").tz(TZ);
    return ahora.isAfter(inicioHora) && ahora.isBefore(finHora);
  });
}

try {

  // clear console
  console.clear()

  //   february() 
  // Listening for the server
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));

  //mensaje a todos segun canal
  app.post('/wapp/send/', async (req, res) => {
    const { message, canal } = req.body

    //generando envios masivo
    try {
      await envio_anuncio_all(client, message, canal);
      return res.sendStatus(200).send("Enviando mensajes")
    } catch (er) {
      return res.sendStatus(400).send("No se pudo inciar masivo")
    }
  })

  //mensaje a todos los activos segun canal

  app.post('/wapp/sendacti/', async (req, res) => {
    const { message, canal } = req.body

    //generando envios masivo
    try {
      await envio_anuncio_active(client, message, canal);
      return res.sendStatus(200).send("Enviando mensajes")
    } catch (er) {
      return res.sendStatus(400).send("No se pudo inciar masivo")
    }
  })

  //mensaje a todos inactivos segun canal

  app.post('/wapp/sendinac/', async (req, res) => {
    const { message, canal } = req.body

    //generando envios masivo
    try {
      await envio_anuncio_inactive(client, message, canal);
      return res.sendStatus(200).send("Enviando mensajes")
    } catch (er) {
      return res.sendStatus(400).send("No se pudo inciar masivo")
    }
  })


  // realizar envio de mensaje masivo a través de la API

  // Función simulada para enviar SMS (reemplazar con API real)
  const sendSMS = async (number, message) => {

    const params = {
      chatId: number + '@c.us', // Asegúrate de que el número esté en el formato correcto
      message
    }
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: autor
      },
      body: JSON.stringify(params)
    };
    await fetch('https://waapi.app/api/v1/instances/' + idinsta + '/client/action/send-message', options)
      .then(response => response.json())
      .then(response => {
        console.log(response)
        console.log('Mensaje enviado final');
      })
      .catch(err => {
        console.error(err)
        console.log('Mensaje NO enviado');
      });

    console.log(`📤 Enviando mensaje a ${number}: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulación
  };

  // Función para reemplazar {{nombre}} en el mensaje
  const personalizeMessage = (template, name) => {
    return template.replace(/{{\s*nombre\s*}}/gi, name);
  };

  app.post('/wapp/send-messages', async (req, res) => {
    const { recipients, message } = req.body;
    /*
    Ejemplo de cuerpo de solicitud:
    {
      "recipients": [
        { "number": "+5491123456789", "name": "Juan" },
        { "number": "+5491123456790", "name": "Ana" }
      ],
      "message": "Hola {{nombre}}, este es un mensaje personalizado."
    } 
    */

    if (!Array.isArray(recipients) || recipients.length === 0 || typeof message !== 'string') {
      return res.status(400).json({ error: 'Se requiere un array de destinatarios y un mensaje válido.' });
    }

    // Responder de inmediato para no bloquear al cliente
    res.json({ status: 'Envío iniciado', total: recipients.length });

    (async () => {
      for (let i = 0; i < recipients.length; i++) {
        const { number, name } = recipients[i];
        const personalizedMessage = personalizeMessage(message, name || 'Usuario');

        try {
          await sendSMS(number, personalizedMessage);
        } catch (err) {
          console.error(`❌ Error al enviar a ${number}:`, err);
        }

        // Esperar 1 segundo entre envíos
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Pausa de 60 segundos cada 10 envíos
        if ((i + 1) % 10 === 0 && i !== recipients.length - 1) {
          console.log('⏸️ Pausa de 60 segundos después de 10 envíos...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }

      console.log('✅ Todos los mensajes han sido enviados.');
    })();
  });

  app.post('/wapp/pedir-cuenta', async (req, res) => {
    const numero = (req.body.numero || '').trim();
    const instanceId = req.body.insId || idinsta;

    if (!numero) {
      return res.status(400).json({ message: 'Número no proporcionado', error: 'Número no proporcionado' });
    }

    if (environment === 'production') {
      const captchaToken = req.body.captchaToken;
      if (!captchaToken) {
        return res.status(400).json({ error: 'Captcha no enviado' });
      }
    }

    /*     // Verificar con Google
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const secret = process.env.RECAPTCHA_SECRET_KEY;
    
        const verifyRes = await axios.post(
          verifyUrl,
          null,
          {
            params: {
              secret,
              response: captchaToken,
            },
          }
        );
    
        if (!verifyRes.data.success) {
          return res.status(403).json({ error: 'Captcha inválido' });
        } */

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!D4:M`, // D = cuenta, E = clave, H = contacto
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'No se encontraron datos', error: 'No se encontraron datos' });
      }

      const cuentaIndex = 0; // columna D
      const claveIndex = 1;  // columna E
      const activoIndex = 2; // columna F
      const contactoIndex = 4; // columna H (índice relativo en rango D:H)
      const contactoIndex2 = 9 // columna M (índice relativo en rango D:M)
      const vencimientoIndex = 5; // columna I

      const normalizar = str => str.replace(/\D/g, '').replace(/^54/, '');
      const numeroNormalizado = normalizar(numero);

      const coincidencias1 = rows.filter(row => {
        const contacto = normalizar(row[contactoIndex] || '');
        if (row[activoIndex] === "f") return contacto === numeroNormalizado;
      });

      const coincidencias2 = rows.filter(row => {
        const contacto = normalizar(row[contactoIndex2] || '');
        if (row[activoIndex] === "f") return contacto === numeroNormalizado;
      });

      const coincidencias = [...coincidencias1, ...coincidencias2];

      if (coincidencias.length === 0) {
        return res.status(404).json({ message: 'Número no encontrado', error: 'Número no encontrado' });
      }

      const resultados = coincidencias.map(row => ({
        cuenta: row[cuentaIndex],
        clave: row[claveIndex],
      }));
      const recipient = numero.startsWith("5") ? numero + "@c.us" : "549" + numero + "@c.us"
      const aenviar = recipient.replaceAll(" ", "").replaceAll("-", "").replaceAll("(", "").replaceAll(")", "")
      const ctamplay = JSON.stringify(resultados).replaceAll("cuenta", "📧").replaceAll("clave", "🔒").replaceAll('{', "").replaceAll('}', "").replaceAll('"', "").replaceAll(',', " | ").replaceAll(':', " ").replaceAll('-', "\n\n")
      const params = {
        chatId: aenviar, // data.message.from,
        message: "Te paso usuario y clave: \n\n" + ctamplay + "\n\nMuchas gracias", //mensajeAusencia,
        // replyToMessageId: data.message.id._serialized // objRecibe.serial
      }
      console.log(params.chatId)

      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: autor
        },
        body: JSON.stringify(params)
      };
      console.log(params.message)

      await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/send-message', options)
        .then(response => response.json())
        .then(response => {
          console.log(response)
          console.log('Cuenta enviada respondido');
        })
        .catch(err => {
          console.error(err)
          console.log('Mensaje NO enviado');
        });


      return res.json({ message: "se enviara la cuenta al celu correspondiente", resultados });

    } catch (error) {
      console.error('Error al acceder a la planilla:', error);
      return res.status(500).json({ error: 'Error al acceder a la planilla' });
    }
  });


  app.get("/wapp/qr/:idinsta", async (req, res) => {
    const { idinsta } = req.params
    qrimage = "qr-image-" + idinsta.toString() + ".png"
    // res.sendFile(qrimage)
    // res.setHeader('content-type', 'image/png');
    // res.send("<h1>Qr de instancia</h1><br /><br /><img src='14852-qr-image.png' height='260' width='260' alt='QR image' />")
    res.sendFile('/root/projects/wapp/' + qrimage);
    // res.status(200)
  })

  let mensajeAusencia = '👋Hola! soy 🤖 *BOT-In*: _Tu asistente virtual_\n\n'
  let textoarchivo = ''

  // funciones para convertir a audio comun y reproducible, no implementada aún

  // HKDF helper
  function hkdf(mediaKey, length, info) {
    const salt = Buffer.alloc(32, 0);

    const derived = crypto.hkdfSync(
      "sha256",
      mediaKey,
      salt,
      Buffer.from(info),
      length
    );

    // 👇 ESTA ES LA CLAVE
    return Buffer.from(derived);
  }

  async function decryptWhatsAppAudio(mmsUrl, mediaKeyBase64) {
    // 1️⃣ Descargar .enc
    const response = await axios.get(mmsUrl, {
      responseType: "arraybuffer",
    });

    // const encrypted = Buffer.from(response.data);
    const encrypted = Buffer.from(new Uint8Array(response.data));

    // 2️⃣ Separar data y mac
    const file = encrypted.slice(0, -10);
    const mac = encrypted.slice(-10);

    // 3️⃣ Derivar claves
    const mediaKey = Buffer.from(mediaKeyBase64, "base64");
    const expandedKey = hkdf(mediaKey, 112, "WhatsApp Audio Keys");

    const iv = expandedKey.slice(0, 16);
    const cipherKey = expandedKey.slice(16, 48);
    const macKey = expandedKey.slice(48, 80);

    // 4️⃣ Validar MAC
    const hmac = crypto.createHmac("sha256", macKey);
    hmac.update(Buffer.concat([iv, file]));
    const computedMac = hmac.digest().slice(0, 10);

    if (!computedMac.equals(mac)) {
      throw new Error("MAC inválido");
    }

    // 5️⃣ Descifrar
    const decipher = crypto.createDecipheriv("aes-256-cbc", cipherKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(file),
      decipher.final(),
    ]);

    return decrypted; // buffer .ogg real
  }

  // fin funciones para convertir a audio comun y reproducible, no implementada aún

  const processedMessages = new Set(); // para deduplicar mensajes entrantes, guardo IDs de mensajes procesados recientemente (1 minuto)

  const mutedUsersNO2 = new Map(); // Map para almacenar usuarios silenciados temporalmente (clave: número, valor: timestamp de expiración)

  // Endpoint /wapp/receipt con mejoras:
  // - Envío automático a n8n si pide usuario/clave dentro de horario
  // - Uso de config.txt para fechas especiales y mensaje dinámico
  // - Mantiene lógica existente (mute, deduplicación, audios, etc.)

  // Endpoint /wapp/receipt con mejoras:
  // - Envío automático a n8n si pide usuario/clave dentro de horario
  // - Uso de config.txt para fechas especiales y mensaje dinámico
  // - Mantiene lógica existente (mute, deduplicación, audios, etc.)

  // Registro del último mensaje fuera de horario por usuario

  // Endpoint /wapp/receipt con mejoras:
  // - Envío automático a n8n si pide usuario/clave dentro de horario
  // - Uso de config.txt para fechas especiales y mensaje dinámico
  // - Mantiene lógica existente (mute, deduplicación, audios, etc.)

  // Registro del último mensaje fuera de horario por usuario
  const ultimoMensajeFueraHorarioNO2 = new Map();

  app.post('/wapp/receiptNO2', async (req, res) => {
    try {
      const { event, instanceId, data } = req.body;

      if (!event || !instanceId || !data) {
        console.error('Error en /wapp/receipt: falta información', new Date().toLocaleString());
        return res.sendStatus(200);
      }

      const msg = data?.message;

      if (!msg) {
        console.error('Error en /wapp/receipt: no se encontró el mensaje', new Date().toLocaleString());
        return res.sendStatus(200);
      }

      const chatId = msg.from;
      const messageId = msg?.id?._serialized;

      // =========================
      // DEDUPLICACIÓN
      // =========================

      if (messageId) {
        if (processedMessages.has(messageId)) {
          console.log("Mensaje duplicado ignorado:", messageId);
          return res.sendStatus(200);
        }

        processedMessages.add(messageId);

        setTimeout(() => {
          processedMessages.delete(messageId);
        }, 60000);
      }

      // =========================
      // MODO SILENCIO DEL BOT
      // =========================

      if (mutedUsers.has(chatId)) {
        const expire = mutedUsers.get(chatId);

        if (Date.now() < expire) {
          console.log("Bot silenciado para:", chatId);
          return res.sendStatus(200);
        } else {
          mutedUsers.delete(chatId);
        }
      }

      if (msg.body && msg.body.toLowerCase().startsWith("nb")) {

        const partes = msg.body.split(" ");
        const minutos = parseInt(partes[1]) || 60;

        mutedUsers.set(chatId, Date.now() + minutos * 60000);

        console.log(`Bot silenciado ${minutos} minutos para`, chatId);

        return res.sendStatus(200);
      }

      if (msg.body && msg.body.toLowerCase() === "bot") {
        mutedUsers.delete(chatId);
        console.log("Bot reactivado para", chatId);
      }

      // =========================
      // FILTROS BÁSICOS
      // =========================

      if (
        msg.from === "5492342513085@c.us" ||
        msg.from === "status@broadcast" ||
        msg.from.includes("@g.us")
      ) {
        return res.sendStatus(200);
      }

      if (event !== "message") {
        return res.sendStatus(200);
      }

      if (!msg.body && msg.type !== "image" && msg.type !== "ptt" && msg.type !== "audio") {
        return res.sendStatus(200);
      }

      // =========================
      // CONFIGURACIÓN
      // =========================

      const hoy = dayjs().tz(TZ).format("DD/MM");

      function leerConfiguracion() {
        const contenido = fs.readFileSync("config.txt", "utf-8").split("\n");

        const fechaEspecial = contenido[0].trim();
        const mensajeExtra = contenido.slice(2).join("\n").trim();

        return { fechaEspecial, mensajeExtra };
      }

      const { fechaEspecial, mensajeExtra } = leerConfiguracion();

      function obtenerNumerosDesdeArchivo(rutaArchivo) {
        try {
          const data = fs.readFileSync(rutaArchivo, 'utf8');
          return data
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);
        } catch (err) {
          console.error('Error al leer el archivo:', err);
          return [];
        }
      }

      const excludedPhones = obtenerNumerosDesdeArchivo('numeros.txt');

      // =========================
      // FUNCIÓN HORARIO (dos turnos: mañana y tarde)
      // =========================

      function estaDentroDelHorario() {

        const ahora = dayjs().tz(TZ);

        const horaActual = ahora.format("HH:mm");

        // Turno mañana
        const inicioManana = "09:30";
        const finManana = "13:00";

        // Turno tarde
        const inicioTarde = "16:30";
        const finTarde = "20:00";

        const dentroManana = horaActual >= inicioManana && horaActual <= finManana;
        const dentroTarde = horaActual >= inicioTarde && horaActual <= finTarde;

        return dentroManana || dentroTarde;

      }

      // =========================
      // HORARIO
      // =========================

      const fueraDeHorario =
        hoy === fechaEspecial ||
        !estaDentroDelHorario();

      const dentroDeHorario = !fueraDeHorario;

      // =========================
      // MENSAJE FUERA DE HORARIO CADA 4 HORAS
      // (solo si el usuario vuelve a escribir)
      // =========================

      if (fueraDeHorario) {

        const ahora = Date.now();
        const ultimoEnvio = ultimoMensajeFueraHorario.get(msg.from);
        const cuatroHoras = 4 * 60 * 60 * 1000;

        if (!ultimoEnvio || (ahora - ultimoEnvio) >= cuatroHoras) {

          ultimoMensajeFueraHorario.set(msg.from, ahora);

          const mensaje = `
🗓️ Horario de Atención:
Lunes a viernes:
🕤 9,30 a 🕐 13,00
🕟 16,30 a 🕗 20,00
🚫 *Feriados, Sábados y domingos* cerrado

${mensajeExtra}

🤖 intentará ayudarte.
Antepone las iniciales nb a tu mensaje, para evitarlo unos momentos.
`;

          const params = {
            chatId: msg.from,
            message: mensaje
          };

          const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: autor
            },
            body: JSON.stringify(params)
          };

          await fetch(
            `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
            options
          );

          console.log("Mensaje fuera de horario enviado a:", msg.from);

        } else {

          console.log("Aún no pasaron 4 horas desde el último mensaje a", msg.from);

        }

      } else {

        // si vuelve el horario, limpiamos el registro
        if (ultimoMensajeFueraHorario.size > 0) {
          ultimoMensajeFueraHorario.clear();
          console.log("Horario abierto: registros de fuera de horario limpiados");
        }

      }

      // =========================
      // DETECCIÓN PEDIDO DE CLAVES
      // =========================

      const texto = (msg.body || "").toLowerCase();

      const pideCredenciales =
        texto.includes("usuario") ||
        texto.includes("clave") ||
        texto.includes("wifi") ||
        texto.includes("internet");

      if (dentroDeHorario && pideCredenciales) {

        if (excludedPhones.includes(msg.from)) {
          return res.sendStatus(200);
        }

        const remitente = msg.from.replace('@c.us', '');

        const payload = {
          from: remitente,
          text: msg.body,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          accion: "credenciales"
        };

        console.log('Solicitud de credenciales enviada a n8n');

        await axios.post(n8nurl, payload)
          .catch(error => {
            console.error('Error enviando a n8n:', error.message);
          });

        return res.sendStatus(200);
      }

      // =========================
      // ENVÍO A N8N POR AUDIO O FUERA DE HORARIO
      // =========================

      const esAudio =
        msg.type === 'ptt' ||
        msg.type === 'audio';

      if ((esAudio || fueraDeHorario) && msg.from !== '5492342513085@c.us') {

        if (excludedPhones.includes(msg.from)) {
          return res.sendStatus(200);
        }

        const remitente = msg.from.replace('@c.us', '');

        let imageBase64 = null;
        let audioBase64 = null;

        if (msg.type === 'image') {
          imageBase64 = msg._data?.body || null;
        }

        if (esAudio) {

          const audioBuffer = await decryptWhatsAppAudio(
            msg._data.deprecatedMms3Url,
            msg._data.mediaKey
          );

          audioBase64 = audioBuffer.toString("base64");
        }

        const payload = {
          from: remitente,
          text: msg.body || null,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          imagen: imageBase64 || null,
          audio: audioBase64 || null,
        };

        console.log('Payload enviado a n8n:', payload);

        await axios.post(n8nurl, payload)
          .catch(error => {
            console.error('Error enviando a n8n:', error.message);
          });

      } else {

        // =========================
        // RESPUESTA A AUDIOS
        // =========================

        if (esAudio) {

          if (!excludedPhones.includes(msg.from)) {

            const params = {
              chatId: msg.from,
              message: "🤖🎙️ Me encantaría escucharte, pero por ahora soy mejor leyendo que oyendo.\n¿Podrías escribirme tu consulta? ✍️"
            };

            const options = {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: autor
              },
              body: JSON.stringify(params)
            };

            await fetch(
              `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
              options
            );

            console.log("Audio respondido");
          }
        }
      }

      return res.sendStatus(200);

    } catch (error) {
      console.error('Error en /wapp/receipt:', error.message, new Date().toLocaleString());
      return res.sendStatus(200);
    }
  });

  // Nota: El control de las 4 horas ahora se realiza dentro del endpoint
  // únicamente cuando el usuario vuelve a escribir fuera de horario.

  const ultimoMensajeFueraHorarioNO = new Map();

  app.post('/wapp/receiptNO', async (req, res) => {
    try {
      const { event, instanceId, data } = req.body;

      if (!event || !instanceId || !data) {
        console.error('Error en /wapp/receipt: falta información', new Date().toLocaleString());
        return res.sendStatus(200);
      }

      const msg = data?.message;

      if (!msg) {
        console.error('Error en /wapp/receipt: no se encontró el mensaje', new Date().toLocaleString());
        return res.sendStatus(200);
      }

      const chatId = msg.from;
      const messageId = msg?.id?._serialized;

      // =========================
      // DEDUPLICACIÓN
      // =========================

      if (messageId) {
        if (processedMessages.has(messageId)) {
          console.log("Mensaje duplicado ignorado:", messageId);
          return res.sendStatus(200);
        }

        processedMessages.add(messageId);

        setTimeout(() => {
          processedMessages.delete(messageId);
        }, 60000);
      }

      // =========================
      // MODO SILENCIO DEL BOT
      // =========================

      if (mutedUsers.has(chatId)) {
        const expire = mutedUsers.get(chatId);

        if (Date.now() < expire) {
          console.log("Bot silenciado para:", chatId);
          return res.sendStatus(200);
        } else {
          mutedUsers.delete(chatId);
        }
      }

      if (msg.body && msg.body.toLowerCase().startsWith("nb")) {

        const partes = msg.body.split(" ");
        const minutos = parseInt(partes[1]) || 60;

        mutedUsers.set(chatId, Date.now() + minutos * 60000);

        console.log(`Bot silenciado ${minutos} minutos para`, chatId);

        return res.sendStatus(200);
      }

      if (msg.body && msg.body.toLowerCase() === "bot") {
        mutedUsers.delete(chatId);
        console.log("Bot reactivado para", chatId);
      }

      // =========================
      // FILTROS BÁSICOS
      // =========================

      if (
        msg.from === "5492342513085@c.us" ||
        msg.from === "status@broadcast" ||
        msg.from.includes("@g.us")
      ) {
        return res.sendStatus(200);
      }

      if (event !== "message") {
        return res.sendStatus(200);
      }

      if (!msg.body && msg.type !== "image" && msg.type !== "ptt" && msg.type !== "audio") {
        return res.sendStatus(200);
      }

      // =========================
      // CONFIGURACIÓN
      // =========================

      const hoy = dayjs().tz(TZ).format("DD/MM");

      function leerConfiguracion() {
        const contenido = fs.readFileSync("config.txt", "utf-8").split("\n");

        const fechaEspecial = contenido[0].trim();
        const mensajeExtra = contenido.slice(2).join("\n").trim();

        return { fechaEspecial, mensajeExtra };
      }

      const { fechaEspecial, mensajeExtra } = leerConfiguracion();

      function obtenerNumerosDesdeArchivo(rutaArchivo) {
        try {
          const data = fs.readFileSync(rutaArchivo, 'utf8');
          return data
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);
        } catch (err) {
          console.error('Error al leer el archivo:', err);
          return [];
        }
      }

      const excludedPhones = obtenerNumerosDesdeArchivo('numeros.txt');

      // =========================
      // HORARIO
      // =========================

      const fueraDeHorario =
        hoy === fechaEspecial ||
        !estaDentroDelHorario();

      const dentroDeHorario = !fueraDeHorario;

      // =========================
      // MENSAJE FUERA DE HORARIO CADA 4 HORAS
      // (solo si el usuario vuelve a escribir)
      // =========================

      if (fueraDeHorario) {

        const ahora = Date.now();
        const ultimoEnvio = ultimoMensajeFueraHorario.get(msg.from);
        const cuatroHoras = 4 * 60 * 60 * 1000;

        if (!ultimoEnvio || (ahora - ultimoEnvio) >= cuatroHoras) {

          ultimoMensajeFueraHorario.set(msg.from, ahora);

          const mensaje = `
🗓️ Horario de Atención:
Lunes a viernes:
🕤 9,30 a 🕐 13,00
🕟 16,30 a 🕗 20,00
🚫 Feriados, Sábados y domingos cerrado

${mensajeExtra}

🤖 intentará ayudarte.
Antepone las iniciales nb a tu mensaje, para evitarlo unos momentos.
`;

          const params = {
            chatId: msg.from,
            message: mensaje
          };

          const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: autor
            },
            body: JSON.stringify(params)
          };

          await fetch(
            `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
            options
          );

          console.log("Mensaje fuera de horario enviado a:", msg.from);

        } else {

          console.log("Aún no pasaron 4 horas desde el último mensaje a", msg.from);

        }

      } else {

        // si vuelve el horario, limpiamos el registro
        if (ultimoMensajeFueraHorario.size > 0) {
          ultimoMensajeFueraHorario.clear();
          console.log("Horario abierto: registros de fuera de horario limpiados");
        }

      }

      // =========================
      // DETECCIÓN PEDIDO DE CLAVES
      // =========================

      const texto = (msg.body || "").toLowerCase();

      const pideCredenciales =
        texto.includes("usuario") ||
        texto.includes("clave") ||
        texto.includes("contraseña") ||
        texto.includes("credencial");

      if (dentroDeHorario && pideCredenciales) {

        if (excludedPhones.includes(msg.from)) {
          return res.sendStatus(200);
        }

        const remitente = msg.from.replace('@c.us', '');

        const payload = {
          from: remitente,
          text: msg.body,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          accion: "credenciales"
        };

        console.log('Solicitud de credenciales enviada a n8n');

        await axios.post(n8nurl, payload)
          .catch(error => {
            console.error('Error enviando a n8n:', error.message);
          });

        return res.sendStatus(200);
      }

      // =========================
      // ENVÍO A N8N POR AUDIO O FUERA DE HORARIO
      // =========================

      const esAudio =
        msg.type === 'ptt' ||
        msg.type === 'audio';

      if ((esAudio || fueraDeHorario) && msg.from !== '5492342513085@c.us') {

        if (excludedPhones.includes(msg.from)) {
          return res.sendStatus(200);
        }

        const remitente = msg.from.replace('@c.us', '');

        let imageBase64 = null;
        let audioBase64 = null;

        if (msg.type === 'image') {
          imageBase64 = msg._data?.body || null;
        }

        if (esAudio) {

          const audioBuffer = await decryptWhatsAppAudio(
            msg._data.deprecatedMms3Url,
            msg._data.mediaKey
          );

          audioBase64 = audioBuffer.toString("base64");
        }

        const payload = {
          from: remitente,
          text: msg.body || null,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          imagen: imageBase64 || null,
          audio: audioBase64 || null,
        };

        console.log('Payload enviado a n8n:', payload);

        await axios.post(n8nurl, payload)
          .catch(error => {
            console.error('Error enviando a n8n:', error.message);
          });

      } else {

        // =========================
        // RESPUESTA A AUDIOS
        // =========================

        if (esAudio) {

          if (!excludedPhones.includes(msg.from)) {

            const params = {
              chatId: msg.from,
              message: "🤖🎙️ Me encantaría escucharte, pero por ahora soy mejor leyendo que oyendo.\n¿Podrías escribirme tu consulta? ✍️"
            };

            const options = {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: autor
              },
              body: JSON.stringify(params)
            };

            await fetch(
              `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
              options
            );

            console.log("Audio respondido");
          }
        }
      }

      return res.sendStatus(200);

    } catch (error) {
      console.error('Error en /wapp/receipt:', error.message, new Date().toLocaleString());
      return res.sendStatus(200);
    }
  });

  async function resolverNumero(chatId, instanceId) {

    // 👉 CASO NORMAL
    if (chatId.endsWith("@c.us")) {
      return chatId
        .replace("@c.us", "")
        .replace(/^549/, '')
        .replace(/^54/, '');
    }

    // 👉 CASO LID
    if (chatId.endsWith("@lid")) {

      try {

        const response = await fetch(
          `https://waapi.app/api/v1/instances/${instanceId}/client/action/get-contact-by-id`,
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: autor
            },
            body: JSON.stringify({
              contactId: chatId
            })
          }
        );

        const data = await response.json();

        console.log("Respuesta waapi lid:", data);

        // 👇 AJUSTAR SEGÚN RESPUESTA REAL
        const numero = data?.id?.user || data?.id?._serialized || null;
        console.log("Numero resuelto:",
          {
            chatId,
            numero,
            datauser: data?.id?.user,
            dataserial: data?.id?._serialized,
            datanumber: data?.number
          });
        if (!numero) return null;

        return numero
          .replace("@c.us", "")
          .replace(/^549/, '')
          .replace(/^54/, '');

      } catch (err) {

        console.error("Error resolviendo LID:", err.message);
        return null;
      }
    }

    return null;
  }

  // =========================
  // MEMORIA
  // =========================

  const ultimoMensajeFueraHorario = new Map();
  const mutedUsers = new Map();

  // =========================
  // GOOGLE SHEETS
  // =========================


  async function tieneCuentaActiva(numero) {
    try {
      const normalizar = (str) =>
        String(str || "").replace(/\D/g, "");

      const numeroNormalizado = normalizar(numero);

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: [
          `${sheetName}!O4:O`, // contacton8n
          `${sheetName}!F4:F`, // estado (f/r)
        ],
      });

      const contactos =
        response.data.valueRanges?.[0]?.values?.flat() || [];

      const estados =
        response.data.valueRanges?.[1]?.values?.flat() || [];

      for (let i = 0; i < contactos.length; i++) {
        const contacto = normalizar(contactos[i]);
        const estado = String(estados[i] || "").trim().toLowerCase();

        if (contacto === numeroNormalizado) {
          return ["f", "r"].includes(estado);
        }
      }

      return false;

    } catch (err) {
      console.error("Error Sheets:", err.message);
      return false;
    }
  }

  // =========================
  // ENDPOINT
  // =========================

  app.post('/wapp/receipt', async (req, res) => {
    try {
      const cabezal = req.headers;
      const { event, instanceId, data } = req.body;

      if (cabezal['x-waapi-key'] !== waapiKey) {
        console.error("Error en /wapp/receipt: clave de autorización inválida", new Date().toLocaleString());
        return res.status(200).send("Clave de autorización inválida");
      }
      const msg = data?.message;


      if (!msg || event !== "message") return res.sendStatus(200);

      const chatId = msg.from;
      const texto = (msg.body || "").toLowerCase();

      // =========================
      // DEDUPLICACIÓN
      // =========================

      const messageId = msg?.id?._serialized;

      if (messageId) {

        if (processedMessages.has(messageId)) {

          console.log("Mensaje duplicado ignorado:", messageId);

          return res.sendStatus(200);
        }

        processedMessages.add(messageId);

        setTimeout(() => {
          processedMessages.delete(messageId);
        }, 60000);
      }

      // =========================
      // FILTROS
      // =========================

      if (
        msg.from === "5492342513085@c.us" ||
        msg.from === "status@broadcast" ||
        msg.from.includes("@g.us")
      ) return res.sendStatus(200);

      console.log("Evento recibido:", { event, instanceId, msg: msg ? { from: msg.from, type: msg.type, body: msg.body } : null });
      
      // =========================
      // SILENCIO BOT (nb)
      // =========================

      if (mutedUsers.has(chatId)) {
        const expire = mutedUsers.get(chatId);

        if (Date.now() < expire) return res.sendStatus(200);
        else mutedUsers.delete(chatId);
      }

      if (texto.startsWith("nb")) {

        const partes = texto.split(" ");
        const minutos = parseInt(partes[1]) || 60;

        mutedUsers.set(chatId, Date.now() + minutos * 60000);

        console.log("Bot silenciado:", chatId);
        return res.sendStatus(200);
      }

      if (texto === "bot") {
        mutedUsers.delete(chatId);
      }

      // =========================
      // CONFIG
      // =========================

      function leerConfiguracion() {
        const contenido = fs.readFileSync("config.txt", "utf-8").split("\n");

        return {
          fechaEspecial: contenido[0]?.trim() || "",
          linea3: contenido[2]?.trim() || "",
          linea5: contenido[4]?.trim() || ""
        };
      }

      const { fechaEspecial, linea3, linea5 } = leerConfiguracion();
      const hoy = dayjs().tz(TZ).format("DD/MM");

      // =========================
      // HORARIO
      // =========================

      function estaDentroDelHorario() {

        const ahora = dayjs().tz(TZ);
        const dia = ahora.day();

        if (dia === 0 || dia === 6) return false;

        const hora = ahora.format("HH:mm");

        return (
          (hora >= "09:30" && hora <= "13:00") ||
          (hora >= "16:30" && hora <= "20:00")
        );
      }

      const fueraDeHorario =
        hoy === fechaEspecial ||
        !estaDentroDelHorario();

      // =========================
      // DETECCIONES
      // =========================

      const esAudio =
        msg.type === 'ptt' ||
        msg.type === 'audio';

      const esImagen =
        msg.type === 'image';

      const pideCredenciales =
        texto.includes("usuario") ||
        texto.includes("clave") ||
        texto.includes("correo") ||
        texto.includes("contraseña") ||
        texto.includes("credencial") ||
        texto.includes("mi cuenta") ||
        texto.includes("password");

      // =========================
      // 🔴 FUERA DE HORARIO
      // =========================

      if (fueraDeHorario) {

        const ahora = Date.now();
        const ultimo = ultimoMensajeFueraHorario.get(chatId);
        const cuatroHoras = 4 * 60 * 60 * 1000;

        // 👉 MENSAJE CERRADO (cada 4h)
        if (!ultimo || (ahora - ultimo) >= cuatroHoras) {

          ultimoMensajeFueraHorario.set(chatId, ahora);
          console.log("Mensaje fuera de horario a:", msg.from);
          const numero = await resolverNumero(msg.from, instanceId);
          console.log("Número resuelto desde LID:", numero);
          const tieneCuenta = await tieneCuentaActiva(numero);

          console.log({
            msgFrom: msg.from,
            numero,
            tieneCuenta
          }, color = "yellow");


          let mensaje = `
🗓️ Horario de Atención:
Lunes a viernes:
🕤 9,30 a 🕐 13,00
🕟 16,30 a 🕗 20,00
🚫 Feriados, Sábados y domingos *CERRADO*
*Anuncios*: https://bit.ly/avisarte 👈 (presionar el enlace)
`;

          if (tieneCuenta) {
            mensaje += `

${linea3}

${linea5}
`;
          } else {
            mensaje += `

${linea5}
`;
          }

          mensaje += `
🤖 intentará ayudarte.
Antepone las iniciales nb a tu mensaje para evitarlo unos momentos.
`;

          await fetch(
            `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`,
            {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: autor
              },
              body: JSON.stringify({
                chatId,
                message: mensaje
              })
            }
          );

          console.log("Mensaje cerrado enviado:", chatId);
        }

        // 👉 SIEMPRE enviar a n8n
        // const remitente = await resolverNumero(msg.from, instanceId) // chatId.replace('@c.us', '');

        const remitenteBase = String(await resolverNumero(msg.from, instanceId)).replace(/\D/g, '');

        let remitente = remitenteBase;

        // número argentino local (10 dígitos)
        if (/^\d{10}$/.test(remitenteBase)) {
          remitente = `549${remitenteBase}`;
        }

        console.log({
          msgFrom: msg.from,
          remitente,
          remitenteBase
        });


        let audioBase64 = null;
        let imageBase64 = null;

        if (esAudio) {
          const audioBuffer = await decryptWhatsAppAudio(
            msg._data.deprecatedMms3Url,
            msg._data.mediaKey
          );
          audioBase64 = audioBuffer.toString("base64");
        }

        if (esImagen) {
          imageBase64 = msg._data?.body || null;
        }
        const payload = {
          from: remitente,
          text: msg.body || null,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          imagen: imageBase64,
          audio: audioBase64
        }
        await axios.post(n8nurl, payload).catch(e => console.error("Error n8n:", e.message));

        console.log("Enviado a n8n (cerrado):", remitente);

        return res.sendStatus(200);
      }

      // =========================
      // 🟢 DENTRO DE HORARIO
      // =========================

      if (esAudio || esImagen || pideCredenciales) {

        const remitente = chatId.replace('@c.us', '');

        let audioBase64 = null;
        let imageBase64 = null;

        if (esAudio) {
          const audioBuffer = await decryptWhatsAppAudio(
            msg._data.deprecatedMms3Url,
            msg._data.mediaKey
          );
          audioBase64 = audioBuffer.toString("base64");
        }

        if (esImagen) {
          imageBase64 = msg._data?.body || null;
        }

        await axios.post(n8nurl, {
          from: remitente,
          text: msg.body || null,
          pushName: msg.notifyName || 'Cliente',
          tipo: msg.type,
          imagen: imageBase64,
          audio: audioBase64
        }).catch(e => console.error("Error n8n:", e.message));

        console.log("Enviado a n8n (abierto):", remitente);
      }

      return res.sendStatus(200);

    } catch (error) {
      console.error("Error:", error.message);
      return res.sendStatus(200);
    }
  });


  // Inicio recibir desde n8n y NO enviar mensaje
  app.post('/wapp/recibon8ntest', async (req, res) => {
    const { destinatario, mensaje } = req.body;
    console.log("Recibo desde n8n para enviar a waapi:", destinatario, mensaje)
    return res.status(200).json({ message: "Recibido en backend TESTER" });
  })
  // Fin recibir desde n8n y NO enviar mensaje

  // Inicio recibir desde n8n y enviar mensaje
  app.post('/wapp/recibon8n', async (req, res) => {
    const { destinatario, mensaje, aviso } = req.body;
    console.log("Recibo desde n8n para enviar a waapi:", destinatario, mensaje)
    const instanceId = idinsta;
    try {
      // console.log(destinatario, mensaje)
      let enviarA = null
      if (destinatario.includes("@lid")) {
        enviarA = destinatario;
      } else { enviarA = destinatario + "@c.us" }
      const params = {
        chatId: enviarA, // data.message.from,
        message: mensaje,
        // replyToMessageId: data.message.id._serialized // objRecibe.serial
      }
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: autor
        },
        body: JSON.stringify(params)
      };
      await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/send-message', options)
        .then(response => response.json())
        .then(response => {
          console.log(response.data.status)
          console.log('Mensaje respondido por ChatBot');
        })
        .catch(err => {
          console.error(err)
          console.log('Mensaje NO pudo ser enviado');
        });

      // 6. Marcar chat como no leido, luego de contestar 
      if (aviso && aviso === "avisado") {
        console.log("No marco como no leído porque ya se avisó")
        return res.status(200).json({ message: "Recibido en backend, no marco como no leído porque ya se avisó" });
      } else {
        const optionsur = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: autor
          },
          body: JSON.stringify({ chatId: enviarA })
        };

        await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/mark-chat-unread', optionsur)
          .then(res => res.json())
          .then(res => {
            console.log('Chat marcado como no leído:', res);
          })
          .catch(err => {
            console.error(err)
            console.log('No se pudo marcar como no leído', err);
          });
      }

      return res.status(200).json({ message: "Recibido en backend" });
    } catch (error) {
      console.log("Error en recibon8n", error.message);
      return res.status(400).json({ error: error.message });
    }
  })
  // Fin recibir desde n8n y enviar mensaje

  //init scheduler
  // if (environment === "production") { programador_tareas(); }

  app.post('/wapp/send-mail', async (req, res) => {
    const { message, phone, name, email, correo, web } = req.body
    if (!name || name === "") {
      res.status(400).json({ estado: "FAIL", mensaje: "Por Favor ingrese su nombre" })
    } else if (!email || email === "") {
      res.status(400).json({ estado: "FAIL", mensaje: "Por Favor ingrese su email" })
    } else if (!message || message === "") {
      res.status(400).json({ estado: "FAIL", mensaje: "Por Favor ingrese su comentario" })
    }
    try {
      await enviandoEmail(correo, message, name, phone, email, web)
      res.status(200).json({ estado: "OK", mensaje: "Mensaje enviado correctamente" })
    } catch (error) {
      res.status(400).json({ estado: "FAIL", mensaje: "No pudo enviarse el mensaje \n " + error })
    }
  })


  app.get('/wapp', (req, res) => {
    return res.status(200).json({ message: "BackEnd for WAPP - for customer: " })
  })

  const fs = require('fs');
  const path = require('path');
  const archivoPath = path.join(__dirname, 'config.txt');

  // GET: Leer archivo
  app.get('/wapp/archivo', (req, res) => {
    fs.readFile(archivoPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer el archivo:', err, archivoPath);
        return res.status(500).send('Error al leer el archivo');
      }
      res.send(data);
    });
  });

  const celusPath = path.join(__dirname, 'numeros.txt');
  // GET: Leer archivo
  app.get('/wapp/numeros', (req, res) => {
    fs.readFile(celusPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer el archivo:', err, celusPath);
        return res.status(500).send('Error al leer el archivo');
      }
      res.send(data);
    });
  });

  // POST: Guardar nuevo contenido
  app.post('/wapp/archivo', (req, res) => {
    const { contenido } = req.body;
    if (typeof contenido !== 'string') {
      return res.status(400).send('Contenido inválido');
    }

    fs.writeFile(archivoPath, contenido, 'utf8', (err) => {
      if (err) {
        console.error('Error al guardar el archivo:', err, archivoPath);
        return res.status(500).send('Error al guardar el archivo');
      }
      res.send('Archivo guardado correctamente');
    });
  });

} catch (error) {
  console.log('Error en index', error);
}