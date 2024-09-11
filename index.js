// reminder's scheduler
const { programador_tareas, envio_anuncio_all, envio_anuncio_active, envio_anuncio_inactive } = require('./src/programador.js');
const { Router } = require('express');
const express = require('express');
const morgan = require('morgan');
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

try {
  // clear console
  console.clear()
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
    const excludedPhones = ['5492213057933@c.us', '5492342411479@c.us' ];
    console.log("Evento: ", event, ", Tipo de mensaje: ", data.message.type)
    if (event === "message") {
      if (data.message.to === "5492342513085@c.us" && data.message.from !== "status@broadcast" && !data.message.from.includes("@g.us")) {
        /* 
                console.log("Mensaje para Mi", data.message.id._serialized)
                console.log("mensaje: ", data.message.body)
                console.log("De: ", data.message.from)
                console.log("Para: ", data.message.to)
                console.log("Tipo: ", data.message.type) */
        if (data.message.type === 'chat') {
          const objRecibe = {
            text: data.message.body,
            type: data.message.type,
            backwa: instanceId,
            number: data.message.from
          }
          console.log(objRecibe)
          //await axios.post('')
        }
        if ((data.message.type === 'ptt' || data.message.type === 'audio') && (!excludedPhones.includes(data.message.from))) {
          console.log("Mensaje de audio para Mi ", data.message.type, "id serial: ", data.message.id._serialized)
          const params = {
            chatId: data.message.from,
            message: "🔇 Lamentablemente: No escuchamos mensajes de audio.\n🤝 Muchas gracias por comprender.",
            replyToMessageId: data.message.id._serialized
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

  app.get('/wapp', (req, res) => {
    return res.status(200).json({ message: "BackEnd for WAPP - for customer: " })
  })

} catch (error) {
  console.log('Error en index', error);
}