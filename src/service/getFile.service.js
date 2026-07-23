const { activeDownloadsUtil } = require("../utils/activeDownloadsUtil.js")
const path = require("path")
const fs = require("fs")
// Corrección de importación común para archiver en entornos Node
const archiver = require("archiver")
const { DOWNLOADS_PATH } = require("../config/config.js")

const { exec } = require("child_process")

// Función definitiva usando el comando nativo 'tar' de Windows
const zipFolder = (sourceDir, outPath) => {
    return new Promise((resolve, reject) => {
        console.log(`[ZIP-PROCESS] Iniciando compresión nativa de sistema...`);
        
        // Obtenemos solo el nombre de la carpeta a zipear y el directorio base
        const baseDir = path.dirname(sourceDir);
        const folderName = path.basename(sourceDir);
        const zipName = path.basename(outPath);

        console.log(`[ZIP-PROCESS] Directorio base: ${baseDir} | Carpeta: ${folderName}`);

        // Ejecutamos 'tar' de Windows. 
        // -a fuerza a que determine el formato por la extensión (.zip)
        // -c crea un nuevo archivo
        // -f especifica el nombre del archivo de salida
        // -C cambia al directorio base para que no guarde rutas absolutas dentro del zip
        const comando = `tar -a -cf "${zipName}" -C "${baseDir}" "${folderName}"`;

        console.log(`[ZIP-PROCESS] Ejecutando comando: ${comando}`);

        exec(comando, { cwd: baseDir }, (error, stdout, stderr) => {
            if (error) {
                console.error("[ZIP-PROCESS] Error al ejecutar tar nativo:", error);
                return reject(error);
            }
            if (stderr) {
                console.warn("[ZIP-PROCESS] Advertencia de tar nativo:", stderr);
            }

            console.log(`[ZIP-PROCESS] Archivo ZIP creado con éxito mediante comando nativo.`);
            resolve();
        });
    });
}

const getFileService = async (downloadId) => {
    console.log("==================================================");
    console.log(`[SERVICE-START] Procesando descarga con ID: ${downloadId}`);
    
    const state = activeDownloadsUtil.get(downloadId);
    console.log(`[SERVICE-STATE] Estado en activeDownloadsUtil:`, state);

    if (!state || state.status !== "completed") {
        console.error(`[SERVICE-ERROR] El estado no es 'completed' o no existe.`);
        return {
            ok: false,
            status: 400,
            message: "El archivo no está listo o la descarga falló."
        };
    }

    console.log(`[SERVICE-PATH] Leyendo directorio de descargas: ${DOWNLOADS_PATH}`);
    const files = fs.readdirSync(DOWNLOADS_PATH);
    console.log(`[SERVICE-FILES] Archivos encontrados en el disco:`, files);

    const targetFiles = files.filter(file =>
        file.startsWith(`[${downloadId}]-`) || file.includes(downloadId)
    );
    console.log(`[SERVICE-FILTER] Archivos que coinciden con el ID:`, targetFiles);

    if (targetFiles.length === 0) {
        console.error(`[SERVICE-ERROR] No se encontró ninguna coincidencia para el ID: ${downloadId}`);
        return {
            ok: false,
            status: 404,
            message: "No se encontró el archivo procesado."
        };
    }

    // Usamos path.resolve para garantizar rutas absolutas limpias
    const itemPath = path.resolve(DOWNLOADS_PATH, targetFiles[0]);
    console.log(`[SERVICE-TARGET] Ruta absoluta del elemento seleccionado: ${itemPath}`);

    if (!fs.existsSync(itemPath)) {
        console.error(`[SERVICE-ERROR] El archivo o carpeta no existe físicamente en el disco.`);
        return {
            ok: false,
            status: 404,
            message: "El archivo o carpeta física no existe."
        };
    }
    
    const stats = fs.statSync(itemPath);
    let filePath = itemPath;
    let clientName = targetFiles[0].replace(`[${downloadId}]-`, "");
    
    console.log(`[SERVICE-TYPE] ¿Es directorio/carpeta?: ${stats.isDirectory()}`);

    if (stats.isDirectory()) {
        const zipPath = `${itemPath}.zip`;
        clientName = `${clientName}.zip`;
        
        console.log(`[SERVICE-ZIP] Configurando salida ZIP -> Destino: ${zipPath} | Nombre Cliente: ${clientName}`);

        try {
            // Verificar si la carpeta contiene canciones antes de iniciar
            const folderContent = fs.readdirSync(itemPath);
            console.log(`[SERVICE-ZIP] Contenido interno de la carpeta a comprimir:`, folderContent);
            
            if (folderContent.length === 0) {
                throw new Error(`La carpeta [${targetFiles[0]}] está vacía, no hay nada que comprimir.`);
            }

            // Ejecutamos la compresión
            await zipFolder(itemPath, zipPath);
            filePath = zipPath;
            
            console.log(`[SERVICE-SUCCESS] ZIP creado correctamente. Listo para enviar.`);
        } catch (error) {
            console.error("======= ERROR DETALLADO EN EL PROCESO DEL ZIP =======");
            console.error(error);
            console.error("=====================================================");
            
            // Si quedó un archivo .zip corrupto o vacío de 0 bytes, lo limpiamos para no ensuciar
            if (fs.existsSync(zipPath)) {
                console.log(`[SERVICE-CLEANUP] Eliminando ZIP vacío/incompleto de: ${zipPath}`);
                fs.unlinkSync(zipPath);
            }

            return {
                ok: false,
                status: 500,
                message: `Error interno al empaquetar la playlist: ${error.message}`
            };
        }
    }

    console.log(`[SERVICE-END] Saliendo del servicio con éxito. Archivo listo.`);
    console.log("==================================================");
    
    return {
        ok: true,
        filePath,
        clientName
    };
};

module.exports = { getFileService }