// reminder's scheduler
const { programador_tareas, envio_anuncio_all, envio_anuncio_active, envio_anuncio_inactive } = require('./src/programador.js');
const { Router } = require('express');
const express = require('express');
const morgan = require('morgan');
// const nodemailer = require('nodemailer')
require('dotenv').config();

// const qrcode = require('qrcode-terminal');
const QRcode = require('qrcode');


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
var lastday = function(y, m){
  // Create a new Date object representing the last day of the specified month
  // By passing m + 1 as the month parameter and 0 as the day parameter, it represents the last day of the specified month
  return new Date(y, m + 1, 0).getDate();
}

const february =() => {
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

  app.get("/wapp/qr/:idinsta", async (req, res) => {
    const { idinsta } = req.params
    qrimage = "qr-image-" + idinsta.toString() + ".png"
    // res.sendFile(qrimage)
    // res.setHeader('content-type', 'image/png');
    // res.send("<h1>Qr de instancia</h1><br /><br /><img src='14852-qr-image.png' height='260' width='260' alt='QR image' />")
    res.sendFile('/root/projects/wapp/' + qrimage);
    // res.status(200)
  })

  // evento recibido desde waapi
  app.post('/wapp/receipt/', async (req, res) => {
    const { event, instanceId, data } = req.body
    const autor = process.env.AUTOR
    const excludedPhones = ['5492213057933@c.us', '5492342411479@c.us', '5492346557533@c.us', '5492342463902@c.us', '5492342403383@c.us', '5492342456413@c.us', '5492342485902@c.us', '5492342406265@c.us'];
    // console.log("Evento: "+ event + ", Tipo de mensaje: " + data.message.type)
    if (event === "message") {
      if (data.message.to === "5492342513085@c.us" && data.message.from !== "status@broadcast" && !data.message.from.includes("@g.us")) {
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
        //await axios.post('')
        /* } */
/*         if (data.message.type === 'chat') {
          const paramsar = {
            "model": "embed-multilingual-light-v3.0",
            "inputs": [objRecibe.text],
            "examples": [{ "text": "Hola como estas", "label": "Saludo" },
            { "text": "buen dia buenas tardes noches", "label": "Saludo" },
            { "text": "no puedo ver ningun canal", "label": "fallaapp" },
            { "text": "la app falla canales", "label": "fallaapp" },
            { "text": "cuanto cuesta la app", "label": "Precio" },
            { "text": "Precio de la app", "label": "Precio" },
            { "text": "Te paso el comprobante de pago", "label": "Pago" },
            { "text": "envio mando comprobante de pago", "label": "Pago" },
            { "text": "muchas gracias", "label": "agradezco" },
            { "text": "agradezco", "label": "agradezco" },
            { "text": "acceso a mi panel", "label": "panel" },
            { "text": "panel vendedor", "label": "panel" },
            { "text": "no anda el streaming de video", "label": "servertv" },
            { "text": "se corta el streaming del canal", "label": "servertv" },
            { "text": "no anda el streaming de la radio?", "label": "serverfm" },
            { "text": "se corta el streaming la radio", "label": "serverfm" }]
          }
          const optionsar = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: 'BEARER XGOFt1rBPNTFCCG08zUlMSjqnToSdN1X4n1G74bk'
            },
            body: JSON.stringify(paramsar)
          }
          console.log(optionsar)
          await fetch('https://api.cohere.com/v1/classify', optionsar)
            .then(response => response.json())
            .then(response => {
              console.log(response)
              console.log('A ver como me fue', response.classifications[0].prediction);
            })
            .catch(err => {
              console.error(err)
              console.log('Error en cohere');
            });

        } */
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