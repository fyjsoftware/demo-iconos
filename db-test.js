import * as logger from "./logger.js";
import * as mysql from "mysql2/promise";
import * as fs from "fs/promises";

const config = JSON.parse(
  await fs.readFile(new URL("./config.json", import.meta.url))
);

// crea la conexion a la base de datos

const connection = await mysql.createConnection({
  host: config.host,
  user: config.db.usuario,
  password: config.db.password,
  database: config.db.baseDatos,
});

export async function getRow() {
  let [rows, fields] = connection.execute(`SELECT * FROM reporte`);
  //`SELECT * FROM reporte WHERE cliente != ${client};`
  logger.debug(JSON.stringify(rows, null, 4));
}

export async function stop() {
  connection.end();
}

/*var proyecto = "P5";
var cliente = "C4";
var usuario = "Roberto";
var tags = null;
var fechaInicio = "2023-07-13";
var fechaFin = "2023-07-13";
var tiempoInicio = "13:20";
var tiempoFinal = "17:00";
var durecion = null;*/
// FALTA DURACION
//Checar valor null
export async function addRow(
  proyecto,
  cliente,
  usuario,
  tags,
  fechaInicio,
  fechaFin,
  tiempoInicio,
  tiempoFinal,
  durecion
) {
  connection.execute(
    `INSERT INTO reporte (proyecto, cliente, usuario, tags, fechaInicio, fechaFin, tiempoInicio, tiempoFinal) 
    VALUES("${proyecto}", "${cliente}", "${usuario}", null, "${fechaInicio}", "${fechaFin}", "${tiempoInicio}", "${tiempoFinal}")`
  );
}

/*
let [rows, fields] = await connection.execute(`SELECT * FROM reporte`);
logger.debug(JSON.stringify(rows, null, 4));

await connection.end();
*/