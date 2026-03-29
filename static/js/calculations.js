// Módulo de cálculos para Retail Foundry
import { 
    TYPE_AFFINITY_MATRIX, 
    CAPTURE_RANGES, 
    ACCESSIBILITY_VALUES,
    COMPETITION_LEVEL_RANGES,
    DISTANCE_THRESHOLDS,
    VIABILITY_CRITERIA
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
 * @param {number} distance - Distancia en metros
 * @returns {number} Valor de proximidad normalizado entre 0 y 1
 */
export function calculateProximity(distance) {
    if (distance <= 0) return 1;
    // Normalización: 1 / (1 + distance/1000)
    // A 0m = 1, a 500m ≈ 0.67, a 1000m = 0.5
    return 1 / (1 + distance / 1000);
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
 * @param {number} totalCompetitors - Número total de competidores
 * @param {number} distance - Distancia del competidor en metros
 * @returns {number} Nivel de competencia entre 0 y 1
 */
export function calculateCompetitionLevel(totalCompetitors, distance) {
    let range;
    
    if (totalCompetitors <= COMPETITION_LEVEL_RANGES.low.maxCompetitors) {
        range = COMPETITION_LEVEL_RANGES.low;
    } else if (totalCompetitors <= COMPETITION_LEVEL_RANGES.medium.maxCompetitors) {
        range = COMPETITION_LEVEL_RANGES.medium;
    } else {
        range = COMPETITION_LEVEL_RANGES.high;
    }
    
    // Interpolar según distancia
    if (distance <= DISTANCE_THRESHOLDS.close) {
        return range.max;
    } else if (distance <= DISTANCE_THRESHOLDS.medium) {
        return (range.min + range.max) / 2;
    } else {
        return range.min;
    }
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
 * Calcula el Score
 * Fórmula: Score = (CompetitionLevel + Accessibility + Affinity) / 3
 * @param {number} competitionLevel - Nivel de competencia
 * @param {number} accessibility - Accesibilidad
 * @param {number} affinity - Afinidad
 * @returns {number} Score normalizado
 */
export function calculateScore(competitionLevel, accessibility, affinity) {
    return (competitionLevel + accessibility + affinity) / 3;
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
 * @param {number} totalCompetitors - Total de competidores
 * @returns {object} Objeto con todos los cálculos
 */
export function calculateCompetitorMetrics(competitor, location, zone, totalCompetitors) {
    // Calcular componentes
    const typeSimilarity = calculateTypeSimilarity(location.type, competitor.type);
    const sizeSimilarity = calculateSizeSimilarity(location.size, competitor.size);
    const affinity = calculateAffinity(location.type, location.size, competitor.type, competitor.size);
    const proximity = calculateProximity(competitor.proximity);
    const impact = calculateImpact(affinity, proximity);
    
    const competitionLevel = calculateCompetitionLevel(totalCompetitors, competitor.proximity);
    const accessibility = calculateAccessibility(competitor.type);
    const score = calculateScore(competitionLevel, accessibility, affinity);
    
    const captureRange = getCaptureRange(competitor.type, zone.name);
    const share = calculateShare(score, captureRange);
    const contribution = calculateContribution(impact, share);
    
    return {
        typeSimilarity,
        sizeSimilarity,
        affinity,
        proximity,
        impact,
        competitionLevel,
        accessibility,
        score,
        captureRange,
        share,
        contribution
    };
}

/**
 * Calcula la evaluación de una localidad
 * @param {object} location - Objeto localidad
 * @returns {object} Objeto con la evaluación
 */
export function calculateEvaluation(location) {
    const population = 
        location.homes_5min * (location.percent_homes_5 / 100.0) + 
        location.homes_10min * (location.percent_homes_10 / 100.0);
    
    const homesD = population * (location.percent_nse_d / 100.0);
    const homesCMinus = population * (location.percent_nse_c_minus / 100.0);
    const homesCPlus = population * (location.percent_nse_c_plus / 100.0);
    const homesB = population * (location.percent_nse_b / 100.0);
    
    const expensesPercent = location.percent_expenses / 100.0;
    const avgExpensesD = homesD * location.income_d * expensesPercent;
    const avgExpensesCMinus = homesCMinus * location.income_c_minus * expensesPercent;
    const avgExpensesCPlus = homesCPlus * location.income_c_plus * expensesPercent;
    const avgExpensesB = homesB * location.income_b * expensesPercent;
    
    const totalExpenses = avgExpensesD + avgExpensesCMinus + avgExpensesCPlus + avgExpensesB;
    
    return {
        population,
        homesD,
        homesCMinus,
        homesCPlus,
        homesB,
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
 * @returns {object} Objeto con isViable, status y color
 */
export function calculateViability(adjustedExpenses) {
    const { minViable, optimal } = VIABILITY_CRITERIA;
    
    if (adjustedExpenses < minViable) {
        return {
            isViable: false,
            status: 'No Viable',
            color: 'viable-no'
        };
    } else if (adjustedExpenses >= minViable && adjustedExpenses < optimal) {
        return {
            isViable: true,
            status: 'Viable',
            color: 'viable-yes'
        };
    } else {
        return {
            isViable: true,
            status: 'Óptimo',
            color: 'viable-optimal'
        };
    }
}
