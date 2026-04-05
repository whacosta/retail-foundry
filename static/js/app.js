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

const modal = document.getElementById('modal');
const configModal = document.getElementById('configModal');
const newLocationBtn = document.getElementById('newLocationBtn');
const configBtn = document.getElementById('configBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const importFileInput = document.getElementById('importFileInput');
const closeBtn = document.getElementsByClassName('close')[0];
const closeConfigBtn = document.getElementsByClassName('close-config')[0];
const cancelBtn = document.getElementById('cancelBtn');
const cancelConfigBtn = document.getElementById('cancelConfigBtn');
const cancelGlobalConfigBtn = document.getElementById('cancelGlobalConfigBtn');
const cancelViabilityConfigBtn = document.getElementById('cancelViabilityConfigBtn');
const locationForm = document.getElementById('locationForm');
const configForm = document.getElementById('configForm');
const globalConfigForm = document.getElementById('globalConfigForm');
const viabilityConfigForm = document.getElementById('viabilityConfigForm');
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

cancelViabilityConfigBtn.onclick = () => {
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
        provincia: document.getElementById('provincia').value,
        canton: document.getElementById('canton').value,
        parroquia: document.getElementById('parroquia').value,
        direccion: document.getElementById('direccion').value,
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
        document.getElementById('provincia').value = location.provincia || '';
        document.getElementById('canton').value = location.canton || '';
        document.getElementById('parroquia').value = location.parroquia || '';
        document.getElementById('direccion').value = location.direccion || '';
        document.getElementById('mobilityZone').value = location.mobility_zone_id || 1;
        document.getElementById('homes5Min').value = location.homes_5min;
        document.getElementById('homes10Min').value = location.homes_10min;
        document.getElementById('percentNSED').value = location.percent_nse_d;
        document.getElementById('percentNSECMinus').value = location.percent_nse_c_minus;
        document.getElementById('percentNSECPlus').value = location.percent_nse_c_plus;
        document.getElementById('percentNSEB').value = location.percent_nse_b;
        updatePercentagesFromZone(location.mobility_zone_id || 1);
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
                            <button class="btn btn-success" onclick="window.editLocation(${location.id})">Editar</button>
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
        document.querySelector('.main-tabs .tab-button:nth-child(1)').classList.add('active');
        document.getElementById('zonesSection').classList.add('active');
    } else if (section === 'incomes') {
        document.querySelector('.main-tabs .tab-button:nth-child(2)').classList.add('active');
        document.getElementById('incomesSection').classList.add('active');
    } else if (section === 'viability') {
        document.querySelector('.main-tabs .tab-button:nth-child(3)').classList.add('active');
        document.getElementById('viabilitySection').classList.add('active');
        loadViabilityConfig();
    } else if (section === 'constants') {
        document.querySelector('.main-tabs .tab-button:nth-child(4)').classList.add('active');
        document.getElementById('constantsSection').classList.add('active');
        loadConstantsConfig();
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

// Configuración de Constantes del Sistema (solo lectura)
function loadConstantsConfig() {
    const container = document.getElementById('constantsConfig');
    
    let html = `
        <!-- Matriz de Afinidad por Tipo -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">📊 Matriz de Afinidad por Tipo (Similarity Type)</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Define la similitud entre diferentes tipos de competidores. Valores entre 0 y 1.
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            ${COMPETITOR_TYPES.map(type => `<th>${type}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${COMPETITOR_TYPES.map(rowType => `
                            <tr>
                                <td><strong>${rowType}</strong></td>
                                ${COMPETITOR_TYPES.map(colType => `
                                    <td style="text-align: center;">${TYPE_AFFINITY_MATRIX[rowType][colType].toFixed(2)}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Rangos de Captura por Tipo y Zona -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">🎯 Rangos de Captura de Mercado (%)</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Porcentaje mínimo y máximo de captura de mercado según tipo de formato y zona de movilidad.
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Formato</th>
                            <th>Zona Popular</th>
                            <th>Zona Media</th>
                            <th>Zona Alta</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${COMPETITOR_TYPES.map(type => `
                            <tr>
                                <td><strong>${type}</strong></td>
                                <td>${CAPTURE_RANGES[type].popular.min}% - ${CAPTURE_RANGES[type].popular.max}%</td>
                                <td>${CAPTURE_RANGES[type].media.min}% - ${CAPTURE_RANGES[type].media.max}%</td>
                                <td>${CAPTURE_RANGES[type].alta.min}% - ${CAPTURE_RANGES[type].alta.max}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Valores de Accesibilidad -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">🚶 Valores de Accesibilidad por Tipo</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Factor de accesibilidad según el tipo de formato. Valores entre 0 y 1.
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Formato</th>
                            <th>Accesibilidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${COMPETITOR_TYPES.map(type => `
                            <tr>
                                <td><strong>${type}</strong></td>
                                <td style="text-align: center;">${ACCESSIBILITY_VALUES[type].toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Factores de Mercado Efectivo -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">👥 Factores de Mercado Efectivo por NSE</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Porcentaje de la población de cada NSE que es mercado efectivo para cada tipo de formato.
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Formato</th>
                            <th>NSE B</th>
                            <th>NSE C+</th>
                            <th>NSE C-</th>
                            <th>NSE D</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${COMPETITOR_TYPES.map(type => `
                            <tr>
                                <td><strong>${type}</strong></td>
                                <td style="text-align: center;">${(EFFECTIVE_MARKET_FACTORS[type].b * 100).toFixed(0)}%</td>
                                <td style="text-align: center;">${(EFFECTIVE_MARKET_FACTORS[type].c_plus * 100).toFixed(0)}%</td>
                                <td style="text-align: center;">${(EFFECTIVE_MARKET_FACTORS[type].c_minus * 100).toFixed(0)}%</td>
                                <td style="text-align: center;">${(EFFECTIVE_MARKET_FACTORS[type].d * 100).toFixed(0)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Umbrales de Distancia -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">📏 Umbrales de Distancia</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Distancias de referencia utilizadas en los cálculos de proximidad.
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Distancia (metros)</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Cercano</strong></td>
                            <td style="text-align: center;">≤ ${DISTANCE_THRESHOLDS.close}m</td>
                            <td>Competidor muy próximo</td>
                        </tr>
                        <tr>
                            <td><strong>Medio</strong></td>
                            <td style="text-align: center;">≤ ${DISTANCE_THRESHOLDS.medium}m</td>
                            <td>Competidor a distancia media</td>
                        </tr>
                        <tr>
                            <td><strong>Lejano</strong></td>
                            <td style="text-align: center;">> ${DISTANCE_THRESHOLDS.medium}m</td>
                            <td>Competidor distante</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Fórmulas de Cálculo -->
        <div style="margin-bottom: 30px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">🧮 Fórmulas de Cálculo Principales</h4>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
                Fórmulas utilizadas en el sistema para calcular métricas clave.
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Proximity (Proximidad):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        proximity = 1 / (1 + distance / umbral)
                    </code>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Size Similarity (Similitud de Tamaño):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        sizeSimilarity = MIN(1, (CompetitorSize / LocationSize)^0.5)
                    </code>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Affinity (Afinidad):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        affinity = typeSimilarity × sizeSimilarity
                    </code>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Impact (Impacto):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        impact = affinity × proximity × 0.6
                    </code>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Competition Norm (Normalización de Competencia):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        competitionNorm = sumCompetitionImpacts / (1 + sumCompetitionImpacts)
                    </code>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #333;">Score (Puntuación):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        score = 0.6 × accessibility + 0.4 × (1 - competitionNorm)
                    </code>
                </div>
                <div>
                    <strong style="color: #333;">Share (Participación de Mercado):</strong>
                    <code style="display: block; background: white; padding: 10px; margin-top: 5px; border-radius: 4px;">
                        share = min + (max - min) × score
                    </code>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Configuración de Criterios de Viabilidad
function loadViabilityConfig() {
    const viabilityCriteria = getViabilityCriteria();
    const container = document.getElementById('viabilityConfig');
    
    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tipo de Localidad</th>
                        <th>Mínimo Viable ($)</th>
                        <th>Óptimo ($)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    COMPETITOR_TYPES.forEach(type => {
        const criteria = viabilityCriteria[type] || { minViable: 160000, optimal: 180000 };
        html += `
            <tr>
                <td><strong>${type}</strong></td>
                <td>
                    <input type="number" 
                           id="minViable_${type}" 
                           class="viability-input" 
                           data-type="${type}" 
                           value="${criteria.minViable}" 
                           step="1000" 
                           required
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
                <td>
                    <input type="number" 
                           id="optimal_${type}" 
                           class="viability-input" 
                           data-type="${type}" 
                           value="${criteria.optimal}" 
                           step="1000" 
                           required
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

viabilityConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const viabilityCriteria = {};
        
        COMPETITOR_TYPES.forEach(type => {
            const minViable = parseFloat(document.getElementById(`minViable_${type}`).value);
            const optimal = parseFloat(document.getElementById(`optimal_${type}`).value);
            
            if (optimal <= minViable) {
                throw new Error(`El valor óptimo debe ser mayor que el mínimo viable para ${type}`);
            }
            
            viabilityCriteria[type] = {
                minViable: minViable,
                optimal: optimal
            };
        });
        
        updateViabilityCriteria(viabilityCriteria);
        closeConfigModal();
        alert('✅ Criterios de viabilidad guardados exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    }
});

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
window.editLocation = editLocationHandler;
window.deleteLocationHandler = deleteLocationHandler;
window.switchMainTab = switchMainTab;

// Inicializar
loadMobilityZones();
loadLocationTypes();
loadLocations();
