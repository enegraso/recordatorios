const cron = require('node-cron');
const { enviarMensaje } = require('./mensaje.js');

const CONTACTO = '5492342463902@c.us'
const MSG_SALUDOS = [
    'Hola Amor, mensaje automatico a las 15:35, ¿cómo amaneció?',
    'Hola Amor, mensaje automatico a las 15:35, ¿cómo está?',
    'Hola Amor, mensaje automatico a las 15:35, ¿cómo le va?',
]

function programador_tareas(cliente) {
    const tiempo = '0 35 15 * * *' // '0 58 18 * * *';
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