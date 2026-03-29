// App principal para Retail Foundry - SPA Version
import { COMPETITOR_TYPES } from './constants.js';
import { initStorage, getMobilityZones, updateMobilityZone, searchLocations, createLocation, updateLocation, deleteLocation, getLocationById, exportData, importData, getGlobalConfig, updateGlobalConfig } from './storage.js';

// Inicializar storage al cargar
initStorage();

let currentPage = 1;
let currentSearch = '';
let currentSort = 'id';
let currentOrder = 'DESC';
const limit = 10;
let mobilityZones = [];

const modal = document.getElementById('modal');
const configModal = document.getElementById('configModal');
const newLocationBtn = document.getElementById('newLocationBtn');
const configBtn = document.getElementById('configBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const closeBtn = document.getElementsByClassName('close')[0];
const closeConfigBtn = document.getElementsByClassName('close-config')[0];
const cancelBtn = document.getElementById('cancelBtn');
const cancelConfigBtn = document.getElementById('cancelConfigBtn');
const cancelGlobalConfigBtn = document.getElementById('cancelGlobalConfigBtn');
const locationForm = document.getElementById('locationForm');
const configForm = document.getElementById('configForm');
const globalConfigForm = document.getElementById('globalConfigForm');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const orderSelect = document.getElementById('orderSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const mobilityZoneSelect = document.getElementById('mobilityZone');
const locationTypeSelect = document.getElementById('locationType');

newLocationBtn.onclick = () => {
    openModal();
};

configBtn.onclick = () => {
    openConfigModal();
};

exportBtn.onclick = () => {
    handleExportData();
};

importBtn.onclick = () => {
    importFileInput.click();
};

importFileInput.onchange = (event) => {
    handleImportData(event);
};

closeBtn.onclick = () => {
    closeModal();
};

closeConfigBtn.onclick = () => {
    closeConfigModal();
};

cancelBtn.onclick = () => {
    closeModal();
};

cancelConfigBtn.onclick = () => {
    closeConfigModal();
};

cancelGlobalConfigBtn.onclick = () => {
    closeConfigModal();
};

window.onclick = (event) => {
    if (event.target == modal) {
        closeModal();
    }
    if (event.target == configModal) {
        closeConfigModal();
    }
};

mobilityZoneSelect.addEventListener('change', (e) => {
    updatePercentagesFromZone(e.target.value);
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadLocations();
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

locationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const percentNSED = parseFloat(document.getElementById('percentNSED').value);
    const percentNSECMinus = parseFloat(document.getElementById('percentNSECMinus').value);
    const percentNSECPlus = parseFloat(document.getElementById('percentNSECPlus').value);
    const percentNSEB = parseFloat(document.getElementById('percentNSEB').value);
    
    const totalNSE = percentNSED + percentNSECMinus + percentNSECPlus + percentNSEB;
    
    if (Math.abs(totalNSE - 100) > 0.01) {
        alert(`La suma de los porcentajes NSE debe ser 100%. Actualmente es ${totalNSE.toFixed(2)}%`);
        return;
    }
    
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    
    // Validar coordenadas
    if (latitude < -90 || latitude > 90) {
        alert('❌ La latitud debe estar entre -90 y 90 grados');
        return;
    }
    
    if (longitude < -180 || longitude > 180) {
        alert('❌ La longitud debe estar entre -180 y 180 grados');
        return;
    }
    
    const locationId = document.getElementById('locationId').value;
    const locationData = {
        name: document.getElementById('name').value,
        type: document.getElementById('locationType').value,
        size: parseFloat(document.getElementById('locationSize').value),
        latitude: latitude,
        longitude: longitude,
        homes_5min: parseInt(document.getElementById('homes5Min').value),
        percent_homes_5: parseFloat(document.getElementById('percentHomes5').value),
        homes_10min: parseInt(document.getElementById('homes10Min').value),
        percent_homes_10: parseFloat(document.getElementById('percentHomes10').value),
        mobility_zone_id: parseInt(document.getElementById('mobilityZone').value),
        percent_nse_d: percentNSED,
        percent_nse_c_minus: percentNSECMinus,
        percent_nse_c_plus: percentNSECPlus,
        percent_nse_b: percentNSEB,
        income_d: parseFloat(document.getElementById('incomeD').value),
        income_c_minus: parseFloat(document.getElementById('incomeCMinus').value),
        income_c_plus: parseFloat(document.getElementById('incomeCPlus').value),
        income_b: parseFloat(document.getElementById('incomeB').value),
        percent_expenses: parseFloat(document.getElementById('percentExpenses').value)
    };

    try {
        if (locationId) {
            updateLocation(parseInt(locationId), locationData);
        } else {
            createLocation(locationData);
        }
        
        closeModal();
        loadLocations();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la localidad');
    }
});

function openModal(location = null) {
    // Cargar ingresos desde configuración global
    const globalConfig = getGlobalConfig();
    
    if (location) {
        document.getElementById('modalTitle').textContent = 'Editar Localidad';
        document.getElementById('locationId').value = location.id;
        document.getElementById('name').value = location.name;
        document.getElementById('locationType').value = location.type || '';
        document.getElementById('locationSize').value = location.size || '';
        document.getElementById('latitude').value = location.latitude;
        document.getElementById('longitude').value = location.longitude;
        document.getElementById('mobilityZone').value = location.mobility_zone_id || 1;
        document.getElementById('homes5Min').value = location.homes_5min;
        document.getElementById('percentHomes5').value = location.percent_homes_5;
        document.getElementById('homes10Min').value = location.homes_10min;
        document.getElementById('percentHomes10').value = location.percent_homes_10;
        document.getElementById('percentNSED').value = location.percent_nse_d;
        document.getElementById('percentNSECMinus').value = location.percent_nse_c_minus;
        document.getElementById('percentNSECPlus').value = location.percent_nse_c_plus;
        document.getElementById('percentNSEB').value = location.percent_nse_b;
        document.getElementById('percentExpenses').value = location.percent_expenses;
    } else {
        document.getElementById('modalTitle').textContent = 'Nueva Localidad';
        locationForm.reset();
        document.getElementById('locationId').value = '';
        document.getElementById('mobilityZone').value = '1';
        updatePercentagesFromZone('1');
    }
    
    // Cargar ingresos globales (readonly)
    document.getElementById('incomeD').value = globalConfig.income_d;
    document.getElementById('incomeCMinus').value = globalConfig.income_c_minus;
    document.getElementById('incomeCPlus').value = globalConfig.income_c_plus;
    document.getElementById('incomeB').value = globalConfig.income_b;
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    locationForm.reset();
}

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
                    <td>${location.id}</td>
                    <td>${location.name}</td>
                    <td>${zoneName}</td>
                    <td>
                        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="location-link" title="Ver en Google Maps">
                            📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
                        </a>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-info" onclick="window.viewEvaluation(${location.id})">Ver Evaluación</button>
                            <button class="btn btn-success" onclick="window.editLocation(${location.id})">Editar</button>
                            <button class="btn btn-danger" onclick="window.deleteLocationHandler(${location.id})">Eliminar</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No se encontraron localidades</td></tr>';
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

function editLocationHandler(id) {
    try {
        const location = getLocationById(id);
        if (location) {
            openModal(location);
        } else {
            alert('Localidad no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la localidad');
    }
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

function openConfigModal() {
    loadMobilityZones();
    
    // Cargar datos de zonas de movilidad en formato tabla
    const zonesConfig = document.getElementById('zonesConfig');
    
    zonesConfig.innerHTML = '';
    
    // Crear tabla de configuración de zonas
    const tableHTML = `
        <h3 style="margin-top: 20px; margin-bottom: 15px;">Parámetros de Movilidad por Zona</h3>
        <div class="table-container">
            <table class="config-table">
                <thead>
                    <tr>
                        <th>Zona de Movilidad</th>
                        <th>% Hogares 5min</th>
                        <th>% Hogares 10min</th>
                        <th>% Gastos</th>
                    </tr>
                </thead>
                <tbody>
                    ${mobilityZones.map(zone => `
                        <tr>
                            <td><strong>${zone.name}</strong></td>
                            <td>
                                <div class="input-with-symbol" data-symbol="%">
                                    <input type="number" step="0.01" class="zone-percent-5" data-zone-id="${zone.id}" value="${zone.percent_homes_5}" required>
                                </div>
                            </td>
                            <td>
                                <div class="input-with-symbol" data-symbol="%">
                                    <input type="number" step="0.01" class="zone-percent-10" data-zone-id="${zone.id}" value="${zone.percent_homes_10}" required>
                                </div>
                            </td>
                            <td>
                                <div class="input-with-symbol" data-symbol="%">
                                    <input type="number" step="0.01" class="zone-percent-expenses" data-zone-id="${zone.id}" value="${zone.percent_expenses}" required>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    zonesConfig.innerHTML = tableHTML;
    
    // Cargar datos de ingresos NSE
    const globalConfig = getGlobalConfig();
    document.getElementById('globalIncomeD').value = globalConfig.income_d;
    document.getElementById('globalIncomeCMinus').value = globalConfig.income_c_minus;
    document.getElementById('globalIncomeCPlus').value = globalConfig.income_c_plus;
    document.getElementById('globalIncomeB').value = globalConfig.income_b;
    
    // Mostrar la sección de zonas por defecto
    switchMainTab('zones');
    
    configModal.style.display = 'block';
}

function switchMainTab(section) {
    // Cambiar tabs activos
    document.querySelectorAll('.main-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.config-section-container').forEach(container => container.classList.remove('active'));
    
    if (section === 'zones') {
        document.querySelector('.main-tabs .tab-button:first-child').classList.add('active');
        document.getElementById('zonesSection').classList.add('active');
    } else if (section === 'incomes') {
        document.querySelector('.main-tabs .tab-button:last-child').classList.add('active');
        document.getElementById('incomesSection').classList.add('active');
    }
}

function closeConfigModal() {
    configModal.style.display = 'none';
}

configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        mobilityZones.forEach(zone => {
            const percent5Input = document.querySelector(`.zone-percent-5[data-zone-id="${zone.id}"]`);
            const percent10Input = document.querySelector(`.zone-percent-10[data-zone-id="${zone.id}"]`);
            const percentExpensesInput = document.querySelector(`.zone-percent-expenses[data-zone-id="${zone.id}"]`);
            
            const update = {
                percent_homes_5: parseFloat(percent5Input.value),
                percent_homes_10: parseFloat(percent10Input.value),
                percent_expenses: parseFloat(percentExpensesInput.value)
            };
            
            updateMobilityZone(zone.id, update);
        });
        
        loadMobilityZones();
        closeConfigModal();
        alert('Configuración guardada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la configuración');
    }
});

globalConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const globalConfig = {
            income_d: parseFloat(document.getElementById('globalIncomeD').value),
            income_c_minus: parseFloat(document.getElementById('globalIncomeCMinus').value),
            income_c_plus: parseFloat(document.getElementById('globalIncomeCPlus').value),
            income_b: parseFloat(document.getElementById('globalIncomeB').value)
        };
        
        updateGlobalConfig(globalConfig);
        closeGlobalConfigModal();
        alert('✅ Configuración de ingresos NSE guardada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar la configuración');
    }
});

// Funciones de Importación/Exportación
function handleExportData() {
    try {
        const data = exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `retail-foundry-backup-${timestamp}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Datos exportados exitosamente');
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('❌ Error al exportar los datos. Por favor, intente nuevamente.');
    }
}

function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        alert('❌ Por favor, seleccione un archivo JSON válido.');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validar estructura básica
            if (!data.locations || !data.competitors || !data.cannibalizations || !data.mobilityZones) {
                throw new Error('Estructura de datos inválida');
            }
            
            // Confirmar con el usuario
            const confirmMsg = `¿Está seguro de que desea importar estos datos?\n\n` +
                `Localidades: ${data.locations.length}\n` +
                `Competidores: ${data.competitors.length}\n` +
                `Canibalizaciones: ${data.cannibalizations.length}\n` +
                `Zonas de Movilidad: ${data.mobilityZones.length}\n\n` +
                `⚠️ ADVERTENCIA: Esto reemplazará todos los datos actuales.`;
            
            if (confirm(confirmMsg)) {
                importData(data);
                
                // Recargar datos en la interfaz
                loadMobilityZones();
                loadLocations();
                
                alert('✅ Datos importados exitosamente');
            }
        } catch (error) {
            console.error('Error al importar datos:', error);
            alert('❌ Error al importar los datos. Verifique que el archivo sea válido.');
        }
        
        // Limpiar el input
        event.target.value = '';
    };
    
    reader.onerror = () => {
        alert('❌ Error al leer el archivo.');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Exponer funciones globalmente para onclick handlers
window.viewEvaluation = viewEvaluation;
window.editLocation = editLocationHandler;
window.deleteLocationHandler = deleteLocationHandler;
window.switchMainTab = switchMainTab;

// Inicializar
loadMobilityZones();
loadLocationTypes();
loadLocations();
