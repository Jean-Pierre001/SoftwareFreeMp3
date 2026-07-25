const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil.js")
const path = require("path")
const fs = require("fs")
// Corrección de importación común para archiver en entornos Node
const archiver = require("archiver")
const { DOWNLOADS_PATH } = require("../config/config.js")

const { exec } = require("child_process")

const { ColorLogs } = require("../utils/colorLogs.util.js")

// Función definitiva usando el comando nativo 'tar' de Windows
const zipFolder = (sourceDir, outPath) => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toLocaleTimeString()
        console.log(`${ColorLogs.gray}[${timestamp}]${ColorLogs.reset} ${ColorLogs.bgYellow}${ColorLogs.black}${ColorLogs.bold} COMPRESIÓN ${ColorLogs.reset} ${ColorLogs.yellow}${ColorLogs.bold}Iniciando compresión nativa del sistema...${ColorLogs.reset}`)
        
        // Obtenemos solo el nombre de la carpeta a zipear y el directorio base
        const baseDir = path.dirname(sourceDir);
        const folderName = path.basename(sourceDir);
        const zipName = path.basename(outPath);

        console.log(`${ColorLogs.gray}┌── Directorio base:${ColorLogs.reset} ${ColorLogs.cyan}${baseDir}${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}├── Carpeta origen:${ColorLogs.reset}  ${ColorLogs.bold}${folderName}${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}└── Archivo salida:${ColorLogs.reset}  ${ColorLogs.green}${zipName}${ColorLogs.reset}`)

        // Ejecutamos 'tar' de Windows. 
        // -a fuerza a que determine el formato por la extensión (.zip)
        // -c crea un nuevo archivo
        // -f especifica el nombre del archivo de salida
        // -C cambia al directorio base para que no guarde rutas absolutas dentro del zip
        const comando = `tar -a -cf "${zipName}" -C "${baseDir}" "${folderName}"`;

        console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.blue}${ColorLogs.bold}tar${ColorLogs.reset} Ejecutando: ${ColorLogs.gray}${comando}${ColorLogs.reset}`)

        exec(comando, { cwd: baseDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} ERROR ${ColorLogs.reset} ${ColorLogs.red}${ColorLogs.bold}Error al ejecutar tar nativo:${ColorLogs.reset}`, error);
                return reject(error);
            }
            if (stderr) {
                console.warn(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgYellow}${ColorLogs.black}${ColorLogs.bold} ADVERTENCIA ${ColorLogs.reset} ${ColorLogs.yellow}Advertencia de tar nativo:${ColorLogs.reset} ${stderr.trim()}`);
            }

            console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgGreen}${ColorLogs.black}${ColorLogs.bold} ÉXITO ${ColorLogs.reset} ${ColorLogs.green}${ColorLogs.bold}Archivo ZIP creado con éxito mediante comando nativo.${ColorLogs.reset}`);
            resolve();
        });
    });
}

const getFileService = async (downloadId) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`\n${ColorLogs.gray}==================================================${ColorLogs.reset}`)
    console.log(`${ColorLogs.gray}[${timestamp}]${ColorLogs.reset} ${ColorLogs.bgBlue}${ColorLogs.black}${ColorLogs.bold} SERVICIO ${ColorLogs.reset} ${ColorLogs.cyan}${ColorLogs.bold}#${downloadId}${ColorLogs.reset} ${ColorLogs.bold}Procesando entrega de archivo...${ColorLogs.reset}`)
    
    const state = activeDownloadsUtil.get(downloadId);
    console.log(`${ColorLogs.gray}├── Estado actual:${ColorLogs.reset}   ${state ? ColorLogs.green + state.status : ColorLogs.red + 'nulo'}${ColorLogs.reset}`)

    if (!state || state.status !== "completed") {
        console.error(`${ColorLogs.gray}└── Error estado:${ColorLogs.reset}    ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} FALLO ${ColorLogs.reset} ${ColorLogs.red}El estado no es 'completed' o no existe.${ColorLogs.reset}`);
        return {
            ok: false,
            status: 400,
            message: "El archivo no está listo o la descarga falló."
        };
    }

    console.log(`${ColorLogs.gray}├── Leyendo dir:${ColorLogs.reset}    ${ColorLogs.cyan}${DOWNLOADS_PATH}${ColorLogs.reset}`)
    const files = fs.readdirSync(DOWNLOADS_PATH);
    console.log(`${ColorLogs.gray}├── Archivos disco:${ColorLogs.reset}  ${ColorLogs.gray}${files.length} elementos encontrados${ColorLogs.reset}`)

    const targetFiles = files.filter(file =>
        file.startsWith(`[${downloadId}]-`) || file.includes(downloadId)
    );
    console.log(`${ColorLogs.gray}├── Coincidencias:${ColorLogs.reset}   ${ColorLogs.magenta}${targetFiles.length} archivo(s) encontrado(s)${ColorLogs.reset}`)

    if (targetFiles.length === 0) {
        console.error(`${ColorLogs.gray}└── Sin coincidencia:${ColorLogs.reset} ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} NO ENCONTRADO ${ColorLogs.reset} ${ColorLogs.red}No se encontró ninguna coincidencia para el ID: ${downloadId}${ColorLogs.reset}`);
        return {
            ok: false,
            status: 404,
            message: "No se encontró el archivo procesado."
        };
    }

    // Usamos path.resolve para garantizar rutas absolutas limpias
    const itemPath = path.resolve(DOWNLOADS_PATH, targetFiles[0]);
    console.log(`${ColorLogs.gray}├── Ruta objetivo:${ColorLogs.reset}   ${ColorLogs.cyan}${itemPath}${ColorLogs.reset}`)

    if (!fs.existsSync(itemPath)) {
        console.error(`${ColorLogs.gray}└── Error ruta:${ColorLogs.reset}     ${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} NO ENCONTRADO ${ColorLogs.reset} ${ColorLogs.red}El archivo o carpeta no existe físicamente en el disco.${ColorLogs.reset}`);
        return {
            ok: false,
            status: 404,
            message: "El archivo o carpeta física no existe."
        };
    }
    
    const stats = fs.statSync(itemPath);
    let filePath = itemPath;
    let clientName = targetFiles[0].replace(`[${downloadId}]-`, "");
    
    console.log(`${ColorLogs.gray}├── ¿Es directorio?:${ColorLogs.reset} ${stats.isDirectory() ? ColorLogs.yellow + 'Sí' : ColorLogs.blue + 'No'}${ColorLogs.reset}`)

    if (stats.isDirectory()) {
        const zipPath = `${itemPath}.zip`;
        clientName = `${clientName}.zip`;
        
        console.log(`${ColorLogs.gray}├── Salida ZIP:${ColorLogs.reset}     ${ColorLogs.green}${zipPath}${ColorLogs.reset}`)
        console.log(`${ColorLogs.gray}└── Nombre cliente:${ColorLogs.reset} ${ColorLogs.bold}${clientName}${ColorLogs.reset}`)

        try {
            // Verificar si la carpeta contiene canciones antes de iniciar
            const folderContent = fs.readdirSync(itemPath);
            console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.yellow}Contenido interno:${ColorLogs.reset} ${folderContent.length} archivo(s) dentro`)
            
            if (folderContent.length === 0) {
                throw new Error(`La carpeta [${targetFiles[0]}] está vacía, no hay nada que comprimir.`);
            }

            // Ejecutamos la compresión
            await zipFolder(itemPath, zipPath);
            filePath = zipPath;
            
            console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgGreen}${ColorLogs.black}${ColorLogs.bold} ÉXITO ${ColorLogs.reset} ${ColorLogs.green}${ColorLogs.bold}ZIP creado correctamente. Listo para enviar.${ColorLogs.reset}`);
        } catch (error) {
            console.error(`\n${ColorLogs.bgRed}${ColorLogs.white}${ColorLogs.bold} ======= ERROR DETALLADO EN EL PROCESO DEL ZIP ======= ${ColorLogs.reset}`);
            console.error(`${ColorLogs.red}${error.stack || error}${ColorLogs.reset}`);
            console.error(`${ColorLogs.gray}=====================================================${ColorLogs.reset}\n`);
            
            // Si quedó un archivo .zip corrupto o vacío de 0 bytes, lo limpiamos para no ensuciar
            if (fs.existsSync(zipPath)) {
                console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgYellow}${ColorLogs.black}${ColorLogs.bold} LIMPIEZA ${ColorLogs.reset} ${ColorLogs.yellow}Eliminando ZIP vacío/incompleto de: ${zipPath}${ColorLogs.reset}`);
                fs.unlinkSync(zipPath);
            }

            return {
                ok: false,
                status: 500,
                message: `Error interno al empaquetar la playlist: ${error.message}`
            };
        }
    }

    console.log(`${ColorLogs.gray}[${new Date().toLocaleTimeString()}]${ColorLogs.reset} ${ColorLogs.bgGreen}${ColorLogs.black}${ColorLogs.bold} COMPLETADO ${ColorLogs.reset} ${ColorLogs.green}${ColorLogs.bold}Saliendo del servicio con éxito. Archivo listo.${ColorLogs.reset}`);
    console.log(`${ColorLogs.gray}==================================================${ColorLogs.reset}\n`)
    
    return {
        ok: true,
        filePath,
        clientName
    };
};

module.exports = { getFileService }