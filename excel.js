import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import * as logger from "./logger.js";
import * as fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function leer(codigo, archivo) {
	await logger.info(
		"Leyendo archivo " +
			archivo +
			" asociado al código " +
			codigo +
			" (etapa 1/2)"
	);
	let keys;
	let sum = [];
	let formato = false;

	await XLSX.writeFile(
		await XLSX.readFile(__dirname + "/temp/" + archivo),
		__dirname + "/temp/textoPlano.xlsx",
		{ compression: true }
	);
	let res = await XLSX.readFile(__dirname + "/temp/textoPlano.xlsx").Sheets[
		"Detailed Report"
	];
	try {
		keys = Object.keys(res);
	} catch (error) {
		keys = [];
	}

	if (
		res !== undefined &&
		res["A1"].v === "Project" &&
		res["B1"].v === "Client" &&
		res["C1"].v === "Description" &&
		res["D1"].v === "Task" &&
		res["E1"].v === "User" &&
		res["F1"].v === "Group" &&
		res["G1"].v === "Email" &&
		res["H1"].v === "Tags" &&
		res["I1"].v === "Billable" &&
		res["J1"].v === "Start Date" &&
		res["K1"].v === "Start Time" &&
		res["L1"].v === "End Date" &&
		res["M1"].v === "End Time" &&
		res["N1"].v === "Duration (h)" &&
		res["O1"].v === "Duration (decimal)" &&
		res["P1"].v === "Billable Rate (USD)" &&
		res["Q1"].v === "Billable Amount (USD)"
	) {
		formato = true;
	}

	for (let i = 0; i < keys.length; i++) {
		let temp = keys[i].replace(/[^0-9]/g, "");
		if (!isNaN(temp) && !sum.includes(temp)) {
			sum.push(temp);
		} else {
			continue;
		}
	}

	if (!formato || sum.length <= 1) {
		throw new Error(
			"El archivo Excel recibido no es válido o no sigue el formato de un " +
				"reporte de tiempos de Clockify. Por favor, intente con otro archivo."
		);
	}

	await fs.writeFile(
		__dirname + "/temp/" + codigo + ".json",
		JSON.stringify(res)
	);

	await logger.info("Archivo " + archivo + " leído (etapa 1/2)");

	return sum.length;
}

export async function codificar(json, length) {
	await logger.info(
		"Leyendo archivo " +
			json +
			" con un total de " +
			length +
			" celdas (etapa 2/2)"
	);
	let arr = [];
	const res = await JSON.parse(await fs.readFile(json));
	for (let i = 2; i < length; i++) {
		arr.push({
			desarrollador: formatoDato(res[`E${i}`].v),
			cliente: formatoDato(res[`B${i}`].v),
			proyecto: formatoDato(res[`A${i}`].v),
			tags: formatoTags(res[`H${i}`].v),
			fechaInicio: formatoFecha(res[`J${i}`].v),
			duracion: formatoDato(res[`O${i}`].v),
		});
	}
	await logger.info("Archivo " + json + " codificado (etapa 2/2)");
	return arr;
}

function formatoFecha(fecha) {
	if (fecha === ``) {
		return "NULL";
	}
	let day = "";
	let month = "";
	let year = "";
	for (let i = 0; i < fecha.length; i++) {
		if (i < 2) {
			month += fecha.charAt(i);
		} else if (i > 2 && i < 5) {
			day += fecha.charAt(i);
		} else if (i > 5) {
			year += fecha.charAt(i);
		}
	}
	fecha = `"${year}-${month}-${day}"`;
	return fecha;
}

function formatoTags(tag) {
	if (tag === ``) {
		return "NULL";
	}
	let t = ``;
	let st = true;
	for (let i = 0; i < tag.length; i++) {
		if (st == true) {
			if (tag.charAt(i) == `,`) {
				st = false;
			}
			t += tag.charAt(i);
		} else {
			st = true;
		}
	}
	t = `"${t}"`;
	return t;
}

function formatoDato(data) {
	if (data === `` && data !== 0) {
		return "NULL";
	}
	return `"${data}"`;
}
