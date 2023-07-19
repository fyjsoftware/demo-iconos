import * as mysql from "mysql2/promise";
import * as fs from "fs/promises";
import { sha512 } from "js-sha512";

const config = JSON.parse(
	await fs.readFile(new URL("./config.json", import.meta.url))
);

const database = await mysql.createConnection({
    host: config.host,
    port: config.puertos.db,
    user: config.db.usuario,
    password: config.db.password,
    database: config.db.baseDatos
});

export async function login(usuario, password) {
    const [resultados] = await database.execute('SELECT * FROM login WHERE usuario = ? AND password = ?',
        [usuario, password]);
    if (resultados.length > 0) {
        return true;
    } else {
        return false;
    }
}

export async function existe(usuario, email) {
    const [resultadosEmail] = await database.execute('SELECT * FROM login WHERE email = ?',
        [email]);
    const [resultadosUsuario] = await database.execute('SELECT * FROM login WHERE usuario = ?',
        [usuario]);
    if (resultadosEmail.length > 0 || resultadosUsuario.length > 0) {
        return true;
    } else {
        return false;
    }
}

export async function registrar(usuario, password, email) {
    await database.execute('INSERT INTO login (id, usuario, password, email) values (NULL, ?, ?, ?)',
        [usuario, password, email]);
    if (await existe(usuario, email)) {
        return true;
    } else {
        return false;
    }
}

export async function mostrar() {
    const [resultados] = await database.execute('SELECT * from reporte');
    let newR = resultados;
    for (var i = 0; i < newR.length; i++) {
        newR[i].tags = (newR[i].tags === null ? "" : newR[i].tags.replaceAll(",", "<br>"));
        newR[i].fechaInicio = newR[i].fechaInicio.toLocaleDateString("en-US");
        newR[i].fechaFin = newR[i].fechaFin.toLocaleDateString("en-US");
        newR[i].tiempoInicio = new Date(resultados[i].fechaInicio + ", " + newR[i].tiempoInicio).toLocaleTimeString("en-US",
            {hour: '2-digit', minute: '2-digit'});
        newR[i].tiempoFinal = new Date(resultados[i].fechaFin + ", " + newR[i].tiempoFinal).toLocaleTimeString("en-US",
            {hour: '2-digit', minute: '2-digit'});
        newR[i].duracion = new Date("1970-01-01, " + newR[i].duracion).toLocaleTimeString("es-MX",
            {hour: '2-digit', minute: '2-digit'});
    }
    return newR;
}

export async function convertir(str) {
    return await sha512(str);
}