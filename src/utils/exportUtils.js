/**
 * Utilidades para exportación de registros de actualización a CSV y TXT.
 */

/**
 * Descarga un archivo de texto en el navegador del usuario.
 * @param {string} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el reporte de la ejecución a formato CSV.
 * @param {Array} items Lista de archivos procesados
 * @param {string} rootName Nombre de la carpeta raíz
 */
export function exportResultsToCSV(items, rootName = 'Google Drive') {
  const headers = ['Archivo Local', 'Estado', 'Ruta Destino en Drive', 'File ID', 'Detalle/Error', 'Fecha y Hora'];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const rows = [];
  
  items.forEach(item => {
    if (item.matches && item.matches.length > 0) {
      // Para cada coincidencia seleccionada o evaluada
      item.matches.forEach(match => {
        let status = 'Omitido';
        if (match.selected) {
          if (match.uploadStatus === 'completed') status = 'Actualizado';
          else if (match.uploadStatus === 'error') status = 'Error';
          else status = 'Pendiente/No ejecutado';
        } else {
          status = 'No seleccionado';
        }
        
        rows.push([
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${status}"`,
          `"${(match.path || '').replace(/"/g, '""')}"`,
          `"${match.fileId || ''}"`,
          `"${(match.errorMessage || '').replace(/"/g, '""')}"`,
          `"${new Date().toLocaleString()}"`
        ]);
      });
    } else {
      // Sin coincidencia
      rows.push([
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"No encontrado"`,
        `"No encontrado en carpeta: ${rootName}"`,
        `""`,
        `"Sin coincidencia de nombre exacto"`,
        `"${new Date().toLocaleString()}"`
      ]);
    }
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadFile(csvContent, `reporte-reemplazo-drive-${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exporta el reporte a formato TXT legible.
 * @param {Array} items 
 * @param {string} rootName 
 */
export function exportResultsToTXT(items, rootName = 'Google Drive') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const now = new Date().toLocaleString();
  
  let txt = `====================================================================\n`;
  txt += `           REPORTE DE ACTUALIZACIÓN - GOOGLE DRIVE                  \n`;
  txt += `====================================================================\n`;
  txt += `Fecha de ejecución: ${now}\n`;
  txt += `Carpeta raíz analizada: ${rootName}\n`;
  txt += `Total de archivos locales cargados: ${items.length}\n\n`;

  let updatedCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  let unselectedCount = 0;

  items.forEach(item => {
    if (!item.matches || item.matches.length === 0) {
      notFoundCount++;
    } else {
      item.matches.forEach(m => {
        if (m.selected) {
          if (m.uploadStatus === 'completed') updatedCount++;
          else if (m.uploadStatus === 'error') errorCount++;
        } else {
          unselectedCount++;
        }
      });
    }
  });

  txt += `Resumen:\n`;
  txt += `  - Archivos actualizados exitosamente: ${updatedCount}\n`;
  txt += `  - Errores durante la subida: ${errorCount}\n`;
  txt += `  - Archivos no encontrados en Drive: ${notFoundCount}\n`;
  txt += `  - Coincidencias no seleccionadas: ${unselectedCount}\n\n`;
  txt += `--------------------------------------------------------------------\n`;
  txt += `DETALLE DE OPERACIONES:\n`;
  txt += `--------------------------------------------------------------------\n\n`;

  items.forEach((item, index) => {
    txt += `[${index + 1}] Archivo local: ${item.name}\n`;
    if (!item.matches || item.matches.length === 0) {
      txt += `    Estado: NO ENCONTRADO EN DRIVE (Ignorado)\n\n`;
    } else {
      item.matches.forEach((m, mIdx) => {
        const selText = m.selected ? 'SELECCIONADO' : 'NO SELECCIONADO';
        let res = 'PENDIENTE';
        if (m.uploadStatus === 'completed') res = 'ACTUALIZADO CON ÉXITO';
        else if (m.uploadStatus === 'error') res = `ERROR: ${m.errorMessage || 'Fallo desconocido'}`;
        
        txt += `    -> Coincidencia ${mIdx + 1} (${selText}):\n`;
        txt += `       File ID : ${m.fileId}\n`;
        txt += `       Ruta    : ${m.path}\n`;
        txt += `       Resultado: ${res}\n`;
      });
      txt += `\n`;
    }
  });

  txt += `====================================================================\n`;
  txt += `Fin del reporte.\n`;

  downloadFile(txt, `reporte-reemplazo-drive-${timestamp}.txt`, 'text/plain;charset=utf-8;');
}
