import * as logger from "./logger.js";
import * as db from "./database.js";
import express from "express";
import * as fs from "fs/promises";
import session from "express-session";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(
	await fs.readFile(new URL("./config.json", import.meta.url))
);

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));
app.set('views', __dirname + '/views');
app.set("view engine", "ejs");

export async function iniciar() {
    app.get("/", async function (request, response) {
        if (request.session.loggedin) {
            await response.render('home', {
                usuario: request.session.username,
                resultado: await db.mostrar()
            });
        } else {
            await response.sendFile(__dirname + "/static/login.html");
        }
    });

    app.get("/register", async function (request, response) {
        if (request.session.loggedin) {
            await response.send('Ya iniciaste sesión.');
        } else {
            await response.sendFile(__dirname + "/static/register.html");
        }
    });

    app.get('/logout', async function (request, response) {
        await request.session.destroy();
        await response.redirect('/');
    });

    app.post('/auth', async function(request, response) {
        let username = request.body.username;
        let password = await db.convertir(request.body.password);
        if (username && password) {
            let correcto = await db.login(username, password);
            if (correcto) {
                request.session.loggedin = true;
                request.session.username = username;
                await response.redirect('/');
            } else {
                await response.send('Usuario o contraseña incorrecta.');
            }
        } else {
            await response.send('Por favor, ingresa tu usuario y contraseña.');
        }
    });

    app.post('/add', async function(request, response) {
        let username = request.body.username;
        let password = request.body.password;
        let email = request.body.email;
        let validarEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
        if (username && password && email) {
            let existe = await db.existe(username, email);
            if (existe) {
                await response.send('Esta cuenta ya está registrada. Por favor, inicie sesión.');
            } else if (password.length < 8) {
                await response.send('La contraseña ingresada debe tener por lo menos 8 caracteres. Por favor, intente de nuevo.')
            } else if (!validarEmail.test(email)) {
                await response.send('El correo electrónico ingresado no es válido. Por favor, intente de nuevo.');
            } else {
                let exitoso = await db.registrar(username, await db.convertir(password), await db.convertir(email));
                if (exitoso) {
                    await response.send('Su cuenta ha sido registrada. Por favor, regrese a la página de inicio e inicie sesión.');
                } else {
                    await response.send('Ocurrió un error al registrar su cuenta. Por favor, contacte con el administrador.');
                }
            }
        } else {
            await response.send('Por favor, ingrese todos los datos correspondientes.');
        }
    });

    app.listen(config.puertos.http, config.host, async function () {
        logger.info(
            "Servidor web iniciando en " + config.host + ":" + config.puertos.http
        );
    })
}

app.on('error', (err) => {
	throw err;
});