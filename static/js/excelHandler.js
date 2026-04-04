// Excel Handler for Retail Foundry using SheetJS
import { getLocations, getCompetitors, getCannibalizations, getMobilityZones, importData } from './storage.js';
import { Location } from './entities/Location.js';
import { Competitor } from './entities/Competitor.js';
import { Cannibalization } from './entities/Cannibalization.js';

// Export data to Excel with 3 sheets
export async function exportToExcel() {
    const locations = getLocations();
    const competitors = getCompetitors();
    const cannibalizations = getCannibalizations();
    
    // Load SheetJS library dynamically
    if (!window.XLSX) {
        await loadSheetJS();
    }
    
    const wb = window.XLSX.utils.book_new();
    
    // Sheet 1: Localidades
    const mobilityZones = getMobilityZones();
    const locationsData = locations.map(loc => {
        const zone = mobilityZones.find(z => z.id === loc.mobility_zone_id);
        return {
            'ID': loc.id,
            'Nombre': loc.name,
            'Tipo': loc.type || '',
            'Tamaño': loc.size || '',
            'Latitud': loc.latitude || '',
            'Longitud': loc.longitude || '',
            'Provincia': loc.provincia || '',
            'Cantón': loc.canton || '',
            'Parroquia': loc.parroquia || '',
            'Dirección': loc.direccion || '',
            'Zona Movilidad': zone ? zone.name : '',
            'Hogares 5min': loc.homes_5min || '',
            'Hogares 10min': loc.homes_10min || '',
            '% NSE D': loc.percent_nse_d || '',
            '% NSE C-': loc.percent_nse_c_minus || '',
            '% NSE C+': loc.percent_nse_c_plus || '',
            '% NSE B': loc.percent_nse_b || ''
        };
    });
    
    const wsLocations = window.XLSX.utils.json_to_sheet(locationsData);
    window.XLSX.utils.book_append_sheet(wb, wsLocations, 'Localidades');
    
    // Sheet 2: Competidores
    const competitorsData = competitors.map(comp => ({
        'ID': comp.id,
        'Localidad ID': comp.location_id,
        'Nombre': comp.name,
        'Tipo': comp.type,
        'Tamaño': comp.size,
        'Latitud': comp.latitude || '',
        'Longitud': comp.longitude || ''
    }));
    
    const wsCompetitors = window.XLSX.utils.json_to_sheet(competitorsData);
    window.XLSX.utils.book_append_sheet(wb, wsCompetitors, 'Competidores');
    
    // Sheet 3: Canibalizadores
    const cannibalizationsData = cannibalizations.map(cann => ({
        'ID': cann.id,
        'Localidad ID': cann.location_id,
        'Nombre': cann.name,
        'Tamaño': cann.size,
        'Latitud': cann.latitude || '',
        'Longitud': cann.longitude || ''
    }));
    
    const wsCannibalizations = window.XLSX.utils.json_to_sheet(cannibalizationsData);
    window.XLSX.utils.book_append_sheet(wb, wsCannibalizations, 'Canibalizadores');
    
    // Sheet 4: Tablas de Referencia (para listas desplegables)
    // Tipos de Localidad
    const locationTypes = [
        'Supermercado',
        'Minimarket',
        'Tienda de conveniencia',
        'Farmacia',
        'Otros'
    ];
    
    // Crear datos para la hoja de tablas
    const maxRows = Math.max(locationTypes.length, mobilityZones.length);
    const tablesData = [];
    
    for (let i = 0; i < maxRows; i++) {
        tablesData.push({
            'Tipos de Localidad': locationTypes[i] || '',
            'Nombre Zona': mobilityZones[i]?.name || ''
        });
    }
    
    const wsTables = window.XLSX.utils.json_to_sheet(tablesData);
    window.XLSX.utils.book_append_sheet(wb, wsTables, 'Tablas');
    
    // Generate filename with timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `localidades-${timestamp}.xlsx`;
    
    // Write file
    window.XLSX.writeFile(wb, filename);
    
    return filename;
}

// Import data from Excel with 3 sheets
export async function importFromExcel(file) {
    // Load SheetJS library dynamically
    if (!window.XLSX) {
        await loadSheetJS();
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                
                // Validate sheets
                if (!workbook.SheetNames.includes('Localidades') ||
                    !workbook.SheetNames.includes('Competidores') ||
                    !workbook.SheetNames.includes('Canibalizadores')) {
                    reject(new Error('El archivo Excel debe contener 3 hojas: Localidades, Competidores y Canibalizadores'));
                    return;
                }
                
                // Parse sheets
                const locationsSheet = workbook.Sheets['Localidades'];
                const competitorsSheet = workbook.Sheets['Competidores'];
                const cannibalizationsSheet = workbook.Sheets['Canibalizadores'];
                
                const locationsRaw = window.XLSX.utils.sheet_to_json(locationsSheet);
                const competitorsRaw = window.XLSX.utils.sheet_to_json(competitorsSheet);
                const cannibalizationsRaw = window.XLSX.utils.sheet_to_json(cannibalizationsSheet);
                
                // Check for duplicate IDs
                const existingLocations = getLocations();
                const existingIds = new Set(existingLocations.map(l => l.id));
                const duplicateIds = [];
                
                locationsRaw.forEach(loc => {
                    if (existingIds.has(loc.ID)) {
                        duplicateIds.push(loc.ID);
                    }
                });
                
                if (duplicateIds.length > 0) {
                    const duplicateNames = locationsRaw
                        .filter(loc => duplicateIds.includes(loc.ID))
                        .map(loc => `ID ${loc.ID}: ${loc.Nombre}`)
                        .join('\n');
                    
                    reject({
                        type: 'duplicate',
                        message: `Las siguientes localidades ya existen en el sistema:\n\n${duplicateNames}\n\nSe importarán las demás localidades.`,
                        duplicateIds: duplicateIds,
                        data: { locationsRaw, competitorsRaw, cannibalizationsRaw }
                    });
                    return;
                }
                
                // Transform data
                // Get mobility zones to map names to IDs
                const mobilityZones = getMobilityZones();
                
                const locations = locationsRaw.map(loc => {
                    // Map zone name to ID
                    let zoneId = 1; // Default to first zone
                    if (loc['Zona Movilidad']) {
                        const zone = mobilityZones.find(z => z.name === loc['Zona Movilidad']);
                        if (zone) zoneId = zone.id;
                    }
                    
                    return new Location({
                        id: loc.ID,
                        name: loc.Nombre,
                        type: loc.Tipo,
                        size: loc['Tamaño'] || 0,
                        latitude: parseFloat(loc.Latitud) || 0,
                        longitude: parseFloat(loc.Longitud) || 0,
                        provincia: loc.Provincia || '',
                        canton: loc.Cantón || '',
                        parroquia: loc.Parroquia || '',
                        direccion: loc.Dirección || '',
                        mobility_zone_id: zoneId,
                        homes_5min: parseInt(loc['Hogares 5min']) || 0,
                        homes_10min: parseInt(loc['Hogares 10min']) || 0,
                        percent_nse_d: loc['% NSE D'] || 0,
                        percent_nse_c_minus: loc['% NSE C-'] || 0,
                        percent_nse_c_plus: loc['% NSE C+'] || 0,
                        percent_nse_b: loc['% NSE B'] || 0
                    });
                });
                
                const competitors = competitorsRaw.map(comp => {
                    const lat = parseFloat(comp.Latitud);
                    const lon = parseFloat(comp.Longitud);
                    const location = locations.find(l => l.id === comp['Localidad ID']);
                    
                    const competitor = new Competitor({
                        id: comp.ID,
                        location_id: location?.id || null,
                        name: comp.Nombre,
                        type: comp.Tipo,
                        size: comp['Tamaño'] || 0,
                        latitude: isNaN(lat) ? null : lat,
                        longitude: isNaN(lon) ? null : lon,
                        proximity: 0
                    });
                    
                    // Calculate distance automatically if coordinates and location are available
                    if (location) {
                        competitor.updateProximity(location);
                    }
                    
                    return competitor;
                });
                
                const cannibalizations = cannibalizationsRaw.map(cann => {
                    const lat = parseFloat(cann.Latitud);
                    const lon = parseFloat(cann.Longitud);
                    const location = locations.find(l => l.id === cann['Localidad ID']);
                    
                    const cannibalization = new Cannibalization({
                        id: cann.ID,
                        location_id: location?.id || null,
                        name: cann.Nombre,
                        size: cann['Tamaño'] || 0,
                        latitude: isNaN(lat) ? null : lat,
                        longitude: isNaN(lon) ? null : lon,
                        proximity: 0
                    });
                    
                    // Calculate distance automatically if coordinates and location are available
                    if (location) {
                        cannibalization.updateProximity(location);
                    }
                    
                    return cannibalization;
                });
                
                resolve({
                    locations,
                    competitors,
                    cannibalizations
                });
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// Load SheetJS library dynamically
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Error al cargar la librería SheetJS'));
        document.head.appendChild(script);
    });
}
