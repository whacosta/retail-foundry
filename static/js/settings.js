import {
    getMobilityZones,
    updateMobilityZone,
    getGlobalConfig,
    updateGlobalConfig,
    getViabilityCriteria,
    updateViabilityCriteria
} from './storage.js';

import {
    COMPETITOR_TYPES,
    TYPE_AFFINITY_MATRIX,
    CAPTURE_RANGES,
    ACCESSIBILITY_VALUES,
    EFFECTIVE_MARKET_FACTORS,
    DISTANCE_THRESHOLDS
} from './constants.js';

let mobilityZones = [];

// Inicializar la página de configuración
function initConfiguration() {
    loadMobilityZones();
    loadGlobalConfig();
    switchMainTab('zones');
}

// Cargar zonas de movilidad
function loadMobilityZones() {
    try {
        mobilityZones = getMobilityZones();
        
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
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar configuración global
function loadGlobalConfig() {
    try {
        const globalConfig = getGlobalConfig();
        document.getElementById('globalIncomeD').value = globalConfig.income_d;
        document.getElementById('globalIncomeCMinus').value = globalConfig.income_c_minus;
        document.getElementById('globalIncomeCPlus').value = globalConfig.income_c_plus;
        document.getElementById('globalIncomeB').value = globalConfig.income_b;
    } catch (error) {
        console.error('Error al cargar config global:', error);
    }
}

// Cambiar entre pestañas
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
    } else if (section === 'routingConfig') {
        document.querySelector('.main-tabs .tab-button:nth-child(5)').classList.add('active');
        document.getElementById('routingConfigSection').classList.add('active');
        loadConfigurationValues();
    }
}

// Cargar configuración de Constantes del Sistema (solo lectura)
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

// Cargar configuración de Criterios de Viabilidad
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

// Volver al inicio
function goBackToIndex() {
    window.location.href = 'index.html';
}

// Event Listeners para Formularios

// Formulario de Zonas de Movilidad
document.getElementById('configForm').addEventListener('submit', async (e) => {
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
        
        alert('✅ Configuración de zonas guardada exitosamente');
        goBackToIndex();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar la configuración');
    }
});

// Formulario de Ingresos NSE
document.getElementById('globalConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const globalConfig = {
            income_d: parseFloat(document.getElementById('globalIncomeD').value),
            income_c_minus: parseFloat(document.getElementById('globalIncomeCMinus').value),
            income_c_plus: parseFloat(document.getElementById('globalIncomeCPlus').value),
            income_b: parseFloat(document.getElementById('globalIncomeB').value)
        };
        
        updateGlobalConfig(globalConfig);
        alert('✅ Configuración de ingresos NSE guardada exitosamente');
        goBackToIndex();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar la configuración');
    }
});

// Formulario de Criterios de Viabilidad
document.getElementById('viabilityConfigForm').addEventListener('submit', async (e) => {
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
        alert('✅ Criterios de viabilidad guardados exitosamente');
        goBackToIndex();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ' + error.message);
    }
});

// ==========================================
// Configuración de OpenRouteService + INEC
// ==========================================

// Cargar valores previamente guardados
function loadConfigurationValues() {
    const orsConfig = JSON.parse(localStorage.getItem('openRouteServiceConfig') || '{}');
    if (orsConfig.apiKey) {
        document.getElementById('orsApiKey').value = orsConfig.apiKey;
        document.getElementById('walkingTime').value = orsConfig.walkingSeconds || 300;
        document.getElementById('drivingTime').value = orsConfig.drivingSeconds || 600;
    }
    
    const inecConfig = JSON.parse(localStorage.getItem('inecConfig') || '{}');
    if (inecConfig.inecDataPath) {
        document.getElementById('inecPath').value = inecConfig.inecDataPath;
        document.getElementById('inecPopulationFile').value = inecConfig.inecPopulationFile || 'population_2020.geojson';
        document.getElementById('inecSectoresFile').value = inecConfig.inecSectoresFile || 'sectores_censales.geojson';
    }
}

// Guardar OpenRouteService
function saveOpenRouteServiceConfig() {
    const apiKey = document.getElementById('orsApiKey').value.trim();
    const walkingTime = parseInt(document.getElementById('walkingTime').value) || 300;
    const drivingTime = parseInt(document.getElementById('drivingTime').value) || 600;
    
    if (!apiKey) {
        alert('❌ Por favor ingresa una API Key');
        return;
    }
    
    if (apiKey.length < 20) {
        alert('❌ API Key parece incompleta (debe tener más de 20 caracteres)');
        return;
    }
    
    const config = {
        apiKey: apiKey,
        walkingSeconds: walkingTime,
        drivingSeconds: drivingTime,
        updatedAt: new Date().toISOString()
    };
    
    localStorage['openRouteServiceConfig'] = JSON.stringify(config);
    alert('✅ Configuración OpenRouteService guardada correctamente');
}

// Guardar INEC
function saveInecConfig() {
    let inecPath = document.getElementById('inecPath').value.trim();
    const popFile = document.getElementById('inecPopulationFile').value.trim();
    
    if (!inecPath) {
        alert('❌ Por favor especifica una ruta válida');
        return;
    }
    
    // Asegurar que termina con /
    if (!inecPath.endsWith('/')) {
        inecPath += '/';
    }
    
    const config = {
        inecDataPath: inecPath,
        inecPopulationFile: popFile || 'population_2020.geojson',
        inecSectoresFile: document.getElementById('inecSectoresFile').value.trim() || 'sectores_censales.geojson',
        updatedAt: new Date().toISOString()
    };
    
    // Validación simple: verificar que la ruta es válida
    const testPath = config.inecDataPath + config.inecPopulationFile;
    
    // Guardar configuración
    localStorage['inecConfig'] = JSON.stringify(config);
    
    // Mostrar confirmación de guardado
    const validDiv = document.getElementById('inecValidation');
    validDiv.innerHTML = '✅ <strong>Configuración guardada correctamente</strong><br>' +
        '<small>Archivo esperado en: <code style="background:#f5f5f5; padding:2px 4px; border-radius:2px;">' + testPath + '</code></small><br>' +
        '<small style="color:#666;">Los datos se cargarán cuando abras <strong>location.html</strong></small>';
    validDiv.style.display = 'block';
}

// Exponer funciones globalmente para onclick handlers
window.switchMainTab = switchMainTab;
window.goBackToIndex = goBackToIndex;
window.saveOpenRouteServiceConfig = saveOpenRouteServiceConfig;
window.saveInecConfig = saveInecConfig;
window.loadConfigurationValues = loadConfigurationValues;

// Inicializar página
document.addEventListener('DOMContentLoaded', initConfiguration);
