/**
 * Cannibalization Entity
 * Representa una canibalización (local propio que puede afectar ventas)
 */

import { calculateHaversineDistance } from '../calculations.js';

export class Cannibalization {
    constructor(data = {}) {
        this.id = data.id || null;
        this.location_id = data.location_id || null;
        this.name = data.name || '';
        this.size = data.size || 0;
        this.latitude = data.latitude || null;
        this.longitude = data.longitude || null;
        this.proximity = data.proximity || 0;
    }

    /**
     * Valida que la canibalización tenga los datos mínimos requeridos
     */
    validate() {
        const errors = [];
        
        if (!this.location_id) errors.push('El ID de localidad es requerido');
        if (!this.name) errors.push('El nombre es requerido');
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
     * Verifica si la canibalización tiene coordenadas válidas
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
     * Convierte la canibalización a un objeto plano para almacenamiento
     */
    toJSON() {
        return {
            id: this.id,
            location_id: this.location_id,
            name: this.name,
            size: this.size,
            latitude: this.latitude,
            longitude: this.longitude,
            proximity: this.proximity
        };
    }

    /**
     * Crea una instancia de Cannibalization desde datos planos
     */
    static fromJSON(data) {
        return new Cannibalization(data);
    }

    /**
     * Crea una canibalización y calcula automáticamente su distancia
     */
    static createWithDistance(data, location) {
        const cannibalization = new Cannibalization(data);
        cannibalization.updateProximity(location);
        return cannibalization;
    }
}
