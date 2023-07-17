import * as logger from "./logger.js";
import * as server from "./server.js";

import * as fs from "fs/promises";

const config = JSON.parse(
	await fs.readFile(new URL("./config.json", import.meta.url))
);

process.title = "Proyecto ICONOS";

try {
	logger.info(
		"Configuración establecida:\n\n" + JSON.stringify(config, null, 4)
	);
	
	await server.iniciar();
} catch (e) {
	logger.error(
		e.stack +
			"\n\nError de inicialización. El programa no continuará con su " +
			"ejecución."
	);
	process.exit(1);
}
