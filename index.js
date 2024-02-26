// reminder's scheduler
const { programador_tareas } = require('./src/programador.js');

const express = require('express');
const morgan = require('morgan');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

// const qrcode = require('qrcode-terminal');
const QRcode = require('qrcode');


const app = express();
// app.use(cors()); // uso de cors definido anteriormente
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));

// Reemplaza CONTACTO en programador.js por tu número de celular
(async () => {
  try {
    // Listening for the server
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));

    const client = new Client({
      authStrategy: new LocalAuth(),
    });

    // Add this after express code but before starting the server

    client.on('qr', (qr) => {
      // NOTE: This event will not be fired if a session is specified.
      console.log('QR RECEIVED', qr);

      //probando mio
      app.get('/getqr', async (req, res) => {
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

    //init client whats-app web 
    await client.initialize();

    //init scheduler
    programador_tareas(client);

  } catch (error) {
    console.log('Error en index', error);
  }
})();


