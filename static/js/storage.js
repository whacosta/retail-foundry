// Módulo de almacenamiento en local// Storage module for Retail Foundry
import { STORAGE_KEYS, DEFAULT_MOBILITY_ZONES, DEFAULT_NSE_INCOME, DEFAULT_VIABILITY_CRITERIA } from './constants.js';
import { Location } from './entities/Location.js';
import { Competitor } from './entities/Competitor.js';
import { Cannibalization } from './entities/Cannibalization.js';

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
    
    // Inicializar criterios de viabilidad si no existen
    if (!localStorage.getItem(STORAGE_KEYS.VIABILITY_CRITERIA)) {
        localStorage.setItem(STORAGE_KEYS.VIABILITY_CRITERIA, JSON.stringify(DEFAULT_VIABILITY_CRITERIA));
    }
    
    // Inicializar contadores de IDs
    if (!localStorage.getItem(STORAGE_KEYS.nextLocationId)) {
        localStorage.setItem(STORAGE_KEYS.nextLocationId, '1');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.nextCompetitorId)) {
        localStorage.setItem(STORAGE_KEYS.nextCompetitorId, '1');
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.nextCannibalizationId)) {
        localStorage.setItem(STORAGE_KEYS.nextCannibalizationId, '1');
    }
    
    // Sincronizar contadores con los IDs máximos existentes
    syncIdCounters();
}

/**
 * Obtiene el siguiente ID disponible para un tipo de entidad
 */
function getNextId(key) {
    const nextId = parseInt(localStorage.getItem(key)) || 1;
    localStorage.setItem(key, (nextId + 1).toString());
    return nextId;
}

/**
 * Sincroniza los contadores de IDs con los IDs máximos existentes
 */
function syncIdCounters() {
    const locations = getLocations();
    if (locations.length > 0) {
        const maxLocationId = Math.max(...locations.map(l => l.id));
        localStorage.setItem(STORAGE_KEYS.nextLocationId, (maxLocationId + 1).toString());
    }
    
    const competitors = getCompetitors();
    if (competitors.length > 0) {
        const maxCompetitorId = Math.max(...competitors.map(c => c.id));
        localStorage.setItem(STORAGE_KEYS.nextCompetitorId, (maxCompetitorId + 1).toString());
    }
    
    const cannibalizations = getCannibalizations();
    if (cannibalizations.length > 0) {
        const maxCannibalizationId = Math.max(...cannibalizations.map(c => c.id));
        localStorage.setItem(STORAGE_KEYS.nextCannibalizationId, (maxCannibalizationId + 1).toString());
    }
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
    const locationsData = data ? JSON.parse(data) : [];
    return locationsData.map(loc => Location.fromJSON(loc));
}

export function getLocationById(id) {
    const locations = getLocations();
    const location = locations.find(l => l.id === parseInt(id));
    return location || null;
}

export function createLocation(locationData) {
    const locations = getLocations();
    const location = new Location({
        ...locationData,
        id: getNextId(STORAGE_KEYS.nextLocationId)
    });
    
    // Validar antes de guardar
    const validation = location.validate();
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }
    
    locations.push(location);
    const locationsJSON = locations.map(l => l.toJSON());
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locationsJSON));
    return location;
}

export function updateLocation(id, locationData) {
    const locations = getLocations();
    const index = locations.findIndex(l => l.id === parseInt(id));
    
    if (index !== -1) {
        const updatedLocation = new Location({
            ...locations[index].toJSON(),
            ...locationData,
            id: parseInt(id)
        });
        
        // Validar antes de guardar
        const validation = updatedLocation.validate();
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        locations[index] = updatedLocation;
        const locationsJSON = locations.map(l => l.toJSON());
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locationsJSON));
        return updatedLocation;
    }
    return null;
}

export function deleteLocation(id) {
    const locations = getLocations();
    const filtered = locations.filter(l => l.id !== parseInt(id));
    
    if (filtered.length !== locations.length) {
        const locationsJSON = filtered.map(l => l.toJSON());
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locationsJSON));
        
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
    const competitorsData = data ? JSON.parse(data) : [];
    return competitorsData.map(comp => Competitor.fromJSON(comp));
}

export function getCompetitorById(id) {
    const competitors = getCompetitors();
    const competitor = competitors.find(c => c.id === parseInt(id));
    return competitor || null;
}

export function getCompetitorsByLocationId(locationId) {
    const competitors = getCompetitors();
    return competitors.filter(c => c.location_id === parseInt(locationId));
}

export function createCompetitor(competitorData) {
    const competitors = getCompetitors();
    const competitor = new Competitor({
        ...competitorData,
        id: getNextId(STORAGE_KEYS.nextCompetitorId)
    });
    
    // Validar antes de guardar
    const validation = competitor.validate();
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }
    
    competitors.push(competitor);
    const competitorsJSON = competitors.map(c => c.toJSON());
    localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitorsJSON));
    return competitor;
}

export function updateCompetitor(id, competitorData) {
    const competitors = getCompetitors();
    const index = competitors.findIndex(c => c.id === parseInt(id));
    
    if (index !== -1) {
        const updatedCompetitor = new Competitor({
            ...competitors[index].toJSON(),
            ...competitorData,
            id: parseInt(id)
        });
        
        // Validar antes de guardar
        const validation = updatedCompetitor.validate();
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        competitors[index] = updatedCompetitor;
        const competitorsJSON = competitors.map(c => c.toJSON());
        localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitorsJSON));
        return updatedCompetitor;
    }
    return null;
}

export function deleteCompetitor(id) {
    const competitors = getCompetitors();
    const filtered = competitors.filter(c => c.id !== parseInt(id));
    
    if (filtered.length !== competitors.length) {
        const competitorsJSON = filtered.map(c => c.toJSON());
        localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitorsJSON));
        return true;
    }
    return false;
}

export function deleteCompetitorsByLocationId(locationId) {
    const competitors = getCompetitors();
    const numId = parseInt(locationId);
    const strId = String(locationId);
    const filtered = competitors.filter(c => {
        const compLocId = c.location_id;
        return !(compLocId === numId || compLocId === strId || 
                 parseInt(compLocId) === numId || String(compLocId) === strId);
    });
    const competitorsJSON = filtered.map(c => c.toJSON());
    localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(competitorsJSON));
}

// ==================== CANNIBALIZATIONS ====================

export function getCannibalizations() {
    const data = localStorage.getItem(STORAGE_KEYS.CANNIBALIZATIONS);
    const cannibalizationsData = data ? JSON.parse(data) : [];
    return cannibalizationsData.map(cann => Cannibalization.fromJSON(cann));
}

export function getCannibalizationById(id) {
    const cannibalizations = getCannibalizations();
    const cannibalization = cannibalizations.find(c => c.id === parseInt(id));
    return cannibalization || null;
}

export function getCannibalizationsByLocationId(locationId) {
    const cannibalizations = getCannibalizations();
    return cannibalizations.filter(c => c.location_id === parseInt(locationId));
}

export function createCannibalization(cannibalizationData) {
    const cannibalizations = getCannibalizations();
    const cannibalization = new Cannibalization({
        ...cannibalizationData,
        id: getNextId(STORAGE_KEYS.nextCannibalizationId)
    });
    
    // Validar antes de guardar
    const validation = cannibalization.validate();
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }
    
    cannibalizations.push(cannibalization);
    const cannibalizationsJSON = cannibalizations.map(c => c.toJSON());
    localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizationsJSON));
    return cannibalization;
}

export function updateCannibalization(id, cannibalizationData) {
    const cannibalizations = getCannibalizations();
    const index = cannibalizations.findIndex(c => c.id === parseInt(id));
    
    if (index !== -1) {
        const updatedCannibalization = new Cannibalization({
            ...cannibalizations[index].toJSON(),
            ...cannibalizationData,
            id: parseInt(id)
        });
        
        // Validar antes de guardar
        const validation = updatedCannibalization.validate();
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        cannibalizations[index] = updatedCannibalization;
        const cannibalizationsJSON = cannibalizations.map(c => c.toJSON());
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizationsJSON));
        return updatedCannibalization;
    }
    return null;
}

export function deleteCannibalization(id) {
    const cannibalizations = getCannibalizations();
    const filtered = cannibalizations.filter(c => c.id !== parseInt(id));
    
    if (filtered.length !== cannibalizations.length) {
        const cannibalizationsJSON = filtered.map(c => c.toJSON());
        localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizationsJSON));
        return true;
    }
    return false;
}

export function deleteCannibalizationsByLocationId(locationId) {
    const cannibalizations = getCannibalizations();
    const numId = parseInt(locationId);
    const strId = String(locationId);
    const filtered = cannibalizations.filter(c => {
        const cannLocId = c.location_id;
        return !(cannLocId === numId || cannLocId === strId || 
                 parseInt(cannLocId) === numId || String(cannLocId) === strId);
    });
    const cannibalizationsJSON = filtered.map(c => c.toJSON());
    localStorage.setItem(STORAGE_KEYS.CANNIBALIZATIONS, JSON.stringify(cannibalizationsJSON));
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
        // Modo aditivo: agrega a los datos existentes respetando los IDs del archivo
        if (data.locations) {
            const existingLocations = getLocations();
            const merged = [...existingLocations, ...data.locations];
            localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(merged));
        }
        
        if (data.competitors) {
            const existingCompetitors = getCompetitors();
            const merged = [...existingCompetitors, ...data.competitors];
            localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(merged));
        }
        
        if (data.cannibalizations) {
            const existingCannibalizations = getCannibalizations();
            const merged = [...existingCannibalizations, ...data.cannibalizations];
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
    
    // Sincronizar contadores después de importar
    syncIdCounters();
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
 * Obtiene los criterios de viabilidad
 */
export function getViabilityCriteria() {
    const criteria = localStorage.getItem(STORAGE_KEYS.VIABILITY_CRITERIA);
    return criteria ? JSON.parse(criteria) : DEFAULT_VIABILITY_CRITERIA;
}

/**
 * Actualiza los criterios de viabilidad
 */
export function updateViabilityCriteria(criteria) {
    localStorage.setItem(STORAGE_KEYS.VIABILITY_CRITERIA, JSON.stringify(criteria));
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
