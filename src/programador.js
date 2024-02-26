const cron = require('node-cron');
const { enviarMensaje } = require('./mensaje.js');
const axios = require("axios")

const CONTACTO = '5492342513085@c.us'
const MSG_SALUDOS = [
    'Hola Fede, mensaje automatico a las 15:35, ¿cómo amaneció?'
]

function programador_tareas(cliente) {
    const tiempo = '0 30 10 * * *' // '0 58 18 * * *';
    if (cron.validate(tiempo)) {
        console.log('Cron inicializado');
        cron.schedule(tiempo, async () => {
            try {
                const saludo = MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                await enviarMensaje(cliente, CONTACTO, saludo);
                console.log('Mensaje enviado');
            } catch (error) {
                console.log('Error en cron', error);
            }
        });
    } else {
        console.log("tiempo no validado")
    }
}

module.exports = {
    programador_tareas,
};