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

// variables para obtener ruta actual
const fs = require('fs')/* .promises */;
const path = require('path');

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isBetween = require("dayjs/plugin/isBetween");
const NodeCache = require("node-cache");

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
app.use(morgan("dev"));

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
function estaDentroDelHorario() {
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
}

// Función que verifica si estamos dentro del horario de atención

const cache = new NodeCache(); // Cache por IP o ID, expira en 4h

const TZ = "America/Argentina/Buenos_Aires";

const HORARIOS = {
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
};

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
      { inicio: "09:30", fin: "12:30" },
      { inicio: "16:30", fin: "19:30" },
    ];
  } else if ([2, 4].includes(diaSemana)) { // martes, jueves
    bloques = [
      { inicio: "10:30", fin: "12:30" },
      { inicio: "16:30", fin: "19:30" },
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

function leerConfiguracion() {
  const contenido = fs.readFileSync("config.txt", "utf-8").split("\n");
  const fechaEspecial = contenido[0].trim();
  const mensajeExtra = contenido.slice(2).join("\n").trim()
  return { fechaEspecial, mensajeExtra };
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


  app.get("/wapp/qr/:idinsta", async (req, res) => {
    const { idinsta } = req.params
    qrimage = "qr-image-" + idinsta.toString() + ".png"
    // res.sendFile(qrimage)
    // res.setHeader('content-type', 'image/png');
    // res.send("<h1>Qr de instancia</h1><br /><br /><img src='14852-qr-image.png' height='260' width='260' alt='QR image' />")
    res.sendFile('/root/projects/wapp/' + qrimage);
    // res.status(200)
  })

  let mensajeAusencia = '🤖 Mensaje de bot: *Ausente* \n\n'
  let textoarchivo = ''

  // evento recibido desde waapi
  app.post('/wapp/receipt/', async (req, res) => {
    const { event, instanceId, data } = req.body
    const autor = process.env.AUTOR
    const idUsuario = data.message.from

    const hoy = dayjs().tz(TZ).format("DD/MM"); // dayjs().format("DD/MM");
    const { fechaEspecial, mensajeExtra } = leerConfiguracion();

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
        if ((data.message.type === 'ptt' || data.message.type === 'audio')) { // si entra mensaje de audio
          if (excludedPhones.includes(data.message.from)) { // si es de un contacto en exclusion
            console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario permitido", data.message.from)
          } else {
            console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized, "destinatario NO permitido", data.message.from)
            const params = {
              chatId: data.message.from,
              message: "🔇 Lamentablemente: No escuchamos mensajes de audio.\n🤝 Muchas gracias por comprender.",
              replyToMessageId: data.message.id._serialized // objRecibe.serial
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
        }
        // además de los mensajes de audio, si es un mensaje de texto, respondemos en caso de fuera de horario
        console.log("hoy", hoy, "ahora", dayjs().tz(TZ).format("DD/MM HH:mm:ss"), "esta en horario", estaDentroDelHorario())

        if (hoy === fechaEspecial || !estaDentroDelHorario()) {
          // cache de 4 horas
          if (cache.has(idUsuario)) {
            console.log("Mensaje recibido (ya se respondió recientemente")
            return res.status(200).json({ mensaje: "Mensaje recibido (ya se respondió recientemente)" });
          }
          const newmessage = "🔥✔ *NUEVA App* para ver 📺:\n\n--♾ Mul7ivisi0n Pl4y. Indicaciones de instalación:  🌐 👉 bit.ly/iapptivi#apptele 👈\n\nO descargue directamente desde navegador: https://bit.ly/multivision2025, O desde la app downloader, con ese link o código: 9009630\n\n"
          const respuestafinal = hoy === fechaEspecial ? `Hoy *cerrado* \n\n${mensajeExtra} \n\n` : fechaEspecial.length < 4 ? "" : "Día " + fechaEspecial + " *CERRADO*\n\n"
          const respuesta = mensajeAusencia + respuestafinal + "Horario de Atención: \nLunes, miércoles y Viernes:\n🕤9,30 a 🕧12,30 y 🕟16,30 a 🕢19,30 \nMartes y jueves: \n🕥10,30 a 🕧12,30 y 🕟16,30 a 🕢19,30 \n*Sábados, domingos y feriados: CERRADO*\n\nMuchas Gracias. " // `Negocio cerrado. ${mensajeExtra}`;
          cache.set(idUsuario, true, 10800); // 3 horas = 10800 segundos
          // return res.status(200).json({ mensaje: respuesta });

          const params = {
            chatId: data.message.from,
            message: respuesta, //mensajeAusencia,
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

          await fetch('https://waapi.app/api/v1/instances/' + instanceId + '/client/action/send-message', options)
            .then(response => response.json())
            .then(response => {
              console.log(response)
              console.log('Mensaje fuera de horario respondido');
            })
            .catch(err => {
              console.error(err)
              console.log('Mensaje NO enviado');
            });
        } /* else { */

        /*  } */

      } else {
        console.log("mensaje al espacio not to me")
        /*         console.log("mensaje: ", data.message.body)
                console.log("De: ", data.message.from)
                console.log("Para:", data.message.to)
                console.log("Tipo: ", data.message.type) */
      }
    }

    // crear codigo qr en backend

    if (event === "qr") {
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
    }

    return res.sendStatus(200);




  })

  //init scheduler
  programador_tareas();

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

} catch (error) {
  console.log('Error en index', error);
}