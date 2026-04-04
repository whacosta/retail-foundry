// Excel Handler for Retail Foundry using SheetJS
import { getLocations, getCompetitors, getCannibalizations, getMobilityZones, importData } from './storage.js';

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
    const locationsData = locations.map(loc => ({
        'ID': loc.id,
        'Nombre': loc.name,
        'Tipo': loc.type || '',
        'Tamaño (m²)': loc.size || '',
        'Latitud': loc.latitude || '',
        'Longitud': loc.longitude || '',
        'Provincia': loc.provincia || '',
        'Cantón': loc.canton || '',
        'Parroquia': loc.parroquia || '',
        'Dirección': loc.direccion || '',
        'Zona Movilidad ID': loc.mobility_zone_id || '',
        'Hogares 5min': loc.homes_5min || '',
        '% Hogares 5min': loc.percent_homes_5 || '',
        'Hogares 10min': loc.homes_10min || '',
        '% Hogares 10min': loc.percent_homes_10 || '',
        '% NSE D': loc.percent_nse_d || '',
        '% NSE C-': loc.percent_nse_c_minus || '',
        '% NSE C+': loc.percent_nse_c_plus || '',
        '% NSE B': loc.percent_nse_b || '',
        'Ingreso D': loc.income_d || '',
        'Ingreso C-': loc.income_c_minus || '',
        'Ingreso C+': loc.income_c_plus || '',
        'Ingreso B': loc.income_b || '',
        '% Gastos': loc.percent_expenses || ''
    }));
    
    const wsLocations = window.XLSX.utils.json_to_sheet(locationsData);
    window.XLSX.utils.book_append_sheet(wb, wsLocations, 'Localidades');
    
    // Sheet 2: Competidores
    const competitorsData = competitors.map(comp => ({
        'ID': comp.id,
        'Localidad ID': comp.location_id,
        'Nombre': comp.name,
        'Tipo': comp.type,
        'Tamaño (m²)': comp.size,
        'Latitud': comp.latitude || '',
        'Longitud': comp.longitude || '',
        'Distancia (m)': comp.proximity
    }));
    
    const wsCompetitors = window.XLSX.utils.json_to_sheet(competitorsData);
    window.XLSX.utils.book_append_sheet(wb, wsCompetitors, 'Competidores');
    
    // Sheet 3: Canibalizadores
    const cannibalizationsData = cannibalizations.map(cann => ({
        'ID': cann.id,
        'Localidad ID': cann.location_id,
        'Nombre': cann.name,
        'Tamaño (m²)': cann.size,
        'Latitud': cann.latitude || '',
        'Longitud': cann.longitude || '',
        'Distancia (m)': cann.proximity,
        'Factor Canibalización': cann.cannibalizationFactor
    }));
    
    const wsCannibalizations = window.XLSX.utils.json_to_sheet(cannibalizationsData);
    window.XLSX.utils.book_append_sheet(wb, wsCannibalizations, 'Canibalizadores');
    
    // Sheet 4: Tablas de Referencia (para listas desplegables)
    const mobilityZones = getMobilityZones();
    
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
                const locations = locationsRaw.map(loc => ({
                    id: loc.ID,
                    name: loc.Nombre,
                    type: loc.Tipo,
                    size: parseFloat(loc['Tamaño (m²)']) || 0,
                    latitude: parseFloat(loc.Latitud) || 0,
                    longitude: parseFloat(loc.Longitud) || 0,
                    provincia: loc.Provincia || '',
                    canton: loc.Cantón || '',
                    parroquia: loc.Parroquia || '',
                    direccion: loc.Dirección || '',
                    mobility_zone_id: parseInt(loc['Zona Movilidad ID']) || 1,
                    homes_5min: parseInt(loc['Hogares 5min']) || 0,
                    percent_homes_5: parseFloat(loc['% Hogares 5min']) || 0,
                    homes_10min: parseInt(loc['Hogares 10min']) || 0,
                    percent_homes_10: parseFloat(loc['% Hogares 10min']) || 0,
                    percent_nse_d: parseFloat(loc['% NSE D']) || 0,
                    percent_nse_c_minus: parseFloat(loc['% NSE C-']) || 0,
                    percent_nse_c_plus: parseFloat(loc['% NSE C+']) || 0,
                    percent_nse_b: parseFloat(loc['% NSE B']) || 0,
                    income_d: parseFloat(loc['Ingreso D']) || 0,
                    income_c_minus: parseFloat(loc['Ingreso C-']) || 0,
                    income_c_plus: parseFloat(loc['Ingreso C+']) || 0,
                    income_b: parseFloat(loc['Ingreso B']) || 0,
                    percent_expenses: parseFloat(loc['% Gastos']) || 0
                }));
                
                const competitors = competitorsRaw.map(comp => ({
                    id: comp.ID,
                    location_id: comp['Localidad ID'],
                    name: comp.Nombre,
                    type: comp.Tipo,
                    size: parseFloat(comp['Tamaño (m²)']) || 0,
                    latitude: parseFloat(comp.Latitud) || null,
                    longitude: parseFloat(comp.Longitud) || null,
                    proximity: parseFloat(comp['Distancia (m)']) || 0
                }));
                
                const cannibalizations = cannibalizationsRaw.map(cann => ({
                    id: cann.ID,
                    location_id: cann['Localidad ID'],
                    name: cann.Nombre,
                    size: parseFloat(cann['Tamaño (m²)']) || 0,
                    latitude: parseFloat(cann.Latitud) || null,
                    longitude: parseFloat(cann.Longitud) || null,
                    proximity: parseFloat(cann['Distancia (m)']) || 0,
                    cannibalizationFactor: parseFloat(cann['Factor Canibalización']) || 0
                }));
                
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
