// reminder's scheduler
const { programador_tareas, envio_anuncio_all, envio_anuncio_active, envio_anuncio_inactive } = require('./src/programador.js');
const { Router } = require('express');
const express = require('express');
const morgan = require('morgan');
const { Client, LocalAuth } = require('whatsapp-web.js');
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
(async () => {
  try {
    // clear console
    console.clear()
    // Listening for the server
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));

    const client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox'],
      }
    });

    // Add this after express code but before starting the server

    client.on('qr', (qr) => {
      // NOTE: This event will not be fired if a session is specified.
      console.log('QR RECEIVED', qr);

      //probando mio
      app.get('/wapp/getqr', async (req, res) => {
        try {
          const qrCodeImage = await QRcode.toDataURL(qr, {
            width: 320,
            height: 320,
          });
          console.log(qrCodeImage)

          res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`)

        } catch (err) {
          console.error('Error generating QR code:', err);
          res.status(500).send('Internal Server Error');
        }
      })

    });

    client.on('ready', () => {
      console.log('READY');
    });

    app.get('/wapp', (req, res) => {
      res.status(200).json({ message: "BackEnd for WAPP - Reminder." })
    })


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

    //init client whats-app web 
    await client.initialize();

    //init scheduler
    programador_tareas(client);

  } catch (error) {
    console.log('Error en index', error);
  }
})();


