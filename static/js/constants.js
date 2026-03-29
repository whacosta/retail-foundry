// Constantes de la aplicación Retail Foundry

// Tipos de competidores/localidades
export const COMPETITOR_TYPES = [
    'Supermercado',
    'Discounters',
    'Tradicional',
    'Especializados',
    'Otros'
];

// Matriz de afinidad por tipo
// Similarity(type) entre diferentes tipos de competidores
export const TYPE_AFFINITY_MATRIX = {
    'Supermercado': {
        'Supermercado': 1.0,
        'Discounters': 0.85,
        'Tradicional': 0.45,
        'Especializados': 0.25,
        'Otros': 0.10
    },
    'Discounters': {
        'Supermercado': 0.85,
        'Discounters': 1.0,
        'Tradicional': 0.60,
        'Especializados': 0.15,
        'Otros': 0.10
    },
    'Tradicional': {
        'Supermercado': 0.45,
        'Discounters': 0.60,
        'Tradicional': 1.0,
        'Especializados': 0.20,
        'Otros': 0.10
    },
    'Especializados': {
        'Supermercado': 0.25,
        'Discounters': 0.15,
        'Tradicional': 0.20,
        'Especializados': 1.0,
        'Otros': 0.10
    },
    'Otros': {
        'Supermercado': 0.10,
        'Discounters': 0.10,
        'Tradicional': 0.10,
        'Especializados': 0.10,
        'Otros': 1.0
    }
};

// Rangos de captura de canal por tipo de competidor y zona
export const CAPTURE_RANGES = {
    'Supermercado': {
        'popular': { min: 8.0, max: 12.0 },
        'media': { min: 10.0, max: 15.0 },
        'alta': { min: 12.0, max: 18.0 }
    },
    'Discounters': {
        'popular': { min: 5.0, max: 8.0 },
        'media': { min: 6.0, max: 10.0 },
        'alta': { min: 3.0, max: 6.0 }
    },
    'Tradicional': {
        'popular': { min: 15.0, max: 25.0 },
        'media': { min: 10.0, max: 18.0 },
        'alta': { min: 5.0, max: 10.0 }
    },
    'Especializados': {
        'popular': { min: 3.0, max: 6.0 },
        'media': { min: 4.0, max: 8.0 },
        'alta': { min: 2.0, max: 5.0 }
    },
    'Otros': {
        'popular': { min: 2.0, max: 4.0 },
        'media': { min: 3.0, max: 5.0 },
        'alta': { min: 4.0, max: 7.0 }
    }
};

// Valores de accesibilidad por tipo de competidor
export const ACCESSIBILITY_VALUES = {
    'Supermercado': 0.9,
    'Discounters': 0.6,
    'Tradicional': 0.6,
    'Especializados': 0.3,
    'Otros': 0.3
};

// Rangos de nivel de competencia según número de competidores
export const COMPETITION_LEVEL_RANGES = {
    low: { maxCompetitors: 2, min: 0.8, max: 1.0 },
    medium: { maxCompetitors: 8, min: 0.4, max: 0.7 },
    high: { maxCompetitors: Infinity, min: 0.1, max: 0.3 }
};

// Umbrales de distancia para cálculos (en metros)
export const DISTANCE_THRESHOLDS = {
    close: 500,    // <= 500m: cercano
    medium: 700    // <= 700m: medio, > 700m: lejano
};

// Criterios de viabilidad
export const VIABILITY_CRITERIA = {
    minViable: 160000.0,
    optimal: 180000.0
};

// Zonas de movilidad por defecto
export const DEFAULT_MOBILITY_ZONES = [
    {
        id: 1,
        name: 'Zona popular',
        percent_homes_5: 80.0,
        percent_homes_10: 20.0,
        percent_expenses: 35.0,
        weight_supermercados_min: 5.0,
        weight_supermercados_max: 10.0,
        weight_discounters_min: 10.0,
        weight_discounters_max: 15.0,
        weight_tradicional_min: 50.0,
        weight_tradicional_max: 65.0,
        weight_especializados_min: 15.0,
        weight_especializados_max: 20.0,
        weight_otros_min: 0.0,
        weight_otros_max: 5.0
    },
    {
        id: 2,
        name: 'Zona media',
        percent_homes_5: 60.0,
        percent_homes_10: 40.0,
        percent_expenses: 35.0,
        weight_supermercados_min: 25.0,
        weight_supermercados_max: 30.0,
        weight_discounters_min: 15.0,
        weight_discounters_max: 20.0,
        weight_tradicional_min: 30.0,
        weight_tradicional_max: 40.0,
        weight_especializados_min: 10.0,
        weight_especializados_max: 15.0,
        weight_otros_min: 5.0,
        weight_otros_max: 10.0
    },
    {
        id: 3,
        name: 'Zona alta',
        percent_homes_5: 50.0,
        percent_homes_10: 55.0,
        percent_expenses: 35.0,
        weight_supermercados_min: 35.0,
        weight_supermercados_max: 45.0,
        weight_discounters_min: 10.0,
        weight_discounters_max: 15.0,
        weight_tradicional_min: 15.0,
        weight_tradicional_max: 25.0,
        weight_especializados_min: 10.0,
        weight_especializados_max: 15.0,
        weight_otros_min: 0.0,
        weight_otros_max: 5.0
    }
];

// Configuración de localStorage
export const STORAGE_KEYS = {
    locations: 'retail_foundry_locations',
    competitors: 'retail_foundry_competitors',
    mobilityZones: 'retail_foundry_mobility_zones',
    cannibalizations: 'retail_foundry_cannibalizations',
    nextLocationId: 'retail_foundry_next_location_id',
    nextCompetitorId: 'retail_foundry_next_competitor_id',
    nextCannibalizationId: 'retail_foundry_next_cannibalization_id'
};
