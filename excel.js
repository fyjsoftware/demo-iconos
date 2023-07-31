import XLSX from "xlsx";
import path from "path";
import {fileURLToPath} from "url";
import * as logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function leer(archivo) {
  await XLSX.writeFile(await XLSX.readFile(__dirname + "/temp/" + archivo),
                      __dirname + "/temp/compressed.xlsx", { compression: true });
  let res = await XLSX.readFile(__dirname + "/temp/compressed.xlsx").Sheets["Detailed Report"];
  logger.info("Archivo " + archivo + " leído");
  let resLength = Number(res["!ref"].replace(/[^0-9:]/g, '').split(":")[1]) - 1;
  if (res["!ref"].replace(/[^a-z:]/gi, '') !== "A:Q" || resLength <= 0) {
    throw new Error("El archivo Excel que intenta subir no sigue el formato de un reporte de tiempos de Clockify. Por favor, intente con otro archivo.")
  }

  let arr = [];
  for (let i = 2; i <= resLength + 1; i++) {
    arr.push({
      desarrollador: formatoDato(res[`E${i}`].v),
      cliente: formatoDato(res[`B${i}`].v),
      proyecto: formatoDato(res[`A${i}`].v),
      tags: formatoTags(res[`H${i}`].v),
      fechaInicio: formatoFecha(res[`J${i}`].v),
      duracion: formatoDato(res[`O${i}`].v)
    });
  }

  logger.info("Archivo " + archivo + " codificado con éxito");
  return arr;
}

function formatoFecha(fecha) {
    if (fecha == ``) {
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
    if (tag == ``) {
      return "NULL";
    }
    var t = ``;
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
  if (data == `` && data != 0) {
    return "NULL";
  }
  return `"${data}"`;
}