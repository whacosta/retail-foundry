/**
 * Competitor Entity
 * Representa un competidor cercano a una localidad
 */

import { calculateHaversineDistance } from '../calculations.js';

export class Competitor {
    constructor(data = {}) {
        this.id = data.id || null;
        this.location_id = data.location_id || null;
        this.name = data.name || '';
        this.type = data.type || '';
        this.size = data.size || 0;
        this.latitude = data.latitude || null;
        this.longitude = data.longitude || null;
        this.proximity = data.proximity || 0;
    }

    /**
     * Valida que el competidor tenga los datos mínimos requeridos
     */
    validate() {
        const errors = [];
        
        if (!this.location_id) errors.push('El ID de localidad es requerido');
        if (!this.name) errors.push('El nombre es requerido');
        if (!this.type) errors.push('El tipo es requerido');
        if (!this.size || this.size <= 0) errors.push('El tamaño debe ser mayor a 0');
        
        // Si tiene coordenadas, deben ser válidas
        if ((this.latitude !== null || this.longitude !== null) &&
            (!this.latitude || !this.longitude)) {
            errors.push('Debe especificar ambas coordenadas (latitud y longitud)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verifica si el competidor tiene coordenadas válidas
     */
    hasValidCoordinates() {
        return this.latitude !== null && this.longitude !== null &&
               !isNaN(this.latitude) && !isNaN(this.longitude);
    }

    /**
     * Calcula la distancia desde una localidad
     */
    calculateDistanceFrom(location) {
        if (!this.hasValidCoordinates() || !location.hasValidCoordinates()) {
            return 0;
        }
        
        return calculateHaversineDistance(
            location.latitude,
            location.longitude,
            this.latitude,
            this.longitude
        );
    }

    /**
     * Actualiza la distancia automáticamente si tiene coordenadas
     */
    updateProximity(location) {
        if (this.hasValidCoordinates() && location.hasValidCoordinates()) {
            this.proximity = this.calculateDistanceFrom(location);
        }
        return this.proximity;
    }

    /**
     * Convierte el competidor a un objeto plano para almacenamiento
     */
    toJSON() {
        return {
            id: this.id,
            location_id: this.location_id,
            name: this.name,
            type: this.type,
            size: this.size,
            latitude: this.latitude,
            longitude: this.longitude,
            proximity: this.proximity
        };
    }

    /**
     * Crea una instancia de Competitor desde datos planos
     */
    static fromJSON(data) {
        return new Competitor(data);
    }

    /**
     * Crea un competidor y calcula automáticamente su distancia
     */
    static createWithDistance(data, location) {
        const competitor = new Competitor(data);
        competitor.updateProximity(location);
        return competitor;
    }
}
