// Módulo de cálculos para Retail Foundry
import { 
    TYPE_AFFINITY_MATRIX, 
    CAPTURE_RANGES, 
    ACCESSIBILITY_VALUES,
    COMPETITION_LEVEL_RANGES,
    DISTANCE_THRESHOLDS,
    COMPETITOR_TYPES, 
    EFFECTIVE_MARKET_FACTORS
} from './constants.js';

/**
 * Calcula la similitud por tipo (Similarity(type))
 * @param {string} locationtype - Tipo de la localidad
 * @param {string} competitorType - Tipo del competidor
 * @returns {number} Valor de afinidad entre 0 y 1
 */
export function calculateTypeSimilarity(locationType, competitorType) {
    if (!locationType || !competitorType) return 0;
    return TYPE_AFFINITY_MATRIX[locationType]?.[competitorType] || 0;
}

/**
 * Calcula la similitud por tamaño (Similarity(size))
 * Fórmula: MIN(1, (Competitor.size / Location.size)^0.5)
 * @param {number} locationSize - Tamaño de la localidad en m²
 * @param {number} competitorSize - Tamaño del competidor en m²
 * @returns {number} Valor de similitud entre 0 y 1
 */
export function calculateSizeSimilarity(locationSize, competitorSize) {
    if (!locationSize || locationSize <= 0 || !competitorSize || competitorSize <= 0) return 0;
    const ratio = competitorSize / locationSize;
    return Math.min(1, Math.pow(ratio, 0.5));
}

/**
 * Calcula la Afinidad (Affinity)
 * Fórmula: Affinity = Similarity(type) * Similarity(size)
 * @param {string} locationType - Tipo de la localidad
 * @param {number} locationSize - Tamaño de la localidad en m²
 * @param {string} competitorType - Tipo del competidor
 * @param {number} competitorSize - Tamaño del competidor en m²
 * @returns {number} Valor de afinidad
 */
export function calculateAffinity(locationType, locationSize, competitorType, competitorSize) {
    const typeSimilarity = calculateTypeSimilarity(locationType, competitorType);
    const sizeSimilarity = calculateSizeSimilarity(locationSize, competitorSize);
    return typeSimilarity * sizeSimilarity;
}

/**
 * Calcula la Proximidad basada en la distancia
 * Proximidad inversa: mientras más cerca, mayor proximidad
 * Fórmula: Proximity = 1 / (1 + distance / 300)
 * @param {number} distance - Distancia en metros
 * @returns {number} Valor de proximidad normalizado entre 0 y 1
 */
export function calculateProximity(distance) {
    if (distance <= 0) return 1;
    // Normalización: 1 / (1 + distance/300)
    // A 0m = 1, a 150m ≈ 0.67, a 300m = 0.5
    return 1 / (1 + distance / 300);
}

/**
 * Calcula el Impacto (Impact)
 * Fórmula: Impact = Affinity * Proximity
 * @param {number} affinity - Valor de afinidad
 * @param {number} proximity - Valor de proximidad
 * @returns {number} Valor de impacto
 */
export function calculateImpact(affinity, proximity) {
    return affinity * proximity;
}

/**
 * Calcula el nivel de competencia (CompetitionLevel)
 * Ahora es la suma de todos los impacts
 * @param {Array} impacts - Array de valores de impact de todos los competidores
 * @returns {number} Suma total de impacts
 */
export function calculateCompetitionLevel(impacts) {
    return impacts.reduce((sum, impact) => sum + impact, 0);
}

/**
 * Calcula la accesibilidad basada en el tipo de competidor
 * @param {string} competitorType - Tipo del competidor
 * @returns {number} Valor de accesibilidad
 */
export function calculateAccessibility(competitorType) {
    return ACCESSIBILITY_VALUES[competitorType] || 0.3;
}

/**
 * Calcula la normalización de competencia (CompetitionNorm)
 * Fórmula: competitionNorm = 1 - e^(-CompetitionLevel)
 * @param {number} competitionLevel - Nivel de competencia (suma de impacts)
 * @returns {number} Valor normalizado de competencia
 */
export function calculateCompetitionNorm(competitionLevel) {
    return 1 - Math.exp(-competitionLevel);
}

/**
 * Calcula el Score
 * Fórmula: Score = 0.6 × accessibility + 0.4 × (1 - competitionNorm)
 * @param {number} accessibility - Accesibilidad
 * @param {number} competitionNorm - Normalización de competencia
 * @returns {number} Score normalizado
 */
export function calculateScore(accessibility, competitionNorm) {
    return 0.6 * accessibility + 0.4 * (1 - competitionNorm);
}

/**
 * Obtiene el rango de captura según tipo y zona
 * @param {string} competitorType - Tipo del competidor
 * @param {string} zoneName - Nombre de la zona de movilidad
 * @returns {object} Objeto con min y max
 */
export function getCaptureRange(competitorType, zoneName) {
    let zoneType = 'media';
    if (zoneName === 'Zona popular') {
        zoneType = 'popular';
    } else if (zoneName === 'Zona alta') {
        zoneType = 'alta';
    }
    
    return CAPTURE_RANGES[competitorType]?.[zoneType] || { min: 0, max: 0 };
}

/**
 * Calcula la Participación/Share (antes ChannelCapture)
 * Fórmula: Share = CaptureMin + (CaptureMax - CaptureMin) * Score
 * @param {number} score - Score calculado
 * @param {object} captureRange - Objeto con min y max
 * @returns {number} Valor de participación en porcentaje
 */
export function calculateShare(score, captureRange) {
    const { min, max } = captureRange;
    return min + (max - min) * score;
}

/**
 * Calcula el Aporte
 * Fórmula: Aporte = Impact * Share
 * @param {number} impact - Valor de impacto
 * @param {number} share - Valor de participación
 * @returns {number} Valor de aporte
 */
export function calculateContribution(impact, share) {
    return impact * share;
}

/**
 * Calcula todos los valores para un competidor
 * @param {object} competitor - Objeto competidor con todos sus datos
 * @param {object} location - Objeto localidad
 * @param {object} zone - Zona de movilidad
 * @returns {object} Objeto con todos los cálculos individuales del competidor
 */
export function calculateCompetitorMetrics(competitor, location, zone) {
    // Calcular componentes individuales
    const typeSimilarity = calculateTypeSimilarity(location.type, competitor.type);
    const sizeSimilarity = calculateSizeSimilarity(location.size, competitor.size);
    const affinity = calculateAffinity(location.type, location.size, competitor.type, competitor.size);
    const proximity = calculateProximity(competitor.proximity);
    const impact = calculateImpact(affinity, proximity);
    const accessibility = calculateAccessibility(competitor.type);
    
    return {
        typeSimilarity,
        sizeSimilarity,
        affinity,
        proximity,
        impact,
        accessibility
    };
}

/**
 * Calcula la población efectiva basada en NSE y tipo de localidad
 * @param {object} location - Objeto localidad
 * @returns {object} Objeto con población total y efectiva
 */
export function calculateEffectivePopulation(location) {
    // Población total (hogares totales)
    const totalPopulation = 
        location.homes_5min * (location.percent_homes_5 / 100.0) + 
        location.homes_10min * (location.percent_homes_10 / 100.0);
    
    // Hogares por NSE
    const homesD = totalPopulation * (location.percent_nse_d / 100.0);
    const homesCMinus = totalPopulation * (location.percent_nse_c_minus / 100.0);
    const homesCPlus = totalPopulation * (location.percent_nse_c_plus / 100.0);
    const homesB = totalPopulation * (location.percent_nse_b / 100.0);
    
    // Obtener factores de mercado efectivo según tipo de localidad
    const factors = EFFECTIVE_MARKET_FACTORS[location.type] || EFFECTIVE_MARKET_FACTORS['Otros'];
    
    // Calcular población efectiva aplicando factores por NSE
    const effectiveHomesD = homesD * factors.d;
    const effectiveHomesCMinus = homesCMinus * factors.c_minus;
    const effectiveHomesCPlus = homesCPlus * factors.c_plus;
    const effectiveHomesB = homesB * factors.b;
    
    const effectivePopulation = effectiveHomesD + effectiveHomesCMinus + effectiveHomesCPlus + effectiveHomesB;
    
    return {
        totalPopulation,
        effectivePopulation,
        homesD,
        homesCMinus,
        homesCPlus,
        homesB,
        effectiveHomesD,
        effectiveHomesCMinus,
        effectiveHomesCPlus,
        effectiveHomesB,
        marketFactors: factors
    };
}

/**
 * Calcula la evaluación de una localidad
 * @param {object} location - Objeto localidad
 * @returns {object} Objeto con la evaluación
 */
export function calculateEvaluation(location) {
    // Calcular población total y efectiva
    const populationData = calculateEffectivePopulation(location);
    
    // Usar población efectiva para los cálculos de gastos
    const expensesPercent = location.percent_expenses / 100.0;
    const avgExpensesD = populationData.effectiveHomesD * location.income_d * expensesPercent;
    const avgExpensesCMinus = populationData.effectiveHomesCMinus * location.income_c_minus * expensesPercent;
    const avgExpensesCPlus = populationData.effectiveHomesCPlus * location.income_c_plus * expensesPercent;
    const avgExpensesB = populationData.effectiveHomesB * location.income_b * expensesPercent;
    
    const totalExpenses = avgExpensesD + avgExpensesCMinus + avgExpensesCPlus + avgExpensesB;
    
    return {
        // Población
        population: populationData.totalPopulation,
        effectivePopulation: populationData.effectivePopulation,
        marketFactors: populationData.marketFactors,
        
        // Hogares totales por NSE
        homesD: populationData.homesD,
        homesCMinus: populationData.homesCMinus,
        homesCPlus: populationData.homesCPlus,
        homesB: populationData.homesB,
        
        // Hogares efectivos por NSE
        effectiveHomesD: populationData.effectiveHomesD,
        effectiveHomesCMinus: populationData.effectiveHomesCMinus,
        effectiveHomesCPlus: populationData.effectiveHomesCPlus,
        effectiveHomesB: populationData.effectiveHomesB,
        
        // Gastos promedio
        avgExpensesD,
        avgExpensesCMinus,
        avgExpensesCPlus,
        avgExpensesB,
        totalExpenses
    };
}

/**
 * Calcula la viabilidad
 * @param {number} adjustedExpenses - Gastos ajustados
 * @param {string} locationType - Tipo de localidad
 * @param {object} viabilityCriteria - Criterios de viabilidad configurables
 * @returns {object} Objeto con isViable, status y color
 */
export function calculateViability(adjustedExpenses, locationType = 'Supermercado', viabilityCriteria = null) {
    // Si no se pasan criterios, usar los del tipo de localidad o valores por defecto
    let criteria;
    if (viabilityCriteria && viabilityCriteria[locationType]) {
        criteria = viabilityCriteria[locationType];
    } else {
        // Valores por defecto si no hay criterios configurados
        criteria = { minViable: 160000, optimal: 180000 };
    }
    
    const { minViable, optimal } = criteria;
    
    if (adjustedExpenses < minViable) {
        return {
            isViable: false,
            status: 'No Viable',
            color: 'viable-no',
            minViable,
            optimal
        };
    } else if (adjustedExpenses >= minViable && adjustedExpenses < optimal) {
        return {
            isViable: true,
            status: 'Viable',
            color: 'viable-yes',
            minViable,
            optimal
        };
    } else {
        return {
            isViable: true,
            status: 'Óptimo',
            color: 'viable-optimal',
            minViable,
            optimal
        };
    }
}
