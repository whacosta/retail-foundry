// Evaluation page for Retail Foundry - SPA Version
import { COMPETITOR_TYPES } from './constants.js';
import {
    getLocations,
    getLocationById,
    getCompetitorsByLocationId,
    getCannibalizationsByLocationId,
    getCannibalizations,
    getMobilityZones,
    getMobilityZoneById,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    createCannibalization,
    updateCannibalization,
    deleteCannibalization,
    getViabilityCriteria
} from './storage.js';
import { 
    calculateEvaluation, 
    calculateViability,
    calculateCompetitorMetrics,
    calculateCompetitionLevel,
    calculateCompetitionNorm,
    calculateScore,
    getCaptureRange,
    calculateShare,
    calculateProximity
} from './calculations.js';

// Get location ID from URL
const urlParams = new URLSearchParams(window.location.search);
const locationId = parseInt(urlParams.get('id'));

let currentLocation = null;
let currentZone = null;
let competitors = [];
let cannibalizations = [];

// Modal elements
const competitorModal = document.getElementById('competitorModal');
const cannibalizationModal = document.getElementById('cannibalizationModal');
const competitorForm = document.getElementById('competitorForm');
const cannibalizationForm = document.getElementById('cannibalizationForm');

// Initialize page
function init() {
    if (!locationId) {
        alert('ID de localidad no especificado');
        window.location.href = 'index.html';
        return;
    }
    
    currentLocation = getLocationById(locationId);
    if (!currentLocation) {
        alert('Localidad no encontrada');
        window.location.href = 'index.html';
        return;
    }
    
    currentZone = getMobilityZoneById(currentLocation.mobility_zone_id);
    competitors = getCompetitorsByLocationId(locationId);
    cannibalizations = getCannibalizationsByLocationId(locationId);
    
    loadCompetitorTypes();
    setupEventListeners();
    renderEvaluation();
}

function loadCompetitorTypes() {
    const select = document.getElementById('competitorType');
    select.innerHTML = '<option value="">Seleccione un tipo...</option>';
    COMPETITOR_TYPES.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Competitor modal
    const closeCompetitorBtn = document.querySelector('.close-competitor');
    const cancelCompetitorBtn = document.getElementById('cancelCompetitorBtn');
    
    closeCompetitorBtn.onclick = () => closeCompetitorModal();
    cancelCompetitorBtn.onclick = () => closeCompetitorModal();
    
    competitorForm.addEventListener('submit', handleCompetitorSubmit);
    
    // Update calculations when form changes
    document.getElementById('competitorType').addEventListener('change', updateCalculations);
    document.getElementById('competitorSize').addEventListener('input', updateCalculations);
    document.getElementById('competitorProximity').addEventListener('input', updateCalculations);
    
    // Cannibalization modal
    const closeCannibalizationBtn = document.querySelector('.close-cannibalization');
    const cancelCannibalizationBtn = document.getElementById('cancelCannibalizationBtn');
    
    closeCannibalizationBtn.onclick = () => closeCannibalizationModal();
    cancelCannibalizationBtn.onclick = () => closeCannibalizationModal();
    
    cannibalizationForm.addEventListener('submit', handleCannibalizationSubmit);
    
    // Update cannibalization calculations when form changes
    document.getElementById('cannibalizationSize').addEventListener('input', updateCannibalizationCalculations);
    document.getElementById('cannibalizationProximity').addEventListener('input', updateCannibalizationCalculations);
    
    // Close modals on outside click
    window.onclick = (event) => {
        if (event.target === competitorModal) {
            closeCompetitorModal();
        }
        if (event.target === cannibalizationModal) {
            closeCannibalizationModal();
        }
    };
}

function updateCalculations() {
    const type = document.getElementById('competitorType').value;
    const size = parseFloat(document.getElementById('competitorSize').value);
    const proximity = parseFloat(document.getElementById('competitorProximity').value);
    
    if (!type || !size || !proximity || !currentLocation.type || !currentLocation.size) {
        document.getElementById('calculationResults').style.display = 'none';
        return;
    }
    
    const tempCompetitor = {
        type,
        size,
        proximity
    };
    
    const metrics = calculateCompetitorMetrics(tempCompetitor, currentLocation, currentZone);
    
    document.getElementById('calcTypeSimilarity').textContent = metrics.typeSimilarity.toFixed(4);
    document.getElementById('calcSizeSimilarity').textContent = metrics.sizeSimilarity.toFixed(4);
    document.getElementById('calcAffinity').textContent = metrics.affinity.toFixed(4);
    document.getElementById('calcProximity').textContent = metrics.proximity.toFixed(4);
    document.getElementById('calcImpact').textContent = metrics.impact.toFixed(4);
    document.getElementById('calcAccessibility').textContent = metrics.accessibility.toFixed(4);
    
    document.getElementById('calculationResults').style.display = 'block';
}

function updateCannibalizationCalculations() {
    const cannSize = parseFloat(document.getElementById('cannibalizationSize').value);
    const distance = parseFloat(document.getElementById('cannibalizationProximity').value);
    
    if (!cannSize || !distance || !currentLocation.size) {
        document.getElementById('cannibalizationCalculationResults').style.display = 'none';
        return;
    }
    
    // Calcular Proximity
    const proximity = calculateProximity(distance);
    
    // Calcular SizeFactor: MIN(1, (CannSize/LocSize)^0.5)
    const sizeFactor = Math.min(1, Math.pow(cannSize / currentLocation.size, 0.5));
    
    // Calcular Base: 0.7 × Proximity + 0.3 × SizeFactor
    const base = 0.7 * proximity + 0.3 * sizeFactor;
    
    // Calcular cannibalizationFactor: Base × Proximity × SizeFactor
    const cannibalizationFactor = base * proximity * sizeFactor;
    
    // Calcular Impact: Proximity × cannibalizationFactor
    const impact = proximity * cannibalizationFactor;
    
    document.getElementById('calcCannProximity').textContent = proximity.toFixed(4);
    document.getElementById('calcCannSizeFactor').textContent = sizeFactor.toFixed(4);
    document.getElementById('calcCannBase').textContent = base.toFixed(4);
    document.getElementById('calcCannFactor').textContent = cannibalizationFactor.toFixed(4);
    document.getElementById('calcCannImpact').textContent = impact.toFixed(4);
    
    document.getElementById('cannibalizationCalculationResults').style.display = 'block';
}

function handleCompetitorSubmit(e) {
    e.preventDefault();
    
    const competitorId = document.getElementById('competitorId').value;
    const competitorData = {
        location_id: locationId,
        name: document.getElementById('competitorName').value,
        type: document.getElementById('competitorType').value,
        size: parseFloat(document.getElementById('competitorSize').value),
        proximity: parseFloat(document.getElementById('competitorProximity').value)
    };
    
    try {
        if (competitorId) {
            updateCompetitor(parseInt(competitorId), competitorData);
        } else {
            createCompetitor(competitorData);
        }
        
        closeCompetitorModal();
        // Reload data and re-render
        competitors = getCompetitorsByLocationId(locationId);
        renderEvaluation();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el competidor');
    }
}

function handleCannibalizationSubmit(e) {
    e.preventDefault();
    
    const cannibalizationId = document.getElementById('cannibalizationId').value;
    const cannSize = parseFloat(document.getElementById('cannibalizationSize').value);
    const distance = parseFloat(document.getElementById('cannibalizationProximity').value);
    
    // Calcular cannibalizationFactor automáticamente
    const proximity = calculateProximity(distance);
    const sizeFactor = Math.min(1, Math.pow(cannSize / currentLocation.size, 0.5));
    const base = 0.7 * proximity + 0.3 * sizeFactor;
    const cannibalizationFactor = base * proximity * sizeFactor;
    
    const cannibalizationData = {
        location_id: locationId,
        name: document.getElementById('cannibalizationName').value,
        size: cannSize,
        proximity: distance,
        cannibalizationFactor: cannibalizationFactor
    };
    
    try {
        if (cannibalizationId) {
            const updated = updateCannibalization(parseInt(cannibalizationId), cannibalizationData);
        } else {
            const created = createCannibalization(cannibalizationData);
        }
        
        closeCannibalizationModal();
        // Reload data and re-render
        cannibalizations = getCannibalizationsByLocationId(locationId);
        renderEvaluation();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la canibalización');
    }
}

function openCompetitorModal(competitor = null) {
    if (competitor) {
        document.getElementById('competitorModalTitle').textContent = 'Editar Competidor';
        document.getElementById('competitorId').value = competitor.id;
        document.getElementById('competitorName').value = competitor.name;
        document.getElementById('competitorType').value = competitor.type;
        document.getElementById('competitorSize').value = competitor.size;
        document.getElementById('competitorProximity').value = competitor.proximity;
        updateCalculations();
    } else {
        document.getElementById('competitorModalTitle').textContent = 'Agregar Competidor';
        competitorForm.reset();
        document.getElementById('competitorId').value = '';
        document.getElementById('locationId').value = locationId;
        document.getElementById('calculationResults').style.display = 'none';
    }
    competitorModal.style.display = 'block';
}

function closeCompetitorModal() {
    competitorModal.style.display = 'none';
    competitorForm.reset();
    document.getElementById('calculationResults').style.display = 'none';
}

function openCannibalizationModal(cannibalization = null) {
    if (cannibalization) {
        document.getElementById('cannibalizationModalTitle').textContent = 'Editar Canibalización';
        document.getElementById('cannibalizationId').value = cannibalization.id;
        document.getElementById('cannibalizationName').value = cannibalization.name;
        document.getElementById('cannibalizationSize').value = cannibalization.size;
        document.getElementById('cannibalizationProximity').value = cannibalization.proximity;
        updateCannibalizationCalculations();
    } else {
        document.getElementById('cannibalizationModalTitle').textContent = 'Agregar Canibalización';
        cannibalizationForm.reset();
        document.getElementById('cannibalizationId').value = '';
        document.getElementById('cannLocationId').value = locationId;
        document.getElementById('cannibalizationCalculationResults').style.display = 'none';
    }
    cannibalizationModal.style.display = 'block';
}

function closeCannibalizationModal() {
    cannibalizationModal.style.display = 'none';
    cannibalizationForm.reset();
    document.getElementById('cannibalizationCalculationResults').style.display = 'none';
}

function deleteCompetitorHandler(id) {
    if (confirm('¿Está seguro de que desea eliminar este competidor?')) {
        try {
            deleteCompetitor(id);
            competitors = getCompetitorsByLocationId(locationId);
            renderEvaluation();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el competidor');
        }
    }
}

function deleteCannibalizationHandler(id) {
    if (confirm('¿Está seguro de que desea eliminar esta canibalización?')) {
        try {
            const result = deleteCannibalization(id);
            
            // Obtener todas las canibalizaciones para debug
            const allCanns = getCannibalizations();
            
            cannibalizations = getCannibalizationsByLocationId(locationId);
            renderEvaluation();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar la canibalización');
        }
    }
}

function switchAdjustmentTab(tabName) {
    const tabContents = document.querySelectorAll('.adjustment-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.adjustment-tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    if (tabName === 'competition') {
        document.getElementById('competitionTab').classList.add('active');
        tabButtons[0].classList.add('active');
    } else if (tabName === 'cannibalization') {
        document.getElementById('cannibalizationTab').classList.add('active');
        tabButtons[1].classList.add('active');
    }
}

function renderEvaluation() {
    const evaluation = calculateEvaluation(currentLocation);
    
    // Calculate competitors with metrics
    const competitorsWithMetrics = competitors.map(comp => {
        const metrics = calculateCompetitorMetrics(comp, currentLocation, currentZone);
        return { ...comp, metrics };
    });
    
    // Calculate global competition metrics
    const allImpacts = competitorsWithMetrics.map(comp => comp.metrics.impact);
    const competitionLevel = calculateCompetitionLevel(allImpacts);
    const competitionNorm = calculateCompetitionNorm(competitionLevel);
    
    // Calculate global accessibility (promedio de todos los competidores)
    const avgAccessibility = competitorsWithMetrics.length > 0
        ? competitorsWithMetrics.reduce((sum, comp) => sum + comp.metrics.accessibility, 0) / competitorsWithMetrics.length
        : 0;
    
    // Calculate global score
    const score = calculateScore(avgAccessibility, competitionNorm);
    
    // Get capture range (usando promedio ponderado por accessibility o valores por defecto)
    let captureRange = { min: 0, max: 0 };
    if (competitorsWithMetrics.length > 0) {
        // Usar el tipo del competidor con mayor accessibility como referencia
        const sortedByAccessibility = [...competitorsWithMetrics].sort((a, b) => b.metrics.accessibility - a.metrics.accessibility);
        captureRange = getCaptureRange(sortedByAccessibility[0].type, currentZone.name);
    }
    
    // Calculate global share
    const share = calculateShare(score, captureRange);
    
    // Calculate cannibalizations with metrics (filtrar datos antiguos sin los nuevos campos)
    const cannibalizationsWithMetrics = cannibalizations
        .filter(cann => cann.size && cann.proximity !== undefined && cann.cannibalizationFactor)
        .map(cann => {
            const proximity = calculateProximity(cann.proximity);
            const impact = proximity * cann.cannibalizationFactor;
            return { 
                id: cann.id,
                location_id: cann.location_id,
                name: cann.name,
                size: cann.size,
                proximity: cann.proximity,
                cannibalizationFactor: cann.cannibalizationFactor,
                proximityValue: proximity,
                impact: impact
            };
        });
    
    // Calculate cannibalization level and norm
    const cannibalizationLevel = cannibalizationsWithMetrics.reduce((sum, cann) => sum + cann.impact, 0);
    const cannibalizationNorm = cannibalizationLevel > 0 ? 1 - Math.exp(-cannibalizationLevel) : 0;
    
    // Calculate final adjusted expenses using corrected formulas
    const expensesAfterCompetition = evaluation.totalExpenses * (1 - competitionNorm);
    const totalAdjustedExpenses = expensesAfterCompetition * (share / 100);
    const cannibalizationAdjustmentAmount = totalAdjustedExpenses * cannibalizationNorm;
    const finalAdjustedExpenses = totalAdjustedExpenses * (1 - cannibalizationNorm);
    
    // Get viability criteria and calculate viability
    const viabilityCriteria = getViabilityCriteria();
    const viability = calculateViability(finalAdjustedExpenses, currentLocation.type, viabilityCriteria);
    
    const container = document.getElementById('evaluationContainer');
    container.innerHTML = `
        <div class="section">
            <h2>Información de la Localidad</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Nombre:</span>
                    <span class="value">${currentLocation.name}</span>
                </div>
                <div class="info-item">
                    <span class="label">Tipo:</span>
                    <span class="value">${currentLocation.type || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Tamaño:</span>
                    <span class="value">${currentLocation.size ? currentLocation.size.toFixed(2) + ' m²' : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Ubicación:</span>
                    <span class="value">
                        <a href="https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="location-link">
                            📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}
                        </a>
                    </span>
                </div>
                <div class="info-item">
                    <span class="label">Población Total:</span>
                    <span class="value">${evaluation.population.toFixed(2)} hogares</span>
                </div>
                <div class="info-item">
                    <span class="label">Hogares 5min:</span>
                    <span class="value">${currentLocation.homes_5min} (${currentLocation.percent_homes_5}%)</span>
                </div>
                <div class="info-item">
                    <span class="label">Hogares 10min:</span>
                    <span class="value">${currentLocation.homes_10min} (${currentLocation.percent_homes_10}%)</span>
                </div>
            </div>
        </div>

        <div class="section highlight-primary">
            <h2>🎯 Población Efectiva (Mercado Objetivo)</h2>
            <div class="big-number-primary">${evaluation.effectivePopulation.toFixed(2)} hogares</div>
            <div class="market-factor-info">
                <small>Factores de mercado para ${currentLocation.type}: 
                    B=${(evaluation.marketFactors.b * 100).toFixed(0)}%, 
                    C+=${(evaluation.marketFactors.c_plus * 100).toFixed(0)}%, 
                    C-=${(evaluation.marketFactors.c_minus * 100).toFixed(0)}%, 
                    D=${(evaluation.marketFactors.d * 100).toFixed(0)}%
                </small>
            </div>
        </div>

        <div class="section">
            <h2>Distribución por Nivel Socioeconómico</h2>
            <div class="nse-grid">
                <div class="nse-card">
                    <h3>NSE D</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_d}%</div>
                    <div class="nse-homes">${evaluation.homesD.toFixed(2)} hogares totales</div>
                    <div class="nse-effective">${evaluation.effectiveHomesD.toFixed(2)} hogares efectivos</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_d.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE C-</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_c_minus}%</div>
                    <div class="nse-homes">${evaluation.homesCMinus.toFixed(2)} hogares totales</div>
                    <div class="nse-effective">${evaluation.effectiveHomesCMinus.toFixed(2)} hogares efectivos</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_c_minus.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE C+</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_c_plus}%</div>
                    <div class="nse-homes">${evaluation.homesCPlus.toFixed(2)} hogares totales</div>
                    <div class="nse-effective">${evaluation.effectiveHomesCPlus.toFixed(2)} hogares efectivos</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_c_plus.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE B</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_b}%</div>
                    <div class="nse-homes">${evaluation.homesB.toFixed(2)} hogares totales</div>
                    <div class="nse-effective">${evaluation.effectiveHomesB.toFixed(2)} hogares efectivos</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_b.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Gastos Promedio por NSE (${currentLocation.percent_expenses}% de Gastos)</h2>
            <p class="section-description">Fórmula: Hogares Efectivos × Ingreso × % Gastos</p>
            <div class="expenses-grid">
                <div class="expense-item">
                    <span class="label">Gastos NSE D:</span>
                    <span class="value">$${evaluation.avgExpensesD.toFixed(2)}</span>
                </div>
                <div class="expense-item">
                    <span class="label">Gastos NSE C-:</span>
                    <span class="value">$${evaluation.avgExpensesCMinus.toFixed(2)}</span>
                </div>
                <div class="expense-item">
                    <span class="label">Gastos NSE C+:</span>
                    <span class="value">$${evaluation.avgExpensesCPlus.toFixed(2)}</span>
                </div>
                <div class="expense-item">
                    <span class="label">Gastos NSE B:</span>
                    <span class="value">$${evaluation.avgExpensesB.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="section viability-section">
            <div class="viability-grid">
                <div class="viability-column viability-criteria ${viability.color}">
                    <h2>Criterio de Viabilidad</h2>
                    <div class="viability-status">${viability.status}</div>
                    <div class="viability-details">
                        <p>Mínimo viable: $${viability.minViable.toLocaleString()}</p>
                        <p>Rango óptimo: $${viability.minViable.toLocaleString()} - $${viability.optimal.toLocaleString()}</p>
                    </div>
                </div>
                <div class="viability-column viability-box">
                    <h2>Gastos Totales Estimados</h2>
                    <div class="viability-value">$${evaluation.totalExpenses.toFixed(2)}</div>
                    <p class="viability-subtitle">Potencial de mercado mensual</p>
                </div>
                <div class="viability-column viability-box">
                    <h2>Gasto Final Ajustado</h2>
                    <div class="viability-value">$${finalAdjustedExpenses.toFixed(2)}</div>
                    <p class="viability-subtitle">Después de todos los ajustes</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Detalle de Cálculos de Gastos Ajustados</h2>
            <div class="adjustment-summary">
                <div class="adjustment-item">
                    <div>
                        <span class="label">1. Gastos después de Competencia:</span>
                        <span class="value">$${expensesAfterCompetition.toFixed(2)}</span>
                    </div>
                    <small class="formula-description">
                        <p>Formula: expensesAfterCompetition = totalExpenses × (1 - competitionNorm)</p>
                        <p>expensesAfterCompetition = $${evaluation.totalExpenses.toFixed(2)} × (1 - ${competitionNorm.toFixed(4)}) = $${expensesAfterCompetition.toFixed(2)}</p>
                    </small>
                </div>
                <div class="adjustment-item">
                    <div>
                        <span class="label">2. Gastos Ajustados por Share:</span>
                        <span class="value">$${totalAdjustedExpenses.toFixed(2)}</span>
                    </div>
                    <small class="formula-description">
                        <p>Formula: totalAdjustedExpenses = expensesAfterCompetition × share</p>
                        <p>totalAdjustedExpenses = $${expensesAfterCompetition.toFixed(2)} × ${(share / 100).toFixed(4)} = $${totalAdjustedExpenses.toFixed(2)}</p>
                    </small>
                </div>
                <div class="adjustment-item">
                    <div>
                        <span class="label">3. Gastos Finales (después de Canibalización):</span>
                        <span class="value">$${finalAdjustedExpenses.toFixed(2)}</span>
                    </div>
                    <small class="formula-description">
                        <p>Formula: finalAdjustedExpenses = totalAdjustedExpenses × (1 - cannibalizationNorm)</p>
                        <p>finalAdjustedExpenses = $${totalAdjustedExpenses.toFixed(2)} × (1 - ${cannibalizationNorm.toFixed(4)}) = $${finalAdjustedExpenses.toFixed(2)}</p>
                    </small>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Ajustes</h2>
            <div class="adjustment-tabs">
                <button class="adjustment-tab-button active" onclick="window.switchAdjustmentTab('competition')">Ajuste por Competencia</button>
                <button class="adjustment-tab-button" onclick="window.switchAdjustmentTab('cannibalization')">Ajuste por Canibalización</button>
            </div>

            <div id="competitionTab" class="adjustment-tab-content active">
                <div class="section-header">
                    <button id="addCompetitorBtn" class="btn btn-primary">+ Agregar Competidor</button>
                </div>
                
                <div class="table-container">
                    <table id="competitorsTable">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Tamaño (m²)</th>
                                <th>Proximidad (%)</th>
                                <th>Afinidad (%)</th>
                                <th>Accesibilidad (%)</th>
                                <th>Impact (%)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="competitorsTableBody">
                            ${competitorsWithMetrics.length > 0 ? competitorsWithMetrics.map(comp => `
                                <tr data-id="${comp.id}">
                                    <td>${comp.name}</td>
                                    <td>${comp.type}</td>
                                    <td>${comp.size.toFixed(2)}</td>
                                    <td>${(comp.metrics.proximity * 100).toFixed(2)}%</td>
                                    <td>${(comp.metrics.affinity * 100).toFixed(2)}%</td>
                                    <td>${(comp.metrics.accessibility * 100).toFixed(2)}%</td>
                                    <td>${(comp.metrics.impact * 100).toFixed(2)}%</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-success btn-sm" onclick="window.editCompetitorHandler(${comp.id})">Editar</button>
                                            <button class="btn btn-danger btn-sm" onclick="window.deleteCompetitorHandler(${comp.id})">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr id="noCompetitorsRow">
                                    <td colspan="8" style="text-align: center; padding: 20px;">No hay competidores registrados</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div class="adjustment-summary">
                    <div class="adjustment-item">
                        <div>
                            <span class="label">Score:</span>
                            <span class="value">${(score * 100).toFixed(2)}%</span>
                        </div>
                        <small class="formula-description">
                            <p>Formula: score = 0.6 × accessibility + 0.4 × (1 - competitionNorm)</p>
                            <p> competitionNorm = 1 - e^(-suma de todos los impactos) => competitionNorm = 1 - e^(-${competitionLevel.toFixed(4)}) = ${competitionNorm.toFixed(4)} </p>
                            <p>La Competencia Normal indica que se tiene una <strong>Perdida del ${((1 - competitionNorm) * 100).toFixed(2)}% de la cuota de mercado</strong></p>
                            <p>score = 0.6 × ${avgAccessibility.toFixed(4)} + 0.4 × (1 - ${competitionNorm.toFixed(4)}) = ${score.toFixed(4)}</p>
                        </small>
                    </div>
                    <div class="adjustment-item">
                        <div>
                            <span class="label">Share:</span>
                            <span class="value">${share.toFixed(2)}%</span>
                        </div>
                        <small class="formula-description">
                            <p>Formula: share = min + (max - min) × score</p>
                            <p>share = ${captureRange.min.toFixed(2)}% + (${captureRange.max.toFixed(2)}% - ${captureRange.min.toFixed(2)}%) × ${score.toFixed(4)} = ${share.toFixed(2)}%</p>
                        </small>
                    </div>
                    <div class="adjustment-item">
                        <div>
                            <span class="label">Monto del Ajuste:</span>
                            <span class="value adjustment-amount" id="adjustmentAmount">$${totalAdjustedExpenses.toFixed(2)}</span>
                        </div>
                        <small class="formula-description">
                            <p>Formula: totalAdjustedExpenses = totalExpenses × (1 - competitionNorm) × share</p>
                            <p>totalAdjustedExpenses = $${evaluation.totalExpenses.toFixed(2)} × (1 - ${competitionNorm.toFixed(4)}) × ${(share/100).toFixed(4)} = $${totalAdjustedExpenses.toFixed(2)}</p>
                        </small>
                    </div>
                </div>
            </div>

            <div id="cannibalizationTab" class="adjustment-tab-content">
                <div class="section-header">
                    <button id="addCannibalizationBtn" class="btn btn-primary">+ Agregar Canibalización</button>
                </div>
                
                <div class="table-container">
                    <table id="cannibalizationTable">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tamaño (m²)</th>
                                <th>Proximidad (%)</th>
                                <th>Factor (%)</th>
                                <th>Impact (%)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="cannibalizationTableBody">
                            ${cannibalizationsWithMetrics.length > 0 ? cannibalizationsWithMetrics.map(cann => `
                                <tr data-id="${cann.id}">
                                    <td>${cann.name}</td>
                                    <td>${cann.size.toFixed(2)}</td>
                                    <td>${(cann.proximityValue * 100).toFixed(2)}%</td>
                                    <td>${(cann.cannibalizationFactor * 100).toFixed(2)}%</td>
                                    <td>${(cann.impact * 100).toFixed(2)}%</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-success btn-sm" onclick="window.editCannibalizationHandler(${cann.id})">Editar</button>
                                            <button class="btn btn-danger btn-sm" onclick="window.deleteCannibalizationHandler(${cann.id})">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr id="noCannibalizationRow">
                                    <td colspan="6" style="text-align: center; padding: 20px;">No hay canibalizaciones registradas</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div class="adjustment-summary">
                    <div class="adjustment-item">
                        <div>
                            <span class="label">Cannibalization Norm:</span>
                            <span class="value" id="totalCannAdjustment">${(cannibalizationNorm * 100).toFixed(2)}%</span>
                        </div>
                        <small class="formula-description">
                            <p>Formula: cannibalizationNorm = 1 - e^(-cannibalizationLevel)</p>
                            <p>cannibalizationLevel = suma de todos los impactos => cannibalizationLevel = ${cannibalizationLevel.toFixed(4)}</p>
                            <p>cannibalizationNorm = 1 - e^(-${cannibalizationLevel.toFixed(4)}) = ${cannibalizationNorm.toFixed(4)}</p>
                        </small>
                    </div>
                    <div class="adjustment-item">
                        <div>
                            <span class="label">Monto del Ajuste:</span>
                            <span class="value adjustment-amount" id="cannAdjustmentAmount">-$${cannibalizationAdjustmentAmount.toFixed(2)}</span>
                        </div>
                        <small class="formula-description">
                            <p>Formula: cannibalizationAdjustmentAmount = totalAdjustedExpenses × cannibalizationNorm</p>
                            <p>cannibalizationAdjustmentAmount = $${totalAdjustedExpenses.toFixed(2)} × ${cannibalizationNorm.toFixed(4)} = $${cannibalizationAdjustmentAmount.toFixed(2)}</p>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Re-attach event listeners for dynamically created buttons
    document.getElementById('addCompetitorBtn').onclick = () => openCompetitorModal();
    document.getElementById('addCannibalizationBtn').onclick = () => openCannibalizationModal();
}

function editCompetitorHandler(id) {
    const competitor = competitors.find(c => c.id === id);
    if (competitor) {
        openCompetitorModal(competitor);
    }
}

function editCannibalizationHandler(id) {
    const cannibalization = cannibalizations.find(c => c.id === id);
    if (cannibalization) {
        openCannibalizationModal(cannibalization);
    }
}

// Expose functions globally for onclick handlers
window.switchAdjustmentTab = switchAdjustmentTab;
window.editCompetitorHandler = editCompetitorHandler;
window.deleteCompetitorHandler = deleteCompetitorHandler;
window.editCannibalizationHandler = editCannibalizationHandler;
window.deleteCannibalizationHandler = deleteCannibalizationHandler;

// Export evaluation results
function exportEvaluationResults() {
    const evaluation = calculateEvaluation(currentLocation);
    
    // Calculate competitors with metrics
    const competitorsWithMetrics = competitors.map(comp => {
        const metrics = calculateCompetitorMetrics(comp, currentLocation, currentZone);
        return { 
            id: comp.id,
            name: comp.name,
            type: comp.type,
            size: comp.size,
            proximity: comp.proximity,
            metrics: {
                typeSimilarity: metrics.typeSimilarity,
                sizeSimilarity: metrics.sizeSimilarity,
                affinity: metrics.affinity,
                proximity: metrics.proximity,
                impact: metrics.impact,
                accessibility: metrics.accessibility
            }
        };
    });
    
    // Calculate global competition metrics
    const allImpacts = competitorsWithMetrics.map(comp => comp.metrics.impact);
    const competitionLevel = calculateCompetitionLevel(allImpacts);
    const competitionNorm = calculateCompetitionNorm(competitionLevel);
    
    // Calculate global accessibility
    const avgAccessibility = competitorsWithMetrics.length > 0
        ? competitorsWithMetrics.reduce((sum, comp) => sum + comp.metrics.accessibility, 0) / competitorsWithMetrics.length
        : 0;
    
    // Calculate global score
    const score = calculateScore(avgAccessibility, competitionNorm);
    
    // Get capture range
    let captureRange = { min: 0, max: 0 };
    if (competitorsWithMetrics.length > 0) {
        const sortedByAccessibility = [...competitorsWithMetrics].sort((a, b) => b.metrics.accessibility - a.metrics.accessibility);
        captureRange = getCaptureRange(sortedByAccessibility[0].type, currentZone.name);
    }
    
    // Calculate global share
    const share = calculateShare(score, captureRange);
    
    // Calculate cannibalizations with metrics (filtrar datos antiguos sin los nuevos campos)
    const cannibalizationsWithMetrics = cannibalizations
        .filter(cann => cann.size && cann.proximity !== undefined && cann.cannibalizationFactor)
        .map(cann => {
            const proximity = calculateProximity(cann.proximity);
            const impact = proximity * cann.cannibalizationFactor;
            return { 
                id: cann.id,
                location_id: cann.location_id,
                name: cann.name,
                size: cann.size,
                proximity: cann.proximity,
                cannibalizationFactor: cann.cannibalizationFactor,
                proximityValue: proximity,
                impact: impact
            };
        });
    
    // Calculate cannibalization level and norm
    const cannibalizationLevel = cannibalizationsWithMetrics.reduce((sum, cann) => sum + cann.impact, 0);
    const cannibalizationNorm = cannibalizationLevel > 0 ? 1 - Math.exp(-cannibalizationLevel) : 0;
    
    // Calculate final adjusted expenses using corrected formulas
    const expensesAfterCompetition = evaluation.totalExpenses * (1 - competitionNorm);
    const totalAdjustedExpenses = expensesAfterCompetition * (share / 100);
    const cannibalizationAdjustmentAmount = totalAdjustedExpenses * cannibalizationNorm;
    const finalAdjustedExpenses = totalAdjustedExpenses * (1 - cannibalizationNorm);
    
    // Get viability criteria and calculate viability
    const viabilityCriteria = getViabilityCriteria();
    const viability = calculateViability(finalAdjustedExpenses, currentLocation.type, viabilityCriteria);
    
    // Build complete evaluation export
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            locationId: locationId,
            locationName: currentLocation.name,
            version: "1.0"
        },
        location: {
            id: currentLocation.id,
            name: currentLocation.name,
            type: currentLocation.type,
            size: currentLocation.size,
            coordinates: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
            },
            mobilityZone: {
                id: currentZone.id,
                name: currentZone.name,
                percentHomes5: currentZone.percent_homes_5,
                percentHomes10: currentZone.percent_homes_10,
                percentExpenses: currentZone.percent_expenses
            },
            demographics: {
                homes5min: currentLocation.homes_5min,
                percentHomes5: currentLocation.percent_homes_5,
                homes10min: currentLocation.homes_10min,
                percentHomes10: currentLocation.percent_homes_10,
                nse: {
                    percentD: currentLocation.percent_nse_d,
                    percentCMinus: currentLocation.percent_nse_c_minus,
                    percentCPlus: currentLocation.percent_nse_c_plus,
                    percentB: currentLocation.percent_nse_b
                },
                income: {
                    incomeD: currentLocation.income_d,
                    incomeCMinus: currentLocation.income_c_minus,
                    incomeCPlus: currentLocation.income_c_plus,
                    incomeB: currentLocation.income_b
                },
                percentExpenses: currentLocation.percent_expenses
            }
        },
        populationAnalysis: {
            totalPopulation: evaluation.population,
            effectivePopulation: evaluation.effectivePopulation,
            marketFactors: evaluation.marketFactors,
            homesByNSE: {
                total: {
                    d: evaluation.homesD,
                    cMinus: evaluation.homesCMinus,
                    cPlus: evaluation.homesCPlus,
                    b: evaluation.homesB
                },
                effective: {
                    d: evaluation.effectiveHomesD,
                    cMinus: evaluation.effectiveHomesCMinus,
                    cPlus: evaluation.effectiveHomesCPlus,
                    b: evaluation.effectiveHomesB
                }
            }
        },
        expensesAnalysis: {
            byNSE: {
                d: evaluation.avgExpensesD,
                cMinus: evaluation.avgExpensesCMinus,
                cPlus: evaluation.avgExpensesCPlus,
                b: evaluation.avgExpensesB
            },
            totalExpenses: evaluation.totalExpenses
        },
        competitionAnalysis: {
            competitors: competitorsWithMetrics,
            totalCompetitors: competitorsWithMetrics.length,
            globalMetrics: {
                allImpacts: allImpacts,
                competitionLevel: competitionLevel,
                competitionNorm: competitionNorm,
                avgAccessibility: avgAccessibility,
                score: score,
                captureRange: captureRange,
                share: share
            },
            formulas: {
                competitionLevel: "SUM(impacts)",
                competitionNorm: "1 - e^(-competitionLevel)",
                score: "0.6 × accessibility + 0.4 × (1 - competitionNorm)",
                share: "min + (max - min) × score",
                totalAdjustedExpenses: "totalExpenses × (1 - competitionNorm) × share"
            },
            calculations: {
                competitionLevelCalc: `SUM([${allImpacts.join(', ')}]) = ${competitionLevel}`,
                competitionNormCalc: `1 - e^(-${competitionLevel}) = ${competitionNorm}`,
                scoreCalc: `0.6 × ${avgAccessibility} + 0.4 × (1 - ${competitionNorm}) = ${score}`,
                shareCalc: `${captureRange.min} + (${captureRange.max} - ${captureRange.min}) × ${score} = ${share}`,
                totalAdjustedExpensesCalc: `${evaluation.totalExpenses} × (1 - ${competitionNorm}) × ${share / 100} = ${totalAdjustedExpenses}`
            },
            adjustment: {
                amount: totalAdjustedExpenses,
                percentage: (totalAdjustedExpenses / evaluation.totalExpenses) * 100
            }
        },
        cannibalizationAnalysis: {
            cannibalizations: cannibalizationsWithMetrics,
            cannibalizationLevel: cannibalizationLevel,
            cannibalizationNorm: cannibalizationNorm,
            formulas: {
                cannibalizationLevel: "SUM(impacts)",
                cannibalizationNorm: "1 - e^(-cannibalizationLevel)"
            },
            adjustment: {
                amount: cannibalizationAdjustmentAmount,
                percentage: cannibalizationNorm * 100
            }
        },
        finalResults: {
            totalExpenses: evaluation.totalExpenses,
            expensesAfterCompetition: expensesAfterCompetition,
            totalAdjustedExpenses: totalAdjustedExpenses,
            cannibalizationNorm: cannibalizationNorm,
            finalAdjustedExpenses: finalAdjustedExpenses,
            formulas: {
                expensesAfterCompetition: "totalExpenses × (1 - competitionNorm)",
                totalAdjustedExpenses: "expensesAfterCompetition × share",
                finalAdjustedExpenses: "totalAdjustedExpenses × (1 - cannibalizationNorm)"
            },
            viability: {
                isViable: viability.isViable,
                status: viability.status,
                criteria: {
                    minViable: 160000,
                    optimal: 180000
                }
            }
        }
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluacion-${currentLocation.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Resultados de evaluación exportados exitosamente');
}

// Initialize on load
init();

// Setup export button
document.getElementById('exportEvaluationBtn').addEventListener('click', exportEvaluationResults);
