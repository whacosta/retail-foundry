// Módulo de cálculos para Retail Foundry
import { 
    TYPE_AFFINITY_MATRIX, 
    CAPTURE_RANGES, 
    ACCESSIBILITY_VALUES,
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
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * Implementación robusta que evita problemas de precisión numérica
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en metros
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    
    const R = 6371; // Radio de la Tierra en km
    
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distanceKm = R * c;
    
    return distanceKm * 1000; // Convertir a metros
}

/**
 * Calcula la proximidad basada en la distancia
 * Proximidad inversa: mientras más cerca, mayor proximidad
 * Fórmula: Proximity = 1 / (1 + distance / umbral)
 * Umbrales por zona: Popular=400m, Media=500m, Alta=600m (default)
 * @param {number} distance - Distancia en metros
 * @param {object} zone - Zona de movilidad (opcional)
 * @returns {number} Valor de proximidad normalizado entre 0 y 1
 */
export function calculateProximity(distance, zone = null) {
    if (distance <= 0) return 1;
    
    let umbral = 600; // Umbral por defecto para zona Alta
    if (zone) {
        if (zone.id === 1 || zone.id === '1') { // Zona Popular - rural
            umbral = 400;
        } else if (zone.id === 2 || zone.id === '2') { // Zona Media - urbano
            umbral = 500;
        }
    }
    
    return 1 / (1 + distance / umbral);
}

/**
 * Calcula el Impacto (Impact)
 * Fórmula: Impact = Affinity * Proximity * 0.6
 * @param {number} affinity - Valor de afinidad
 * @param {number} proximity - Valor de proximidad
 * @returns {number} Valor de impacto
 */
export function calculateImpact(affinity, proximity) {
    return affinity * proximity * 0.6;
}

/**
 * Calcula la suma de impactos de competencia (sumCompetitionImpacts)
 * Fórmula: sumCompetitionImpacts = SUMA(impacts)
 * @param {Array} impacts - Array de valores de impact de todos los competidores
 * @returns {number} Suma total de impacts
 */
export function calculatesumCompetitionImpacts(impacts) {
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
 * Calcula la normalización de competencia (competitionNorm)
 * Fórmula: competitionNorm = sumCompetitionImpacts / (1 + sumCompetitionImpacts)
 * @param {number} sumCompetitionImpacts - Suma de los impactos de la competencia
 * @returns {number} Valor normalizado de competencia entre 0 y 1
 */
export function calculateCompetitionNorm(sumCompetitionImpacts) {
    return sumCompetitionImpacts / (1 + sumCompetitionImpacts);
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
 * Calcula el Aporte (Contribution)
 * Fórmula: Contribution = Impact × Share
 * @param {number} impact - Valor de impacto del competidor
 * @param {number} share - Valor de participación/share en porcentaje
 * @returns {number} Valor de aporte del competidor
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
    const proximity = calculateProximity(competitor.proximity, zone);
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
 * Fórmula población total: homes_5min × (percent_homes_5/100) + homes_10min × (percent_homes_10/100)
 * Fórmula población efectiva: SUMA(homes_NSE × factor_mercado_NSE) para cada NSE
 * @param {object} location - Objeto localidad
 * @param {object} zone - Zona de movilidad
 * @returns {object} Objeto con población total y efectiva
 */
export function calculateEffectivePopulation(location, zone) {
    // Población total (hogares totales)
    // Los porcentajes de hogares vienen de la zona de movilidad
    const totalPopulation = 
        location.homes_5min * (zone.percent_homes_5 / 100.0) + 
        location.homes_10min * (zone.percent_homes_10 / 100.0);
    
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
 * Calcula la evaluación completa de una localidad
 * Fórmula gastos por NSE: effectiveHomes_NSE × income_NSE × (percent_expenses/100)
 * Fórmula gastos totales: SUMA(gastos_NSE) para todos los NSE
 * @param {object} location - Objeto localidad
 * @param {object} zone - Zona de movilidad de la localidad
 * @param {Array} competitors - Array de competidores (opcional)
 * @param {Array} cannibalizations - Array de canibalizaciones (opcional)
 * @param {object} globalConfig - Configuración global con ingresos NSE (opcional)
 * @returns {object} Objeto con la evaluación completa
 */
export function calculateEvaluation(location, zone, competitors = [], cannibalizations = [], globalConfig = null) {
    // Calcular población total y efectiva
    const populationData = calculateEffectivePopulation(location, zone);
    
    // Usar ingresos de globalConfig si está disponible, sino usar valores por defecto
    const incomeD = globalConfig?.income_d || 450;
    const incomeCMinus = globalConfig?.income_c_minus || 650;
    const incomeCPlus = globalConfig?.income_c_plus || 950;
    const incomeB = globalConfig?.income_b || 1500;
    
    // Usar población efectiva para los cálculos de gastos
    const expensesPercent = zone.percent_expenses / 100.0;
    const avgExpensesD = populationData.effectiveHomesD * incomeD * expensesPercent;
    const avgExpensesCMinus = populationData.effectiveHomesCMinus * incomeCMinus * expensesPercent;
    const avgExpensesCPlus = populationData.effectiveHomesCPlus * incomeCPlus * expensesPercent;
    const avgExpensesB = populationData.effectiveHomesB * incomeB * expensesPercent;
    
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
 * Calcula la viabilidad de una localidad
 * Criterios: No Viable (< minViable), Viable (>= minViable y < optimal), Óptimo (>= optimal)
 * @param {number} adjustedExpenses - Gastos ajustados finales
 * @param {string} locationType - Tipo de localidad
 * @param {object} viabilityCriteria - Criterios de viabilidad configurables por tipo
 * @returns {object} Objeto con isViable, status, color, minViable y optimal
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
