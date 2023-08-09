import * as logger from "./logger.js";
import * as db from "./database.js";
import * as excel from "./excel.js";
import express, { query } from "express";
import multer from "multer";
import * as fs from "fs/promises";
import favicon from "serve-favicon";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(
  await fs.readFile(new URL("./config.json", import.meta.url))
);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));
app.use(favicon(__dirname + "/static/favicon.ico"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

var storage = await multer.diskStorage({
  destination: async function (req, file, callback) {
    callback(null, __dirname + "/temp");
  },
  filename: async function (req, file, callback) {
    callback(null, file.originalname);
  },
});
var upload = await multer({ storage: storage }).single("archivo");

export async function iniciar() {
  app.get("/", async function (request, response) {
    await response.sendFile(__dirname + "/static/upload.html");
  });

  app.get("/:tabla", async function (request, response) {
    try {
      try {
        await fs.stat(__dirname + "/temp/" + request.params.tabla + "_loading");
        await response.render("warning", {
          texto:
            "El reporte ha sido cargado al sistema. Por favor, espere unos minutos a que se termine de subir y revise nuevamente.<br><br><b>Progreso de subida</b>: " +
            (await fs.readFile(
              new URL(
                "./temp/" + request.params.tabla + "_loading",
                import.meta.url
              )
            )),
        });
      } catch (error) {
        if ((error.code = "ENOENT")) {
          let dev =
            request.query.desarrollador !== undefined
              ? request.query.desarrollador
              : null;
          let cliente =
            request.query.cliente !== undefined ? request.query.cliente : null;
          let durTotal = request.query.filtroDur === "on" ? true : false;
          await response.render("data", {
            durTotal: durTotal,
            tabla: request.params.tabla,
            listas: await db.mostrarListas(request.params.tabla),
            resultado: await db.mostrar(
              request.params.tabla,
              { dev: dev, cliente: cliente },
              durTotal
            ),
          });
        } else {
          await response.render("error", {
            error: error,
          });
        }
      }
    } catch (error) {
      if (error.stack.includes("doesn't exist")) {
        await response.render("warning", {
          texto:
            "El reporte al que intenta acceder no existe. Por favor, verifique que haya escrito el enlace correctamente.",
        });
      } else {
        await logger.error(error.stack);
        await response.render("error", {
          error: error,
        });
      }
    }
  });

  app.get("/delete/:tabla", async function (request, response) {
    try {
      await db.eliminar(request.params.tabla);
      await response.redirect("/");
    } catch (error) {
      await logger.error(error.stack);
      await response.render("error", {
        error: error,
      });
    }
  });

  app.post("/upload", async function (request, response) {
    try {
      await upload(request, response, async function (error) {
        if (error) {
          throw error;
        }
        if (!request.file.originalname.endsWith(".xlsx")) {
          throw new Error(
            "El archivo que subió no es un archivo formato Excel. Por favor, intente con otro archivo."
          );
        }
        let codigo = await db.generarCodigo();
        let temp = __dirname + "/temp/" + codigo;
        let length = 0;
        let errored = false;

        try {
          length = await excel.leer(codigo, request.file.originalname);
          await fs.writeFile(temp + "_loading", "0.00%");
          await fs.access(temp + ".json");
          await response.redirect("/" + codigo);
        } catch (error) {
          errored = true;
          if (!response.headersSent) {
            await logger.error(error.stack);
            await response.render("error", {
              error: error,
            });
          }
        }

        try {
          if (!errored)
            await db.crear(
              codigo,
              await excel.codificar(temp + ".json", length)
            );
        } catch (error) {
          if (!response.headersSent) {
            await logger.error(error.stack);
            await response.render("error", {
              error: error,
            });
          }
        }

        await limpiarTemp();
      });
    } catch (error) {
      await logger.error(error.stack);
      if (!response.headersSent) {
        await response.render("error", {
          error: error,
        });
      }
      await limpiarTemp();
    }
  });

  app.listen(config.puertos.http, config.host, async function () {
    await logger.info(
      "Servidor web iniciando en " + config.host + ":" + config.puertos.http
    );
  });
}

app.on("error", (err) => {
  throw err;
});

async function limpiarTemp() {
  const archivos = await fs.readdir(__dirname + "/temp");
  for (const archivo of archivos) {
    await fs.unlink(path.resolve(__dirname + "/temp", archivo));
  }
  await logger.info("Limpieza de la carpeta temporal completa");
}
