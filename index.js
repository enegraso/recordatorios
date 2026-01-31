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

const sheets = require('./googleClient');

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

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);


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
    requestId: tokens.id(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res), 10),
    responseTime: `${tokens["response-time"](req, res)} ms`,
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

  app.post('/wapp/receipt/', async (req, res) => {
    try {
      const { event, instanceId, data } = req.body;

      // Leer el archivo y generar un array con los números de WhatsApp
      function obtenerNumerosDesdeArchivo(rutaArchivo) {
        try {
          const data = fs.readFileSync(rutaArchivo, 'utf8');
          const numeros = data
            .split('\n')                 // Separar por líneas
            .map(n => n.trim())          // Eliminar espacios extra
            .filter(n => n.length > 0);  // Filtrar líneas vacías
          return numeros;
        } catch (err) {
          console.error('Error al leer el archivo:', err);
          return [];
        }
      }

      // Función para descargar audio desde WaAPI
 /*      async function descargarAudioWaapi(message, instanceId, autor) {
        if (!message.deprecatedMms3Url) return null;
        console.log('Descargando audio desde WaAPI:', message.deprecatedMms3Url);
        console.log('Instance ID:', instanceId);
        console.log('Authorization:', autor);
        console.log('Mensaje completo:', message);
        const url = `https://waapi.app/api/v1/instances/${instanceId}/client/action/download-media`;

        const response = await axios.post(
          url,
          {
            url: message.deprecatedMms3Url
          },
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: autor
            }
          }
        );

        // WaAPI responde base64
        return response.data?.base64 || null;
      } */


      // 1. Validaciones mínimas (una sola vez)
      if (
        event !== 'message' ||
        data.message.from === 'status@broadcast' ||
        data.message.from.includes('@g.us') ||
        data.message.to !== '5492342513085@c.us'
      ) {
        return res.sendStatus(200);
      }

      // 2. Leer exclusiones UNA sola vez
      const excludedPhones = obtenerNumerosDesdeArchivo('numeros.txt');
      if (excludedPhones.includes(data.message.from)) {
        return res.sendStatus(200);
      }

      // 3. Normalizar datos
      const remitente = data.message.from.replace('@c.us', '');

      // procesar imagen
      let imageBase64 = null;

      if (data.message.type === 'image') {
        imageBase64 = data.message._data?.body || null;
      }

      // procesar audio
/*       let audioBase64 = null;

      if (data.message.type === 'audio' || data.message.type === 'ptt') {
        audioBase64 = await descargarAudioWaapi(
          data.message._data,
          instanceId,
          autor
        );
      } */

      // Debug info
      // console.log('Audio base64 length:', audioBase64?.length);

      // 4. Payload único hacia n8n
      const payload = {
        from: remitente,
        text: data.message.body || null,
        pushName: data.message.pushName || 'Cliente',
        tipo: data.message.type,
        imagen: imageBase64,
        audio: null // audioBase64
      };

      console.log('Payload enviado a n8n:', payload);

      // 5. Enviar a n8n
      await axios.post(n8nurl, payload);

      return res.sendStatus(200);

    } catch (error) {
      console.error('Error en /wapp/receipt:', error.message);
      return res.sendStatus(200); // importante: no romper webhook
    }
  });

  // recibir desde n8n y enviar mensaje
  app.post('/wapp/recibon8n/', async (req, res) => {
    const { destinatario, mensaje } = req.body;
    console.log("Recibo desde n8n para enviar a waapi:", destinatario, mensaje)
    const instanceId = idinsta;
    try {
      // console.log(destinatario, mensaje)
      const params = {
        chatId: destinatario + "@c.us",
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
          // console.log(response)
          console.log('Mensaje respondido por ChatBot');
        })
        .catch(err => {
          console.error(err)
          console.log('Mensaje NO pudo ser enviado');
        });
      return res.status(200).json({ message: "Recibido en backend" });
    } catch (error) {
      console.log("Error en recibon8n", error.message);
      return res.status(400).json({ error: error.message });
    }
  })

  //init scheduler
  if (environment === "production") { programador_tareas(); }

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

  // evento recibido desde waapi
  app.post('/wapp/receiptNO/', async (req, res) => {
    try {
      console.log("Evento recibido de waapi")

      function leerConfiguracion() {
        const contenido = fs.readFileSync("config.txt", "utf-8").split("\n");
        const fechaEspecial = contenido[0].trim();
        const mensajeExtra = contenido.slice(2).join("\n").trim()
        return { fechaEspecial, mensajeExtra };
      }
      const { event, instanceId, data } = req.body
      const autor = process.env.AUTOR
      const idUsuario = data.message.from
      const hoy = dayjs().tz(TZ).format("DD/MM"); // dayjs().format("DD/MM");
      const { fechaEspecial, mensajeExtra } = leerConfiguracion();
      console.log("Fecha especial:" + fechaEspecial + "Evento: " + event + ", Tipo de mensaje: " + data.message.type + ", De: " + data.message.from + ", Para: " + data.message.to + ", id: " + data.message.id._serialized)


      // Leer el archivo y generar un array con los números de WhatsApp
      function obtenerNumerosDesdeArchivo(rutaArchivo) {
        try {
          const data = fs.readFileSync(rutaArchivo, 'utf8');
          const numeros = data
            .split('\n')                 // Separar por líneas
            .map(n => n.trim())          // Eliminar espacios extra
            .filter(n => n.length > 0);  // Filtrar líneas vacías
          return numeros;
        } catch (err) {
          console.error('Error al leer el archivo:', err);
          return [];
        }
      }

      // Ejemplo de uso para obtener los numeros a quienes le permito envio de audios 
      const excludedPhones = obtenerNumerosDesdeArchivo('numeros.txt');

      // const excludedPhones = ['5492213057933@c.us', '5492342411479@c.us', '5492346557533@c.us', '5492342463902@c.us', '5492342403383@c.us', '5492342456413@c.us', '5492342485902@c.us', '5492342406265@c.us', '5492342567415@c.us', '5492213057933@c.us', '5492342410437@c.us'];
      // console.log("Evento: "+ event + ", Tipo de mensaje: " + data.message.type)
      if (event === "message") {

        if (data.message.to === "5492342513085@c.us" && data.message.from !== "status@broadcast" && !data.message.from.includes("@g.us")) {
          /* if (estaDentroDelHorario()) { */
          // res.send('¡Estamos disponibles para atenderte!');

          /* 
                  console.log("Mensaje para Mi", data.message.id._serialized)
                  console.log("mensaje: ", data.message.body)
                  console.log("De: ", data.message.from)
                  console.log("Para: ", data.message.to)
                  console.log("Tipo: ", data.message.type) */
          /* if (data.message.type === 'chat') { */
          const objRecibe = {
            text: data.message.body,
            type: data.message.type,
            backwa: instanceId,
            number: data.message.from,
            serial: data.message.id._serialized
          }
          console.log(objRecibe)
          ////////////////////////
          // si es mensaje de audio y no es de un contacto en exclusion, respondemos que no escuchamos audios
          /////////////////////////
          if ((data.message.type === 'ptt' || data.message.type === 'audio')) { // si entra mensaje de audio
            if (excludedPhones.includes(data.message.from)) { // si es de un contacto en exclusion
              console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario permitido", data.message.from)
            } else {
              console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario NO permitido", data.message.from)

              // audio recibido
              const base64 = data.message._data.body;
              console.log('Media URL:', base64);

              const params = {
                chatId: data.message.from,
                message: "🎙️ Me encantaría escucharte, pero por ahora soy mejor leyendo que oyendo. \n ¿Podrías escribirme tu consulta por aquí? ¡Muchas gracias! ✍️✨",
                //                replyToMessageId: data.message.id._serialized // objRecibe.serial
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
                  // console.log(response)
                  console.log('Mensaje de audio respondido');
                })
                .catch(err => {
                  console.error(err)
                  console.log('Mensaje NO enviado');
                });
            }
          } else if (data.message.type === 'image' || data.message.type === 'video' || data.message.type === 'document') {
            ////////////////////
            // si entra mensaje de imagen, video o doc
            ///////////////////
            console.log("Mensaje multimedia para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario NO permitido", data.message.from)

            /*             const params = {
                          chatId: data.message.from,
                          message: "¡Recibido! 📸 He guardado tu contenido. \n Se la pasé a uno de mis compañeros humanos para que la revise personalmente. En un ratito te confirmo todo. \n ¡Gracias por la paciencia! ⏳😊",
                          //                replyToMessageId: data.message.id._serialized // objRecibe.serial
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
                            // console.log(response)
                            console.log('Mensaje de audio respondido');
                          })
                          .catch(err => {
                            console.error(err)
                            console.log('Mensaje NO enviado');
                          });
             */
            // inicio n8n integration
            const remitente = data.message.from.replace('@c.us', '');
            const n8nWebhookUrl = n8nurl; // Pegá la URL de n8n (Production o Test)
            // imagen, video o doc recibido
            const base64 = data.message._data.body;
            console.log('Base64:', base64);

            let esImagen = data.message.type === 'image' ? true : false;
            let esAudio = data.message.type === 'audio' || data.message.type === 'ptt' ? true : false;
            let imagenPath = null;
            console.log("//////////////////////////////////////////");
            console.log("//////////////////////////////////////////");

            const payload = {
              from: remitente,      // Ejemplo: "5492342504701@c.us"
              text: data.message.body,      // El contenido del mensaje
              isAudio: esAudio, // Indica si el mensaje es de audio
              pushName: data.message.pushName || 'Cliente', // El nombre del usuario en WhatsApp
              audioUrl: base64, // Incluye la ruta o URL del audio si es un mensaje de audio
              isImage: esImagen,
              imagen: base64,
              accion: ""
            };
            console.log("Payload enviado en imagen a n8n:", payload);


            console.log("//////////////////////////////////////////");
            console.log("//////////////////////////////////////////");


            const envian8n = await axios.post(n8nWebhookUrl, payload)
              .then(response => {
                console.log('Respuesta enviada en imagen a n8n con éxito');
                // Si n8n devuelve la respuesta de la IA en el cuerpo (Webhook Response), 
                // acá podrías tomarla para mandarla de vuelta al WhatsApp si fuera necesario.
              })
              .catch(error => {
                console.error('Error llamando a n8n en imagen:', error.message);
              });

            console.log("Respuesta de n8n:", envian8n.data);
            // fin n8n integration

          } else if (data.message.type === 'chat' || data.message.type === 'text') {
            /////////
            // si es mensaje de texto u otro tipo, proceso normal
            /////////
            //            if (data.message.from === "5492342504701@c.us" || data.message.from === "5492342463902@c.us") {
            const remitente = data.message.from.replace('@c.us', '');
            const n8nWebhookUrl = n8nurl; // Pegá la URL de n8n (Production o Test)

            console.log("//////////////////////////////////////////");
            console.log("//////////////////////////////////////////");

            //          console.log("remitente:", remitente);
            console.log("message:", data.message.body);
            console.log("tipo:", data.message.type);
            //          console.log("esAudio:", esAudio);
            //          console.log("audioPath:", audioPath);


            const payload = {
              from: remitente,      // Ejemplo: "5492342504701@c.us"
              text: data.message.body,      // El contenido del mensaje
              isAudio: false, // Indica si el mensaje es de audio
              pushName: data.message.pushName || 'Cliente', // El nombre del usuario en WhatsApp
              // audioUrl: "", // Incluye la ruta o URL del audio si es un mensaje de audio
              isImage: false,
              // imagen: "",
              accion: "nada"
            };
            console.log("Payload enviado en texto a n8n:", payload);


            console.log("//////////////////////////////////////////");
            console.log("//////////////////////////////////////////");


            const envian8n = await axios.post(n8nWebhookUrl, payload)
              .then(response => {
                console.log('Respuesta enviada en texto a n8n con éxito');
                // Si n8n devuelve la respuesta de la IA en el cuerpo (Webhook Response), 
                // acá podrías tomarla para mandarla de vuelta al WhatsApp si fuera necesario.
              })
              .catch(error => {
                console.error('Error llamando a n8n:', error.message);
              });

            console.log("Respuesta de n8n en texto:", envian8n.data);
            // fin n8n integration
          }
        }
      }
    } catch (error) {
      console.log("Error al procesar el evento:", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.sendStatus(200);

  })



  /* 
  async function enviandoEmail(correo, texto, name, phonenumber, email, web) {
    contentHTML = `
    <h1>Mensaje de Correo Electrónico</h1>
    `
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    console.log(transporter)
    const info = await transporter.sendMail({
      from: process.env.MAIL,
      to: correo,
      replyTo: email,
      subject: 'Mensaje de ' + name + " Desde la web: " + web,
      html: "<br/><br/>DEsde el correo: " + email + " enviaron el siguiente mensaje.<br/><br/>" + texto + "<br/>Nombre: " + name + "<br/><br/>Muchas Gracias"
    })

    console.log(info)

  }
 */
  /* router.get("/", (req,res) => {
      res.status(200).json({message:"BackEnd for Emails - para los formularios de las apps."})
  })
  
  module.exports = router */

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

function intentos() {
  /*        
    if (intentosfallidos >= 3) {
            // además de los mensajes de audio, si es un mensaje de texto, respondemos en caso de fuera de horario
            console.log("hoy", hoy, "ahora", dayjs().tz(TZ).format("DD/MM HH:mm:ss"), "esta en horario", estaDentroDelHorario())
  
            const fecha1 = fechaEspecial; // formato dd/mm dia cerrado
            const fecha2 = hoy; // formato dd/mm fecha de hoy
  
            // Función para convertir "dd/mm" a Date (usando año actual)
            const parseFecha = (str) => {
              const [dia, mes] = str.split("/").map(Number);
              const año = new Date().getFullYear();
              return new Date(año, mes - 1, dia);
            };
  
            const f1 = parseFecha(fecha1);
            const f2 = parseFecha(fecha2);
  
            let resultado = "";
            let fechasuperior = false
  
            if (f1 < f2) {
              resultado = `${fecha1} es inferior a ${fecha2}`
              fechasuperior = true
            }
            else if (f1 > f2) {
              resultado = `${fecha1} es superior a ${fecha2}`;
              fechasuperior = false
            }
            else resultado = `${fecha1} es igual a ${fecha2}`;
  
  
            const hoymenorfecha = resultado
  
            console.log("hoy menor a fecha especial", hoymenorfecha, fechasuperior)
  
            // si es dia especial o fuera de horario, y no es mensaje del mismo numero del bot
            if ((hoy === fechaEspecial || !estaDentroDelHorario()) && data.message.from !== '5492342513085@c.us') { // si es fuera de horario o dia especial y es mensaje de texto
              // cache de 4 horas
              if (cache.has(idUsuario)) {
                console.log("Mensaje recibido (ya se respondió recientemente")
                return res.status(200).json({ mensaje: "Mensaje recibido (ya se respondió recientemente)" });
              }
              const newmessage00 = "🤖 Te paso algunas opciones, *para que veas, mientras vuelven los agentes*\n\n"
              const newmessage01 = "🌐 *Nuestros servicios y productos*: 👉 https://bit.ly/sib2000 👈 (tap/presiona en enlace)\n"
              const newmessage02 = "🔥 *Anuncios, info e incidencias*: 👉 https://bit.ly/avisarte 👈 (tap/presiona en enlace)\n"
              const newmessage03 = "🔓 *Recupera usuario y clave app 📺*: 👉 https://bit.ly/usermplay 👈 (tap/presiona en enlace)\n"
              const newmessage04 = "♾️ *Instalar la app 📺*: 👉 https://bit.ly/iapptivi 👈 (tap/presiona en enlace)\n"
              const newmessage05 = "🤑 *Si sabe monto y desea pagar*: 👉 https://bit.ly/mps2k 👈 (tap/presiona en enlace)\n"
              // const newmessage06 = "📢 *Enterate antes* Novedades, actualizaciones de app📺/precios en Canal WA: 👉 https://bit.ly/canalwamp 👈 (tap/presiona en enlace) \n\n"
  
              const newmessage = newmessage00 + newmessage01 + newmessage02 + newmessage03 + newmessage04 + newmessage05 // + newmessage06
  
  
              const respuestafinal = hoy === fechaEspecial ? `*Hoy cerrado* \n\n${mensajeExtra} \n\n` : fechasuperior === false ?  fechaEspecial.length < 4 ?  ""  "Día " + fechaEspecial + " *CERRADO*\n\n" : ""
              const respuesta = mensajeAusencia + respuestafinal + newmessage + "\n\nMuchas Gracias. " // `Negocio cerrado. ${mensajeExtra}`;
              cache.set(idUsuario, true, 10800); // 3 horas = 10800 segundos
              // return res.status(200).json({ mensaje: respuesta });
  
              if (fechasuperior === false || hoy === fechaEspecial) { // si es dia especial cerrado o fuera de horario o previo al dia especial
                const params = {
                  chatId: data.message.from,
                  mediaUrl: 'https://km210.com/00cerrado.png',
                  mediaCaption: respuesta, //mensajeAusencia,
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
                console.log("tipo de Mensaje para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario NO permitido", data.message.from, "aunsencia", mensajeAusencia)
  
                await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/send-media', options)
                  .then(response => response.json())
                  .then(response => {
                    console.log(response)
                    console.log('Mensaje fuera de horario respondido');
                  })
                  .catch(err => {
                    console.error(err)
                    console.log('Mensaje NO enviado');
                  });
  
  
              } else { //dia superior al de cierre segun config txt
                const params = {
                  chatId: data.message.from,
                  mediaUrl: 'https://km210.com/01cerrado.png',
                  mediaCaption: respuesta, //mensajeAusencia,
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
                console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario NO permitido", data.message.from, "aunsencia", mensajeAusencia)
  
                await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/send-media', options)
                  .then(response => response.json())
                  .then(response => {
                    console.log(response)
                    console.log('Mensaje fuera de horario respondido');
                  })
                  .catch(err => {
                    console.error(err)
                    console.log('Mensaje NO enviado');
                  });
  
  
              }
              //marcar chat como no leido, luego de enviar mensaje de ausencia
  
              const optionsur = {
                method: 'POST',
                headers: {
                  accept: 'application/json',
                  'content-type': 'application/json',
                  authorization: autor
                },
                body: JSON.stringify({ chatId: data.message.from })
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
  
    }
  */

}    // crear codigo qr en backend

/* if (event === "qr") {
  // saveImage.js
  // console.log(req.body)
  // console.log(req.body.data.base64)
  const fs = require('fs');
 
  function saveBase64Image(base64String, outputFilePath) {
    // Remove the data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
 
    // Convert base64 string to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
 
    // Write buffer to a file
    fs.writeFile(outputFilePath, imageBuffer, (err) => {
      if (err) {
        console.error('Failed to save the image: ', err);
      } else {
        console.log('Image saved successfully to ', outputFilePath);
      }
    });
  }
 
  // Example usage:
  const base64String = req.body.data.base64 //  'your-base64-encoded-image-string-here';
  const outputFilePath = 'qr-image-' + instanceId.toString() + '.png';
 
  saveBase64Image(base64String, outputFilePath);
 
  // fin creacion qr code in backend
} */