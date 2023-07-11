const XLSX = require("xlsx");

/*const wb = XLSX.readFile(
  "Clockify_Time_Report_Detailed_06_01_2023-06_30_2023_1.xlsx"
);
XLSX.writeFile(wb, "compressed.xlsx", { compression: true });*/ // Compresion del Archivo Excel

const wb1 = XLSX.readFile("compressed.xlsx"); // Archivo a leer
const ws = wb1.Sheets["Detailed Report"]; // Hoja del archivo a leer

var proyecto;
var cliente;
var usuario;
var tags;
var fechaIn;
var horaIn;
var duracion;

function newArrVal() {
  proyecto = [];
  cliente = [];
  usuario = [];
  tags = [];
  fechaIn = [];
  horaIn = [];
  duracion = [];
}

function getData(index) {
  // Manda los datos que estan en el indice a los arreglos
  proyecto.push(ws[`A${index}`].v);
  cliente.push(ws[`B${index}`].v);
  usuario.push(ws[`E${index}`].v);
  tags.push(ws[`H${index}`].v);
  fechaIn.push(ws[`J${index}`].v);
  horaIn.push(ws[`K${index}`].v);
  duracion.push(ws[`N${index}`].v);
}

function simpleSearch(min, max) {
  // Funcion De Busqueda entre 2 valores de todo el excel [El valor  `min` deber ser 2 o mayor ya que es valor de la hoha donde empiezan los datos]
  newArrVal();
  for (let index = min; index < max; index++) {
    getData(index);
  }
  printData(proyecto, cliente, usuario, tags, fechaIn, horaIn, duracion);
}

function getClientProj(client) {
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
  printData(proyecto, cliente, usuario, tags, fechaIn, horaIn, duracion);
}

function getCurrentIndex() {
  // Cuenta cual es la tupla actual vacia
  var indexVal = 1000;
  var index = indexVal;
  var it = 0;
  var a1;
  var a2;
  var a3;
  while (indexVal > 1) {
    /*a1 = ws[`J${index}`]?.v;
    a2 = ws[`K${index}`]?.v;
    a3 = ws[`L${index}`]?.v;*/
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

function printData(...args) {
  // Imprime la informacion dada
  let index = 0;
  for (let index = 0; index < proyecto.length; index++) {
    console.log({
      proyecto: proyecto[index],
      cliente: cliente[index],
      usuario: usuario[index],
      tags: tags[index],
      fechaIn: fechaIn[index],
      horaIn: horaIn[index],
      duracion: duracion[index],
    });
  }
}

//getCurrentIndex();
//simpleSearch(2, 12);
getClientProj("Winning Solutions INC");
