import XLSX from "xlsx";
import * as db from "./db-test.js";

/*const wb = XLSX.readFile(
  "Clockify_Time_Report_Detailed_06_01_2023-06_30_2023_1.xlsx"
);
XLSX.writeFile(wb, "compressed.xlsx", { compression: true });*/ // Compresion del Archivo Excel

const wb1 = await XLSX.readFile("compressed.xlsx"); // Archivo a leer
const ws = wb1.Sheets["Detailed Report"]; // Hoja del archivo a leer

var proyecto; // Falta Descripcion
var cliente;
var desarrollador;
var tags;
var fechaIn;
var duracion;

function newArrVal() {
  // Falta Descripcion
  proyecto = [];
  cliente = [];
  desarrollador = [];
  tags = [];
  fechaIn = [];
  duracion = [];
}

function getData(index) {
  // Manda los datos que estan en el indice a los arreglos | Falta descripcion
  proyecto.push(ws[`A${index}`].v);
  cliente.push(ws[`B${index}`].v);
  desarrollador.push(ws[`E${index}`].v);
  tags.push(ws[`H${index}`].v);
  fechaIn.push(ws[`J${index}`].v);
  duracion.push(ws[`O${index}`].v);
}

function simpleSearch(min, max) {
  // Funcion De Busqueda entre 2 valores de todo el excel [El valor  `min` deber ser 2 o mayor ya que es valor de la hoha donde empiezan los datos]
  newArrVal();
  for (let index = min; index < max; index++) {
    getData(index);
  }
  sendData(proyecto, cliente, desarrollador, tags, fechaIn, duracion);
}

function getCurrentIndex() {
  // Cuenta cual es la tupla actual vacia
  var indexVal = 1000;
  var index = indexVal;
  var it = 0;
  while (indexVal > 1) {
    if (
      ws[`J${index}`]?.v != undefined ||
      ws[`K${index}`]?.v != undefined ||
      ws[`L${index}`]?.v != undefined
    ) {
      index = index + indexVal;
    } else {
      indexVal = Math.round(indexVal / 2);
      index = index - indexVal;
    }
    it++;
  }
  console.log("Tuplas totales: " + index + ", Iteraciones: " + it);
  return index;
}

function sendData(...args) {
  // Funcion de prueba para comunicarse con la base de datos
  for (let index = 0; index < proyecto.length; index++) {
    db.addRow(
      parseData(proyecto[index]),
      parseData(cliente[index]),
      parseData(desarrollador[index]),
      parseTags(tags[index]),
      parseDate(fechaIn[index]),
      parseData(duracion[index])
    );
    db.percent(index + 1, proyecto.length - 1);
  }
}

function parseData(data) {
  if (data == `` && data != 0) {
    return null;
  }
  return `"${data}"`;
}

function parseDate(fecha) {
  //Funcion que convierte la fecha en un formato legible de la base de datos
  if (fecha == ``) {
    return null;
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

function parseTime(hora) {
  //Funcion que convierte la hora en un formato legible de la base de datos
  if (hora == ``) {
    return null;
  }
  let hour = "";
  let min = "";
  let period = "";
  let st = true;
  for (let i = hora.length - 1; i >= 0; i--) {
    if (i > hora.length - 3) {
      period += hora.charAt(i);
    } else if (i < hora.length - 3 && i > hora.length - 6) {
      min += hora.charAt(i);
    } else if (i < hora.length - 6) {
      hour += hora.charAt(i);
    }
  }
  hour = hour.charAt(1) + hour.charAt(0);
  min = min.charAt(1) + min.charAt(0);
  if (period.charAt(1) == `P` && hour < 12) {
    hour = parseInt(hour, 10) + 12;
  } else if (period.charAt(1) == `A` && hour == 12) {
    hour = 0;
  }
  hora = `"${hour}:${min}"`;
  return hora;
} // hh:mm

function parseTags(tag) {
  if (tag == ``) {
    return null;
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

function printData(...args) {
  // Funcion de prueba para leer el excel
  // Imprime la informacion dada
  let index = 0;
  for (let index = 0; index < proyecto.length; index++) {
    console.log({
      proyecto: proyecto[index],
      cliente: cliente[index],
      desarrollador: desarrollador[index],
      tags: tags[index],
      fechaIn: fechaIn[index],
      duracion: duracion[index],
    });
  }
}

function getClientProj(client) {
  // Funcion de prueba para leer el excel
  //Obtiene todas las tuplas de un cliente especifico
  newArrVal();
  var index = 2;
  const max = getCurrentIndex();
  while (index < max) {
    if (client == ws[`B${index}`].v) {
      getData(index);
    }
    index++;
  }
  printData(proyecto, cliente, desarrollador, tags, fechaIn, duracion);
}

//getClientProj("Winning Solutions INC");
await simpleSearch(2, getCurrentIndex());
await db.stop();
