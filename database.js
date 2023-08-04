import * as logger from "./logger.js";
import * as mysql from "mysql2/promise";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const config = JSON.parse(
	await fs.readFile(new URL("./config.json", import.meta.url))
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function conexion() {
    return await mysql.createConnection({
        host: config.testing ? config.hostSecundario : config.host,
        port: config.puertos.db,
        user: config.db.usuario,
        password: config.db.password,
        database: config.db.baseDatos
    });;
}

export async function mostrar(tabla, query) {
    let filtro = "";
    if (query.dev !== null && query.cliente === null) {
        filtro = " WHERE desarrollador = \"" + query.dev + "\"";
    }
    if (query.cliente !== null && query.dev === null) {
        filtro = " WHERE cliente = \"" + query.cliente + "\"";
    }
    if (query.dev !== null && query.cliente !== null) {
        filtro = " WHERE desarrollador = \"" + query.dev + "\" AND cliente = \"" + query.cliente + "\"";
    }
    let database = await conexion();
	const [resultados] = await database.execute("SELECT * from " + tabla + filtro + ";");
	let newR = resultados;
    await database.end();
	for (let i = 0; i < newR.length; i++) {
		newR[i].tags =
			newR[i].tags === null ? "" : newR[i].tags.replaceAll(",", "<br>");
		newR[i].fechaInicio =
			newR[i].fechaInicio === null
				? ""
				: newR[i].fechaInicio.toLocaleDateString("en-US");
	}
	return newR;
}

export async function mostrarListas(tabla) {
    let database = await conexion();
    const [devs] = await database.execute("SELECT DISTINCT desarrollador FROM " + tabla + ";");
    const [clientes] = await database.execute("SELECT DISTINCT cliente FROM " + tabla + ";");
    await database.end();
    let arr1 = [];
    let arr2 = [];
    for (let dev of devs) {
        if (dev !== "") arr1.push(dev.desarrollador);
    }
    for (let cliente of clientes) {
        if (cliente !== "") arr2.push(cliente.cliente);
    }
	return { devs: JSON.stringify(arr1), clientes: JSON.stringify(arr2) };
}

export async function crear(tabla, json) {
    let database = await conexion();
	await database.execute(`
    CREATE TABLE IF NOT EXISTS \`sistema\`.\`${tabla}\` (
        \`idReporte\` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`desarrollador\` VARCHAR(50) NULL DEFAULT NULL,
        \`cliente\` VARCHAR(50) NULL DEFAULT NULL,
        \`proyecto\` VARCHAR(50) NULL DEFAULT NULL,
        \`tags\` SET('Interno', 'Junta', 'Soporte', 'Diseño', 'Actualización',
        'Análisis', 'Revisión', 'Desarrollo', 'Daily', 'Correos',
        'Administración', 'Bug (SubTarea)', 'Pruebas', 'Documentación',
        'Llamada', 'Cotizaciones', 'Investigación', 'Merge', 'Capacitación',
        'Vacaciones', 'Madrugada')
        NULL DEFAULT NULL,
        \`fechaInicio\` DATE NULL DEFAULT NULL,
        \`duracion\` DECIMAL(4,2) NULL DEFAULT NULL,
        PRIMARY KEY (\`idReporte\`))
      ENGINE = InnoDB
      DEFAULT CHARACTER SET = utf8mb4
      COLLATE = utf8mb4_0900_ai_ci
      COMMENT = 'Tabla generada automáticamente por el Proyecto ICONOS.';
      `);
	logger.info(
		"Tabla creada en base de datos: " +
			tabla +
			", datos a agregar: " +
			json.length
	);
	for (let i = 0; i < json.length; i++) {
		await database.execute(`INSERT INTO ${tabla} (idReporte, desarrollador,
            cliente, proyecto, tags, fechaInicio, duracion)
        VALUES (NULL, ${json[i].desarrollador}, ${json[i].cliente},
            ${json[i].proyecto}, ${json[i].tags}, ${json[i].fechaInicio},
            ${json[i].duracion});`);
		await fs.writeFile(
			__dirname + "/temp/" + tabla + "_loading",
			parseFloat((i / json.length) * 100).toFixed(2) + "%"
		);
	}
    await database.end();
	logger.info("Adición de datos a la tabla " + tabla + " terminada");
}

export async function eliminar(tabla) {
    let database = await conexion();
	await database.execute(`DROP TABLE \`sistema\`.\`${tabla}\`;`);
    await database.end();
	logger.info("Tabla eliminada: " + tabla);
}

export async function generarCodigo() {
	let temp = Math.random().toString(36).slice(2);
	return temp.substring(temp.length - 5);
}
