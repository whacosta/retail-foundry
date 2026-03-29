// Evaluation page for Retail Foundry - SPA Version
import { COMPETITOR_TYPES } from './constants.js';
import { 
    getLocationById, 
    getMobilityZoneById, 
    getCompetitorsByLocationId,
    getCannibalizationsByLocationId,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    createCannibalization,
    updateCannibalization,
    deleteCannibalization
} from './storage.js';
import { 
    calculateEvaluation, 
    calculateViability,
    calculateCompetitorMetrics
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
    
    const metrics = calculateCompetitorMetrics(tempCompetitor, currentLocation, currentZone, competitors.length + 1);
    
    document.getElementById('calcTypeSimilarity').textContent = metrics.typeSimilarity.toFixed(4);
    document.getElementById('calcSizeSimilarity').textContent = metrics.sizeSimilarity.toFixed(4);
    document.getElementById('calcAffinity').textContent = metrics.affinity.toFixed(4);
    document.getElementById('calcProximity').textContent = metrics.proximity.toFixed(4);
    document.getElementById('calcImpact').textContent = metrics.impact.toFixed(4);
    document.getElementById('calcCompetitionLevel').textContent = metrics.competitionLevel.toFixed(4);
    document.getElementById('calcAccessibility').textContent = metrics.accessibility.toFixed(4);
    document.getElementById('calcScore').textContent = metrics.score.toFixed(4);
    document.getElementById('calcShare').textContent = metrics.share.toFixed(2) + '%';
    document.getElementById('calcContribution').textContent = metrics.contribution.toFixed(4);
    
    document.getElementById('calculationResults').style.display = 'block';
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
    const cannibalizationData = {
        location_id: locationId,
        name: document.getElementById('cannibalizationName').value,
        weight: parseFloat(document.getElementById('cannibalizationWeight').value)
    };
    
    try {
        if (cannibalizationId) {
            updateCannibalization(parseInt(cannibalizationId), cannibalizationData);
        } else {
            createCannibalization(cannibalizationData);
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
        document.getElementById('cannibalizationWeight').value = cannibalization.weight;
    } else {
        document.getElementById('cannibalizationModalTitle').textContent = 'Agregar Canibalización';
        cannibalizationForm.reset();
        document.getElementById('cannibalizationId').value = '';
        document.getElementById('cannLocationId').value = locationId;
    }
    cannibalizationModal.style.display = 'block';
}

function closeCannibalizationModal() {
    cannibalizationModal.style.display = 'none';
    cannibalizationForm.reset();
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
            deleteCannibalization(id);
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
        const metrics = calculateCompetitorMetrics(comp, currentLocation, currentZone, competitors.length);
        return { ...comp, metrics };
    });
    
    // Calculate competition adjustment
    const totalContribution = competitorsWithMetrics.reduce((sum, comp) => sum + comp.metrics.contribution, 0);
    const competitionAdjustment = totalContribution;
    const competitionAdjustmentAmount = evaluation.totalExpenses * (competitionAdjustment / 100);
    
    // Calculate cannibalization adjustment
    const cannibalizationAdjustment = cannibalizations.reduce((sum, cann) => sum + cann.weight, 0);
    const cannibalizationAdjustmentAmount = evaluation.totalExpenses * (cannibalizationAdjustment / 100);
    
    // Calculate final adjusted expenses
    const expensesAfterCompetition = evaluation.totalExpenses - competitionAdjustmentAmount;
    const finalAdjustedExpenses = expensesAfterCompetition - cannibalizationAdjustmentAmount;
    
    const viability = calculateViability(finalAdjustedExpenses);
    
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
                    <span class="value">${currentLocation.latitude}, ${currentLocation.longitude}</span>
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

        <div class="section highlight">
            <h2>Población Total</h2>
            <div class="big-number">${evaluation.population.toFixed(2)} hogares</div>
        </div>

        <div class="section">
            <h2>Distribución por Nivel Socioeconómico</h2>
            <div class="nse-grid">
                <div class="nse-card">
                    <h3>NSE D</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_d}%</div>
                    <div class="nse-homes">${evaluation.homesD.toFixed(2)} hogares</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_d.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE C-</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_c_minus}%</div>
                    <div class="nse-homes">${evaluation.homesCMinus.toFixed(2)} hogares</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_c_minus.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE C+</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_c_plus}%</div>
                    <div class="nse-homes">${evaluation.homesCPlus.toFixed(2)} hogares</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_c_plus.toFixed(2)}</div>
                </div>
                <div class="nse-card">
                    <h3>NSE B</h3>
                    <div class="nse-percent">${currentLocation.percent_nse_b}%</div>
                    <div class="nse-homes">${evaluation.homesB.toFixed(2)} hogares</div>
                    <div class="nse-income">Ingreso: $${currentLocation.income_b.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Gastos Promedio por NSE (${currentLocation.percent_expenses}% de ingresos)</h2>
            <p class="section-description">Fórmula: Hogares × Ingreso × % Gastos</p>
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
                        <p>Mínimo viable: $160,000</p>
                        <p>Rango óptimo: $160,000 - $180,000</p>
                    </div>
                </div>
                <div class="viability-column viability-box">
                    <h2>Gastos Totales Estimados</h2>
                    <div class="viability-value">$${evaluation.totalExpenses.toFixed(2)}</div>
                    <p class="viability-subtitle">Potencial de mercado mensual</p>
                </div>
                <div class="viability-column viability-box">
                    <h2>Gasto Total Ajustado</h2>
                    <div class="viability-value">$${finalAdjustedExpenses.toFixed(2)}</div>
                    <p class="viability-subtitle">Después de todos los ajustes</p>
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
                                <th>Proximidad (m)</th>
                                <th>Impact</th>
                                <th>Share (%)</th>
                                <th>Aporte</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="competitorsTableBody">
                            ${competitorsWithMetrics.length > 0 ? competitorsWithMetrics.map(comp => `
                                <tr data-id="${comp.id}">
                                    <td>${comp.name}</td>
                                    <td>${comp.type}</td>
                                    <td>${comp.size.toFixed(2)}</td>
                                    <td>${comp.proximity.toFixed(0)}m</td>
                                    <td>${comp.metrics.impact.toFixed(4)}</td>
                                    <td>${comp.metrics.share.toFixed(2)}%</td>
                                    <td>${comp.metrics.contribution.toFixed(4)}</td>
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
                        <span class="label">Ajuste Total:</span>
                        <span class="value" id="totalAdjustment">${competitionAdjustment.toFixed(2)}%</span>
                    </div>
                    <div class="adjustment-item">
                        <span class="label">Monto del Ajuste:</span>
                        <span class="value adjustment-amount" id="adjustmentAmount">-$${competitionAdjustmentAmount.toFixed(2)}</span>
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
                                <th>Peso (%)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="cannibalizationTableBody">
                            ${cannibalizations.length > 0 ? cannibalizations.map(cann => `
                                <tr data-id="${cann.id}">
                                    <td>${cann.name}</td>
                                    <td>${cann.weight.toFixed(2)}%</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-success btn-sm" onclick="window.editCannibalizationHandler(${cann.id})">Editar</button>
                                            <button class="btn btn-danger btn-sm" onclick="window.deleteCannibalizationHandler(${cann.id})">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr id="noCannibalizationRow">
                                    <td colspan="3" style="text-align: center; padding: 20px;">No hay canibalizaciones registradas</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div class="adjustment-summary">
                    <div class="adjustment-item">
                        <span class="label">Ajuste Total:</span>
                        <span class="value" id="totalCannAdjustment">${cannibalizationAdjustment.toFixed(2)}%</span>
                    </div>
                    <div class="adjustment-item">
                        <span class="label">Monto del Ajuste:</span>
                        <span class="value adjustment-amount" id="cannAdjustmentAmount">-$${cannibalizationAdjustmentAmount.toFixed(2)}</span>
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

// Initialize on load
init();
