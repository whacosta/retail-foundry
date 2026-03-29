// Módulo de almacenamiento en localStorage para Retail Foundry
import { STORAGE_KEYS, DEFAULT_MOBILITY_ZONES, DEFAULT_NSE_INCOME } from './constants.js';

/**
 * Inicializa el almacenamiento con datos por defecto si no existen
 */
export function initStorage() {
    // Inicializar zonas de movilidad si no existen
    if (!localStorage.getItem(STORAGE_KEYS.MOBILITY_ZONES)) {
        localStorage.setItem(STORAGE_KEYS.MOBILITY_ZONES, JSON.stringify(DEFAULT_MOBILITY_ZONES));
    }
    
    // Inicializar arrays vacíos si no existen
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.COMPETITORS)) {
        localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.CANNIBALIZATIONS)) {
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify([]));
    }
    
    // Inicializar configuración global si no existe
    if (!localStorage.getItem(STORAGE_KEYS.GLOBAL_CONFIG)) {
        localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(DEFAULT_NSE_INCOME));
    }
    
    // Inicializar contadores de IDs
    if (!localStorage.getItem(STORAGE_KEYS.nextLocationId)) {
        localStorage.setItem(STORAGE_KEYS.nextLocationId, '1');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.nextCompetitorId)) {
        localStorage.setItem(STORAGE_KEYS.nextCompetitorId, '1');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.CANNIBALIZATIONS)) {
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, '1');
    }
}

/**
 * Obtiene el siguiente ID disponible para un tipo de entidad
 */
function getNextId(key) {
    const nextId = parseInt(localStorage.getItem(key)) || 1;
    localStorage.setItem(key, (nextId + 1).toString());
    return nextId;
}

// ==================== MOBILITY ZONES ====================

export function getMobilityZones() {
    const data = localStorage.getItem(STORAGE_KEYS.MOBILITY_ZONES);
    return data ? JSON.parse(data) : [];
}

export function getMobilityZoneById(id) {
    const zones = getMobilityZones();
    return zones.find(z => z.id === parseInt(id));
}

export function updateMobilityZone(id, zoneData) {
    const zones = getMobilityZones();
    const index = zones.findIndex(z => z.id === parseInt(id));
    
    if (index !== -1) {
        zones[index] = { ...zones[index], ...zoneData, id: parseInt(id) };
        localStorage.setItem(STORAGE_KEYS.MOBILITY_ZONES, JSON.stringify(zones));
        return zones[index];
    }
    return null;
}

// ==================== LOCATIONS ====================

export function getLocations() {
    const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return data ? JSON.parse(data) : [];
}

export function getLocationById(id) {
    const locations = getLocations();
    return locations.find(l => l.id === parseInt(id));
}

export function createLocation(locationData) {
    const locations = getLocations();
    const newLocation = {
        ...locationData,
        id: getNextId(STORAGE_KEYS.nextLocationId)
    };
    
    locations.push(newLocation);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    return newLocation;
}

export function updateLocation(id, locationData) {
    const locations = getLocations();
    const index = locations.findIndex(l => l.id === parseInt(id));
    
    if (index !== -1) {
        locations[index] = { ...locations[index], ...locationData, id: parseInt(id) };
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
        return locations[index];
    }
    return null;
}

export function deleteLocation(id) {
    const locations = getLocations();
    const filtered = locations.filter(l => l.id !== parseInt(id));
    
    if (filtered.length !== locations.length) {
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(filtered));
        
        // También eliminar competidores y canibalizaciones asociadas
        deleteCompetitorsByLocationId(id);
        deleteCannibalizationsByLocationId(id);
        
        return true;
    }
    return false;
}

export function searchLocations(searchTerm, sortBy = 'id', order = 'DESC', page = 1, limit = 10) {
    let locations = getLocations();
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        locations = locations.filter(l => 
            l.name.toLowerCase().includes(term)
        );
    }
    
    // Ordenar
    locations.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (order === 'ASC') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    // Paginar
    const total = locations.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedLocations = locations.slice(start, end);
    
    return {
        locations: paginatedLocations,
        total,
        page,
        limit
    };
}

// ==================== COMPETITORS ====================

export function getCompetitors() {
    const data = localStorage.getItem(STORAGE_KEYS.COMPETITORS);
    return data ? JSON.parse(data) : [];
}

export function getCompetitorById(id) {
    const competitors = getCompetitors();
    return competitors.find(c => c.id === parseInt(id));
}

export function getCompetitorsByLocationId(locationId) {
    const competitors = getCompetitors();
    return competitors.filter(c => c.location_id === parseInt(locationId));
}

export function createCompetitor(competitorData) {
    const competitors = getCompetitors();
    const newCompetitor = {
        ...competitorData,
        id: getNextId(STORAGE_KEYS.nextCompetitorId)
    };
    
    competitors.push(newCompetitor);
    localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitors));
    return newCompetitor;
}

export function updateCompetitor(id, competitorData) {
    const competitors = getCompetitors();
    const index = competitors.findIndex(c => c.id === parseInt(id));
    
    if (index !== -1) {
        competitors[index] = { ...competitors[index], ...competitorData, id: parseInt(id) };
        localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitors));
        return competitors[index];
    }
    return null;
}

export function deleteCompetitor(id) {
    const competitors = getCompetitors();
    const filtered = competitors.filter(c => c.id !== parseInt(id));
    
    if (filtered.length !== competitors.length) {
        localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(filtered));
        return true;
    }
    return false;
}

export function deleteCompetitorsByLocationId(locationId) {
    const competitors = getCompetitors();
    const filtered = competitors.filter(c => c.location_id !== parseInt(locationId));
    localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(filtered));
}

// ==================== CANNIBALIZATIONS ====================

export function getCannibalizations() {
    const data = localStorage.getItem(STORAGE_KEYS.CANNIBALIZATIONS);
    return data ? JSON.parse(data) : [];
}

export function getCannibalizationById(id) {
    const cannibalizations = getCannibalizations();
    return cannibalizations.find(c => c.id === parseInt(id));
}

export function getCannibalizationsByLocationId(locationId) {
    const cannibalizations = getCannibalizations();
    return cannibalizations.filter(c => c.location_id === parseInt(locationId));
}

export function createCannibalization(cannibalizationData) {
    const cannibalizations = getCannibalizations();
    const newCannibalization = {
        ...cannibalizationData,
        id: getNextId(STORAGE_KEYS.CANNIBALIZATIONS)
    };
    
    cannibalizations.push(newCannibalization);
    localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizations));
    return newCannibalization;
}

export function updateCannibalization(id, cannibalizationData) {
    const cannibalizations = getCannibalizations();
    const index = cannibalizations.findIndex(c => c.id === parseInt(id));
    
    if (index !== -1) {
        cannibalizations[index] = { ...cannibalizations[index], ...cannibalizationData, id: parseInt(id) };
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizations));
        return cannibalizations[index];
    }
    return null;
}

export function deleteCannibalization(id) {
    const cannibalizations = getCannibalizations();
    const filtered = cannibalizations.filter(c => c.id !== parseInt(id));
    
    if (filtered.length !== cannibalizations.length) {
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(filtered));
        return true;
    }
    return false;
}

export function deleteCannibalizationsByLocationId(locationId) {
    const cannibalizations = getCannibalizations();
    const filtered = cannibalizations.filter(c => c.location_id !== parseInt(locationId));
    localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(filtered));
}

// ==================== UTILITY ====================

/**
 * Exporta todos los datos como JSON
 */
export function exportData() {
    return {
        locations: getLocations(),
        competitors: getCompetitors(),
        cannibalizations: getCannibalizations(),
        mobilityZones: getMobilityZones(),
        globalConfig: getGlobalConfig()
    };
}

/**
 * Importa datos desde JSON (modo aditivo - agrega sin borrar)
 */
export function importData(data, replaceMode = false) {
    if (replaceMode) {
        // Modo reemplazo: borra todo y reemplaza
        if (data.locations) {
            localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(data.locations));
        }
        if (data.competitors) {
            localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(data.competitors));
        }
        if (data.cannibalizations) {
            localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(data.cannibalizations));
        }
        if (data.mobilityZones) {
            localStorage.setItem(STORAGE_KEYS.MOBILITY_ZONES, JSON.stringify(data.mobilityZones));
        }
        if (data.globalConfig) {
            localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(data.globalConfig));
        }
    } else {
        // Modo aditivo: agrega a los datos existentes
        if (data.locations) {
            const existingLocations = getLocations();
            const maxId = existingLocations.length > 0 ? Math.max(...existingLocations.map(l => l.id)) : 0;
            
            // Reasignar IDs para evitar conflictos
            const newLocations = data.locations.map((loc, index) => ({
                ...loc,
                id: maxId + index + 1
            }));
            
            const merged = [...existingLocations, ...newLocations];
            localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(merged));
        }
        
        if (data.competitors) {
            const existingCompetitors = getCompetitors();
            const maxId = existingCompetitors.length > 0 ? Math.max(...existingCompetitors.map(c => c.id)) : 0;
            
            const newCompetitors = data.competitors.map((comp, index) => ({
                ...comp,
                id: maxId + index + 1
            }));
            
            const merged = [...existingCompetitors, ...newCompetitors];
            localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(merged));
        }
        
        if (data.cannibalizations) {
            const existingCannibalizations = getCannibalizations();
            const maxId = existingCannibalizations.length > 0 ? Math.max(...existingCannibalizations.map(c => c.id)) : 0;
            
            const newCannibalizations = data.cannibalizations.map((cann, index) => ({
                ...cann,
                id: maxId + index + 1
            }));
            
            const merged = [...existingCannibalizations, ...newCannibalizations];
            localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(merged));
        }
        
        // Zonas y config global solo se actualizan si el usuario lo confirma
        if (data.mobilityZones) {
            localStorage.setItem(STORAGE_KEYS.MOBILITY_ZONES, JSON.stringify(data.mobilityZones));
        }
        if (data.globalConfig) {
            localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(data.globalConfig));
        }
    }
}

/**
 * Obtiene la configuración global
 */
export function getGlobalConfig() {
    const config = localStorage.getItem(STORAGE_KEYS.GLOBAL_CONFIG);
    return config ? JSON.parse(config) : DEFAULT_NSE_INCOME;
}

/**
 * Actualiza la configuración global
 */
export function updateGlobalConfig(config) {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(config));
}

/**
 * Limpia todos los datos
 */
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    initStorage();
}
