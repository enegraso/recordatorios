const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

async function startAPI() {
     const client = new Client({
        authStrategy: new LocalAuth(),
    });

/*     const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: false, // esta linea abre el navegador cuando es false
        }
    }); */

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

/*     client.on('ready', () => {
        console.log('Client is ready!');
    }); */

    client.on('ready', () => {
        console.clear();
        console.log('Cliente esta Conectado!');
        isReady = true;
    });

    client.on('message', (message) => {
        console.log(message.body);
    });
     
    await client.initialize();

    return client;
}

module.exports = {
    startAPI,
};