const cron = require('node-cron');
const { enviarMensaje } = require('./mensaje.js');
const axios = require("axios")
require('dotenv').config();


const MSG_PANEL = "🤖 Mensaje de *Bot* \n\n" +
    "👋 Hola! Cómo estás? Te aviso que en 48 horas se vence la suscripción de tu panel\n\n" +
    'Si deseas renovar, adquiriendo 💰 paquete de créditos y, no perder el acceso, me avisas y te paso los precios de packs. 💳 Y medios de pago.\n' +
    '\n' +
    '🕘 Horario de atención\n' +
    'Lun a Vie:\n' +
    '9 a 13 y de 16 a 20.\n' +
    'Sab:\n' +
    '10,30 a 13,30 y de 17 a 19.\n' +
    '_Domingos y feriados_ *cerrado*\n\n' +
    'Muchas gracias! 🤝'

const MSG_VENCE = "🤖 Mensaje de *Bot* \n\n" +
    "👋 Hola! Cómo estás? Te aviso que en, aproximadamente, 36 horas vence tu email abono mensual.\n" +
    "Quisieramos saber si desea renovar?\n\n" +
    "*Medios de pago*:\n" +
    "Transferencia *$ 3900* a cualquiera de los siguientes alias CVU:\n" +
    "💸 neura.norma.lemon\n" +
    "💸 fedeveloper\n" +
    "💸  27952878.prex\n" +
    "💸 enegraso.uala\n" +
    "💸 fedeveloperppay\n\n" +
    "En efectivo *$ 3900* en En efectivo en Rapipago a cuenta PREX número 10408748\n\n" +
    "Link de pago *$ 4300*:\n" +
    "https://mpago.la/1fbsuzx (incluye comisiones)\n\n" +
    "Transferencia *$ 3900* a cualquiera de los siguientes alias CBU:\n" +
    "🏦 fedevelopernx\n" +
    "🏦 fedeveloperdni\n\n" +
    "Si su medio de pago *solicita referencia escrita*, por favor, escribir *webmail* o *correo electrónico*\n\n" +
    "*Siempre confirmar pago, enviando el comprobante*.\n\n" +
    "📧 Si se vence la cuenta, se perderá el acceso hasta su regeneración.\n\n" +
    "🕘 Horario de atención \n" +
    "Lun a Vie:\n" +
    "9 a 13 y de 16 a 20.\n" +
    "Sab: \n" +
    "10,30 a 13,30 y de 17 a 19.\n" +
    "_Domingos y feriados_ *cerrado*\n\n" +
    "Si ya abonó, por favor avísenos y disculpe la molestia.\n\n" +
    "Muchas gracias. 🤝"

function programador_tareas(cliente) {
    const tiempo = '0 30 10 * * *' //  ;'0 20 13 * * *' '*/2  * * * *'
    if (cron.validate(tiempo)) {
        console.log('Cron inicializado');
        cron.schedule(tiempo, async () => {
            try {
                var datetime = new Date();
                var dia = {
                    diaavisa: datetime.toISOString().slice(8, 10)
                }
                var venci = datetime.toISOString().slice(2, 4) + datetime.toISOString().slice(5, 7)
                console.log(venci)
                var url = `${process.env.API_HOOK}webhooks/google`
                // console.log(url + " " + dia);
                // With Axios
                await axios.post(url, dia)
                    .then((response) => {
                        // console.log(response.data)
                        response.data.map(async i => {
                            var CONTACTOCEL = ""
                            if (i.celu.slice(0, 2) === "54") { CONTACTOCEL = i.celu.slice(0, 2) + "9" + i.celu.slice(2, 12) + '@c.us' }
                            else { CONTACTOCEL = i.celu + '@c.us' }
                            console.log(CONTACTOCEL)
                            if (i.rol === "final") {
                                console.log(i.pago <= venci, i.pago, venci)
                                if (i.pago <= venci || !i.pago) {
                                    const saludo = MSG_VENCE + "\n\n Cuenta" + i.cuenta // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                    await enviarMensaje(cliente, CONTACTOCEL, saludo);
                                    console.log('Mensaje enviado final');
                                }
                            } else if (i.rol === "Referido") {
                                console.log(i.pago <= venci, i.pago, venci)
                                if (i.pago <= venci || !i.pago) {
                                    const saludo = MSG_PANEL // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                    await enviarMensaje(cliente, CONTACTOCEL, saludo);
                                    console.log('Mensaje enviado REFERIDO');
                                }
                            }
                        })
                    })
                    .catch((error) => console.log(error));

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