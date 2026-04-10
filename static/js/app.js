// App principal para Retail Foundry - SPA Version
import { 
    COMPETITOR_TYPES, 
    TYPE_AFFINITY_MATRIX, 
    CAPTURE_RANGES, 
    ACCESSIBILITY_VALUES,
    EFFECTIVE_MARKET_FACTORS,
    DISTANCE_THRESHOLDS
} from './constants.js';
import { initStorage, getMobilityZones, updateMobilityZone, searchLocations, createLocation, updateLocation, deleteLocation, getLocationById, exportData, importData, getGlobalConfig, updateGlobalConfig, getViabilityCriteria, updateViabilityCriteria } from './storage.js';
import { exportToExcel, importFromExcel } from './excelHandler.js';

// Inicializar storage al cargar
initStorage();

let currentPage = 1;
let currentSearch = '';
let currentSort = 'id';
let currentOrder = 'DESC';
const limit = 10;
let mobilityZones = [];

const newLocationBtn = document.getElementById('newLocationBtn');
const configBtn = document.getElementById('configBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const importFileInput = document.getElementById('importFileInput');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const orderSelect = document.getElementById('orderSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const locationTypeSelect = document.getElementById('locationType');

newLocationBtn.onclick = () => {
    window.location.href = 'location.html';
};

exportBtn.onclick = () => {
    handleExportData();
};

importBtn.onclick = () => {
    importFileInput.click();
};

downloadTemplateBtn.onclick = () => {
    // Descargar directamente el archivo de ejemplo
    const link = document.createElement('a');
    link.href = 'static/docs/sample_import.xlsx';
    link.download = 'plantilla-importacion.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

importFileInput.onchange = (event) => {
    handleImportData(event);
};

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadLocations();
});

// Event listener para seleccionar/deseleccionar todas
document.getElementById('selectAll').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.location-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadLocations();
});

orderSelect.addEventListener('change', (e) => {
    currentOrder = e.target.value;
    loadLocations();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadLocations();
    }
});

nextBtn.addEventListener('click', () => {
    currentPage++;
    loadLocations();
});


function loadLocations() {
    try {
        const data = searchLocations(currentSearch, currentSort, currentOrder, currentPage, limit);

        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        if (data.locations && data.locations.length > 0) {
            data.locations.forEach(location => {
                const zoneName = mobilityZones.find(z => z.id === location.mobility_zone_id)?.name || 'N/A';
                const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="location-checkbox" data-location-id="${location.id}"></td>
                    <td>${location.id}</td>
                    <td>${location.name}</td>
                    <td>${location.type || 'N/A'}</td>
                    <td>${zoneName}</td>
                    <td>
                        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="location-link" title="Ver en Google Maps">
                            📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
                        </a>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-info" onclick="window.viewEvaluation(${location.id})">Ver Evaluación</button>
                            <a href="location.html?id=${location.id}" class="btn btn-success">Editar</a>
                            <button class="btn btn-danger" onclick="window.deleteLocationHandler(${location.id})">Eliminar</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No se encontraron localidades</td></tr>';
        }

        const totalPages = Math.ceil(data.total / limit);
        document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages || 1} (Total: ${data.total})`;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages;
    } catch (error) {
        console.error('Error:', error);
    }
}

function viewEvaluation(id) {
    window.location.href = `evaluation.html?id=${id}`;
}

function deleteLocationHandler(id) {
    if (confirm('¿Está seguro de que desea eliminar esta localidad?')) {
        try {
            deleteLocation(id);
            loadLocations();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar la localidad');
        }
    }
}

function loadMobilityZones() {
    try {
        mobilityZones = getMobilityZones();
        
        const select = document.getElementById('mobilityZone');
        if (!select) return; // El select no existe en esta página (e.g., index.html)
        
        select.innerHTML = '<option value="">Seleccione una zona...</option>';
        mobilityZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone.id;
            option.textContent = zone.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function loadLocationTypes() {
    const select = document.getElementById('locationType');
    if (!select) return; // El select no existe en esta página (e.g., index.html)
    
    select.innerHTML = '<option value="">Seleccione un tipo...</option>';
    COMPETITOR_TYPES.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function updatePercentagesFromZone(zoneId) {
    const zone = mobilityZones.find(z => z.id == zoneId);
    if (zone) {
        document.getElementById('percentHomes5').value = zone.percent_homes_5;
        document.getElementById('percentHomes10').value = zone.percent_homes_10;
        document.getElementById('percentExpenses').value = zone.percent_expenses;
    }
}

// Funciones de Importación/Exportación
async function handleExportData() {
    try {
        const confirmExport = confirm('¿Desea exportar TODAS las localidades a Excel?');
        if (!confirmExport) return;
        
        const filename = await exportToExcel();
        alert(`✅ Datos exportados exitosamente a ${filename}`);
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('❌ Error al exportar los datos. Por favor, intente nuevamente.');
    }
}

async function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('❌ Por favor, seleccione un archivo Excel válido (.xlsx o .xls).');
        event.target.value = '';
        return;
    }
    
    try {
        const data = await importFromExcel(file);
        
        const confirmMsg = `Se importarán:\n\n` +
            `📍 Localidades: ${data.locations.length}\n` +
            `🏪 Competidores: ${data.competitors.length}\n` +
            `🔄 Canibalizaciones: ${data.cannibalizations.length}\n\n` +
            `¿Confirma la importación?`;
        
        if (confirm(confirmMsg)) {
            importData(data, false);
            loadMobilityZones();
            loadLocations();
            alert('✅ Datos importados exitosamente');
        }
    } catch (error) {
        if (error.type === 'duplicate') {
            const continueImport = confirm(error.message + '\n\n¿Desea continuar con la importación de las demás localidades?');
            
            if (continueImport) {
                const { locationsRaw, competitorsRaw, cannibalizationsRaw } = error.data;
                const filteredLocations = locationsRaw.filter(loc => !error.duplicateIds.includes(loc.ID));
                
                // Re-import without duplicates
                try {
                    const file2 = event.target.files[0];
                    const data = await importFromExcel(file2);
                    const filtered = {
                        locations: data.locations.filter(loc => !error.duplicateIds.includes(loc.id)),
                        competitors: data.competitors.filter(comp => !error.duplicateIds.includes(comp.location_id)),
                        cannibalizations: data.cannibalizations.filter(cann => !error.duplicateIds.includes(cann.location_id))
                    };
                    
                    importData(filtered, false);
                    loadMobilityZones();
                    loadLocations();
                    alert(`✅ Se importaron ${filtered.locations.length} localidades (${error.duplicateIds.length} duplicadas omitidas)`);
                } catch (err) {
                    console.error('Error:', err);
                    alert('❌ Error al importar los datos.');
                }
            }
        } else {
            console.error('Error al importar datos:', error);
            alert('❌ ' + (error.message || 'Error al importar los datos. Verifique que el archivo sea válido.'));
        }
    }
    
    event.target.value = '';
}

// Exponer funciones globalmente para onclick handlers
window.viewEvaluation = viewEvaluation;
window.deleteLocationHandler = deleteLocationHandler;

// Inicializar
loadMobilityZones();
loadLocationTypes();
loadLocations();
