const cron = require('node-cron');
const { enviarMensaje } = require('./mensaje.js');
const axios = require("axios")
require('dotenv').config();
const precio = process.env.PRECIO
const precioml = process.env.PRECIOML
const linkml = process.env.LINKML
const preciodni = process.env.PRECIODNI
const linkdni = process.env.LINKDNI
const horario = process.env.HORA
const idinsta = process.env.INSTANCE
const autor = process.env.AUTOR
const dev = process.env.NODE_ENV

function programador_tareas() {
    // variables para obtener ruta actual
    const fs = require('fs')/* .promises */;
    const path = require('path');
    const filePath = path.join(__dirname, 'horario.txt');

    const dayjs = require("dayjs");
    const utc = require("dayjs/plugin/utc");
    const timezone = require("dayjs/plugin/timezone");
    const customParseFormat = require("dayjs/plugin/customParseFormat");
    const isBetween = require("dayjs/plugin/isBetween");

    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(customParseFormat);
    dayjs.extend(isBetween);

    const TZ = "America/Argentina/Buenos_Aires";

    function leerHorario() {
        const contenido = fs.readFileSync(filePath, "utf-8").split("\n");
        const fechaEspecial = contenido[0].trim();
        const mensajeExtra = contenido.slice(2).join("\n").trim()
        const mensajeHora = contenido.slice(4).join("\n").trim()
        return { fechaEspecial, mensajeExtra, mensajeHora };
    }

    const hoy = dayjs().tz(TZ).format("DD/MM"); // dayjs().format("DD/MM");

    // Define a JavaScript function called lastday with parameters y (year) and m (month)
    var lastday = function (y, m) {
        // Create a new Date object representing the last day of the specified month
        // By passing m + 1 as the month parameter and 0 as the day parameter, it represents the last day of the specified month
        return new Date(y, m + 1, 0).getDate();
    }

    const { fechaEspecial, mensajeExtra, mensajeHora } = leerHorario();
    const respuestafinal = hoy > fechaEspecial ? mensajeHora : hoy === fechaEspecial ? `Hoy *cerrado* \n\n${mensajeExtra} \n\n${mensajeHora}` : fechaEspecial.length < 2 ? mensajeHora : "Día " + fechaEspecial + " *CERRADO*\n\n" + mensajeHora

    const MSG_VENCE_AGO = "🤖 Mensaje de *Bot*: \n\n" +
        "👋 Hola -NB- app ♾️Mul7ivisi0nPl4y!\n" +
        "Y -CINE- app 🎬🎞️📽️📺 *de regalo*. \n Cómo estás? Aproximadamente en *50 horas* vence tu abono\nDesearía renovar?\n\n" +
        "Precio *$ 12000* y medios de pago: *👉 https://bit.ly/s2kmail 👈* (tap/presionar en el enlace) \n\n" +
        "🎅 _*PROMO FIESTAS*_ *3mx25000* Consultanos! \n\n" +
        "Enterate antes: Novedades, actualizaciones de app/precios en 📢 Canal WA: bit.ly/canalwamp \n\n" +
        "*Envíe comprobante de pago*, luego de hacerlo. \n" +
        "📧 Si se vence la cuenta, se perderá el acceso hasta su regeneración. " +
        "Renovaciones y Regeneraciones de cuentas *UNICAMENTE EN HORARIO DE ATENCIÓN* \n\n" +
        respuestafinal + "-VTO-" +
        "Si ya abonó, por favor avísenos y disculpe la molestia.\n\n" +
        "Muchas gracias. 🤝"


    const MSG_PANEL = "🤖 Mensaje de *Bot*: \n\n" +
        "👋 Hola -NB-! Cómo estás? Te aviso que en *3 dias* se vence la suscripción de tu *panel ♾️Mul7ivisi0nPl4y y panel 🐦‍🔥fen1x-cin3📽️ \n" +
        'Si deseas renovar, adquiriendo 💰 paquete de créditos y, no perder el acceso.\n\n' +
        "Importes y 💳 medios de pago en el siguiente link: \n" +
        "👉 https://bit.ly/s2krefer 👈 (tap/presionar en el enlace) \n\n" +
        respuestafinal +
        'Muchas gracias! 🤝'

    const MSG_PANEL_CF = "🤖 Mensaje de *Bot* \n\n" +
        "👋 Hola -NB-! Cómo estás? Te aviso que en *3 horas* se vence la suscripción de tu panel 📽️🚀🧑‍🚀\n\n" +
        'Si deseas renovar, adquiriendo 💰 paquete de créditos y, no perder el acceso.\n' +
        '\n' +
        "Importes y 💳 medios de pago en el siguiente link: \n" +
        "👉 https://bit.ly/cfrefer 👈 (tap/presionar en el enlace) \n\n" +
        respuestafinal +
        'Muchas gracias! 🤝'

    const MSG_VENCE_CF = "🤖 Mensaje de *Bot* \n\n" +
        "👋 Hola -NB-! Cómo estás? Te aviso que en, aproximadamente, *3 dias* vence tu email abono mensual 🚀🧑‍🚀.\n" +
        "Quisieramos saber si desea renovar?\n\n" +
        "*Medios de pago*:\n" +
        "Transferencia *$ -PRE-* a cualquiera de los siguientes alias *CVU*:\n" +
        "💸 neura.norma.lemon\n" +
        "💸 fedeveloper\n" +
        "💸 27952878.prex\n" +
        "💸 enegraso.uala\n" +
        "💸 fedeveloperbelo\n" +
        "💸 fedeveloperppay\n" +
        "💸 fedevelopercpay\n" +
        "💸 fedevelopypf\n\n" +
        "Transferencia *$ -PRE-* a cualquiera de los siguientes alias *CBU*:\n" +
        "🏦 fedevelopernx\n" +
        "🏦 fedeveloperdni\n\n" +
        "En efectivo *$ -PRE-* en En efectivo en Rapipago a cuenta PREX número 10408748\n\n" +
        "Si su medio de pago *solicita referencia escrita*, por favor, escribir *webmail* o *correo electrónico*\n\n" +
        "*Siempre confirmar pago, enviando el comprobante*.\n\n" +
        "📧 Si se vence la cuenta, se perderá el acceso hasta su actualización.\n\n" +
        respuestafinal +
        "Si ya abonó, por favor avísenos y disculpe la molestia.\n\n" +
        "Muchas gracias. 🤝"

    const MSG_VENCE_AE = "🤖 Mensaje de *Bot* \n\n" +
        "👋 Hola -NB-! Cómo estás? Te aviso que en *3 dias* se vence la suscripción de tu abono mensual 📽️📺\n\n" +
        'Si deseas renovar y, no perder el acceso, me avisas y te paso precio actual. 💳 Y medios de pago.\n' +
        '\n' +
        respuestafinal +
        'Muchas gracias! 🤝'

    const MSG_NEW_APP = "👋 Hola! Como estás?\n" +
        "Te comento que hemos lanzado nuestra nueva app 📲x-player con muchas mejoras y novedades.\n\n" +
        "Te dejo el link para que la puedas descargar e instalar: 👉 https://www.xplayer.top/app 👈 (tap/presionar en el enlace) \n\n" +
        "O, descarga con Código Downloader: 803159\n\n" +
        "Para iniciar prueba: ingresa codigo de vendedor: 3016.\n\n" +
        "Cualquier duda o consulta, estoy a tu disposición.\n\n" +
        "Muchas gracias! 🤝"

    const tiempo = horario // '0 56 11 * * *' // Everyday at 10:30 AM
    if (cron.validate(tiempo)) {
        console.log('Cron inicializado');

        cron.schedule(tiempo, async () => {
            console.log('Cron ejecutado a las', new Date().toLocaleString());
            try {
                var datetime = new Date();
                // diadeaviso = 2 digitos, si es menor a 10 le agrego un 0 adelante (tomads de la fecha actual)
                var diadeaviso = datetime.toISOString().slice(8, 10) < 10 ? datetime.toISOString().slice(9, 10) : datetime.toISOString().slice(8, 10)
                // venci = dia y mes de vencimiento 4 digitos (tomado de la fecha actual)
                var venci = datetime.toISOString().slice(2, 4) + datetime.toISOString().slice(5, 7)
                var seavisa
                console.log("dia de aviso", diadeaviso, "vencimiento", venci, "diatime", datetime.toISOString().slice(0, 10))
                if (datetime.getMonth() === 1) {
                    var ultimodia = lastday(2025, 1)
                    if (ultimodia === 28) {
                        seavisa = parseInt(diadeaviso) + 3
                    } else if (ultimodia === 29) {
                        seavisa = parseInt(diadeaviso) + 2
                    }
                }
                diadeaviso = seavisa
                console.log("dia de aviso", diadeaviso, "vencimiento", venci, "diatime", datetime.toISOString().slice(0, 10))
                console.log(diadeaviso, seavisa)
                console.log(datetime.getMonth())
                var dia = {
                    diaavisa: diadeaviso
                }
                console.log("vencimiento", venci)
                console.log("dia de aviso", dia.diaavisa)
                console.log("dia vencimiento", dia)
                var url = `${process.env.API_HOOK}webhooks/google`
                // console.log(url + " " + dia);
                // With Axios
                if (dev === "production") {
                    await axios.post(url, dia)
                        .then((response) => {
                            // console.log(response.data)
                            response.data.map(async i => {
                                var CONTACTOCEL = ""
                                if (i.celu.slice(0, 2) === "54") { CONTACTOCEL = i.celu + '@c.us' }
                                else { CONTACTOCEL = i.celu + '@c.us' }
                                var CONTACTOPROP = ""
                                if (i.propio.slice(0, 2) === "54") { CONTACTOPROP = i.propio + '@c.us' }
                                else { CONTACTOPROP = i.propio + '@c.us' }
                                console.log(CONTACTOCEL)
                                if (i.rol === "final") {
                                    console.log(i.pago <= venci, i.pago, venci)
                                    if (i.pago <= venci || !i.pago || i.pago === "") {
                                        let saludo = MSG_VENCE_AGO.replaceAll("-NB-", i.cuenta)  // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                        saludo = saludo.replaceAll("-PRE-", precio)
                                        saludo = saludo.replaceAll("-PREML-", precioml)
                                        saludo = saludo.replaceAll("-LML-", linkml)
                                        saludo = saludo.replaceAll("-PREDNI-", preciodni)
                                        saludo = saludo.replaceAll("-LDNI-", linkdni)
                                        saludo = saludo.replaceAll("-VTO-", i.nombre)
                                        saludo = saludo.replaceAll("-CINE-", i.cin3 === "no" ? "NO POSEE" : i.cin3)
                                        let destino = ""
                                        if (i.nombre > venci /* || !i.nombre || i.nombre === "" */) {
                                            destino = CONTACTOPROP
                                        } else {
                                            destino = CONTACTOCEL
                                        }
                                        const params = {
                                            chatId: destino,
                                            message: saludo
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
                                        // await enviarMensaje(cliente, CONTACTOCEL, saludo);

                                    }
                                } else if (i.rol === "Referido") {
                                    console.log(i.pago <= venci, i.pago, venci)
                                    if (i.pago <= venci || !i.pago) {
                                        const hoy = new Date();

                                        // Definimos límite: 30/09/2025 23:59:59
                                        const limite = new Date(2025, 8, 30, 23, 59, 59);
                                        // Ojo: en JS los meses arrancan en 0 → septiembre es 8

                                        let mensaje1 = "🤖 Mensaje de *Bot*: \n\n" +
                                            "👋 Hola -NB-! Cómo estás? Te aviso que en *3 dias* se vence la suscripción de tu *panel ♾️Mul7ivisi0nPl4y y panel 🐦‍🔥fen1x-cin3📽️ \n" +
                                            'Si deseas renovar, adquiriendo 💰 paquete de créditos y, no perder el acceso. ' +
                                            "O, si tienes muchos créditos, abonando el canon mensual de $ 45000, que se te volverá a vencer el 10/11/2025. Y en este lapcso de tiempo compras créditos si necesitas. \n\n" +
                                            "Importes y 💳 medios de pago en el siguiente link: \n" +
                                            "👉 https://bit.ly/s2krefer 👈 (tap/presionar en el enlace) \n\n" +
                                            respuestafinal +

                                            "Enterate antes: Novedades, actualizaciones de app/precios en 📢 Canal WA: 👉 https://bit.ly/canalsel 👈 (tap/presiona en enlace) \n\n" +
                                            'Muchas gracias! 🤝';
                                        let mensaje2 = "🤖 Mensaje de *Bot*: \n\n" +
                                            "👋 Hola -NB-! Cómo estás? Te aviso que en *3 dias* se vence la suscripción de tu *panel ♾️Mul7ivisi0nPl4y y panel 🐦‍🔥fen1x-cin3📽️ \n" +
                                            "El abono del canon mensual es de $ 45000. Y si deseas comprar créditos, puedes hacerlo o cuando lo necesites. \n\n" +
                                            "Importes y 💳 medios de pago en el siguiente link: \n" +
                                            "👉 https://bit.ly/s2krefer 👈 (tap/presionar en el enlace) \n\n" +
                                            respuestafinal +
                                            "Enterate antes: Novedades, actualizaciones de app/precios en 📢 Canal WA: 👉 https://bit.ly/canalsel 👈 (tap/presiona en enlace) \n\n" +
                                            'Muchas gracias! 🤝';
                                        let mensaje = ""
                                        if (hoy <= limite) {
                                            mensaje = mensaje1
                                        } else {
                                            mensaje = mensaje2
                                        }

                                        let saludo = mensaje.replaceAll("-NB-", i.cuenta) // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                        const params = {
                                            chatId: CONTACTOCEL,
                                            message: saludo
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
                                            .then(response => console.log(response))
                                            .catch(err => console.error(err));

                                        // await enviarMensaje(cliente, CONTACTOCEL, saludo);
                                        console.log('Mensaje enviado REFERIDO');
                                    }
                                } else if (i.rol === "CFP") {
                                    console.log(i.pago <= venci, i.pago, venci)
                                    if (i.pago <= venci || !i.pago) {
                                        let saludo = MSG_PANEL_CF.replaceAll("-NB-", i.cuenta) // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                        const params = {
                                            chatId: CONTACTOCEL,
                                            message: saludo
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
                                            .then(response => console.log(response))
                                            .catch(err => console.error(err));

                                        // await enviarMensaje(cliente, CONTACTOCEL, saludo);
                                        console.log('Mensaje enviado REFERIDO');
                                    }
                                } else if (i.rol === "cflix") {
                                    console.log(i.pago <= venci, i.pago, venci)
                                    if (i.pago <= venci || !i.pago) {
                                        let saludo = MSG_VENCE_CF.replaceAll("-NB-", i.cuenta)  // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                        saludo = saludo.replaceAll("-PRE-", "$ 4500")
                                        // console.log(saludo)
                                        const params = {
                                            chatId: CONTACTOCEL,
                                            message: saludo
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
                                        // await enviarMensaje(cliente, CONTACTOCEL, saludo);

                                    }
                                } else if (i.rol === "AES") {
                                    console.log(i.pago <= venci, i.pago, venci)
                                    if (i.pago <= venci || !i.pago) {
                                        let saludo = MSG_VENCE_AE.replaceAll("-NB-", i.cuenta)  // MSG_SALUDOS[Math.floor(Math.random() * MSG_SALUDOS.length)];
                                        // console.log(saludo)
                                        const params = {
                                            chatId: CONTACTOCEL,
                                            message: saludo
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
                                        // await enviarMensaje(cliente, CONTACTOCEL, saludo);
                                    }
                                }
                            })
                        })
                        .catch((error) => console.log(error));
                }
            } catch (error) {
                console.log('Error en cron', error);
            }
        });
    } else {
        console.log("tiempo no validado")
    }
}


async function envio_anuncio_all(cliente, message, canal) {
    try {
        console.log(message)
        console.log(canal)
        var url = `${process.env.API_HOOK}webhooks/google/all`
        var enviados = 0
        var numerror = 0

        // tomo todos loa contactos de la api de Google
        await axios.get(url)
            .then((response) => {
                response.data.map(async i => {
                    var CONTACTOCEL = ""
                    if (i.rol === canal) {
                        if (i.celu && (i.celu.length >= 11 && i.celu.length <= 13)) {
                            if (i.celu.slice(0, 2) === "54") {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            else {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            const saludo = message
                            // await enviarMensaje(cliente, CONTACTOCEL, saludo);
                            console.log('Mensaje a ' + i.celu + " - " + saludo);
                            enviados += 1
                        } else {
                            console.log("numero erroneo" + i.celu)
                            numerror += 1
                        }
                    }

                })
                console.log("Mensajes enviados: " + enviados)
                console.log("Mensajes no enviados: " + numerror)
                return true
            })
            .catch((error) => {
                console.log(error)
                return false
            });

    } catch (error) {
        console.log('Error en mensajeria masiva: ', error);
        return false
    }
}

async function envio_anuncio_active(cliente, message, canal) {
    try {
        console.log(message)
        console.log(canal)

        var url = `${process.env.API_HOOK}webhooks/google/active`
        var enviados = 0
        var numerror = 0

        await axios.get(url)
            .then((response) => {
                response.data.map(async i => {
                    var CONTACTOCEL = ""
                    if (i.rol === canal) {
                        if (i.celu && (i.celu.length >= 11 && i.celu.length <= 13)) {
                            if (i.celu.slice(0, 2) === "54") {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            else {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            const saludo = message
                            await enviarMensaje(cliente, CONTACTOCEL, saludo);
                            console.log('Mensaje a ' + i.celu + " - " + saludo);
                            enviados += 1
                        } else {
                            console.log("numero erroneo" + i.celu)
                            numerror += 1
                        }
                    }

                })
                console.log("Mensajes enviados: " + enviados)
                console.log("Mensajes no enviados: " + numerror)
                return true
            })
            .catch((error) => console.log(error));

        console.log("Mensajes enviados: " + enviados)
        console.log("Mensajes no enviados: " + numerror)

    } catch (error) {
        console.log('Error en mensajeria masiva: ', error);
    }
}

async function envio_anuncio_inactive(cliente, message, canal) {
    try {
        console.log(message)
        console.log(canal)

        var url = `${process.env.API_HOOK}webhooks/inactive`
        var enviados = 0
        var numerror = 0

        await axios.get(url)
            .then((response) => {
                response.data.map(async i => {
                    var CONTACTOCEL = ""
                    if (i.rol === canal) {
                        if (i.celu && (i.celu.length >= 11 && i.celu.length <= 13)) {
                            if (i.celu.slice(0, 2) === "54") {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            else {
                                CONTACTOCEL = i.celu + '@c.us'
                            }
                            const saludo = message
                            await enviarMensaje(cliente, CONTACTOCEL, saludo);
                            console.log('Mensaje a ' + i.celu + " - " + saludo);
                            enviados += 1
                        } else {
                            console.log("numero erroneo" + i.celu)
                            numerror += 1
                        }
                    }

                })
                console.log("Mensajes enviados: " + enviados)
                console.log("Mensajes no enviados: " + numerror)
                return true
            })
            .catch((error) => console.log(error));
        console.log("Mensajes enviados: " + enviados)
        console.log("Mensajes no enviados: " + numerror)

    } catch (error) {
        console.log('Error en mensajeria masiva: ', error);
    }
}

module.exports = {
    programador_tareas,
    envio_anuncio_all,
    envio_anuncio_active,
    envio_anuncio_inactive
};
