/**
 * Location Entity
 * Representa una localidad con todos sus datos demográficos y de ubicación
 */

export class Location {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.type = data.type || '';
        this.size = data.size || 0;
        this.latitude = data.latitude || 0;
        this.longitude = data.longitude || 0;
        this.provincia = data.provincia || '';
        this.canton = data.canton || '';
        this.parroquia = data.parroquia || '';
        this.direccion = data.direccion || '';
        this.mobility_zone_id = data.mobility_zone_id || 1;
        this.homes_5min = data.homes_5min || 0;
        this.homes_10min = data.homes_10min || 0;
        this.percent_nse_d = data.percent_nse_d || 0;
        this.percent_nse_c_minus = data.percent_nse_c_minus || 0;
        this.percent_nse_c_plus = data.percent_nse_c_plus || 0;
        this.percent_nse_b = data.percent_nse_b || 0;
        this.walking_isochrone = data.walking_isochrone || null;
        this.driving_isochrone = data.driving_isochrone || null;
    }

    /**
     * Valida que la localidad tenga los datos mínimos requeridos
     */
    validate() {
        const errors = [];
        
        if (!this.name) errors.push('El nombre es requerido');
        if (!this.type) errors.push('El tipo es requerido');
        if (!this.size || this.size <= 0) errors.push('El tamaño debe ser mayor a 0');
        if (!this.latitude || !this.longitude) errors.push('Las coordenadas son requeridas');
        if (!this.homes_5min && !this.homes_10min) errors.push('Debe especificar hogares en al menos un rango');
        
        // Validar que los porcentajes NSE sumen 100%
        const totalNSE = this.percent_nse_d + this.percent_nse_c_minus + 
                        this.percent_nse_c_plus + this.percent_nse_b;
        if (Math.abs(totalNSE - 100) > 0.01) {
            errors.push('Los porcentajes NSE deben sumar 100%');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Limpia los datos de isocronas guardados
     */
    clearIsochroneData() {
        this.walking_isochrone = null;
        this.driving_isochrone = null;
    }

    /**
     * Convierte la localidad a un objeto plano para almacenamiento
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            size: this.size,
            latitude: this.latitude,
            longitude: this.longitude,
            provincia: this.provincia,
            canton: this.canton,
            parroquia: this.parroquia,
            direccion: this.direccion,
            mobility_zone_id: this.mobility_zone_id,
            homes_5min: this.homes_5min,
            homes_10min: this.homes_10min,
            percent_nse_d: this.percent_nse_d,
            percent_nse_c_minus: this.percent_nse_c_minus,
            percent_nse_c_plus: this.percent_nse_c_plus,
            percent_nse_b: this.percent_nse_b,
            walking_isochrone: this.walking_isochrone,
            driving_isochrone: this.driving_isochrone
        };
    }

    /**
     * Crea una instancia de Location desde datos planos
     */
    static fromJSON(data) {
        return new Location(data);
    }

    /**
     * Verifica si la localidad tiene coordenadas válidas
     */
    hasValidCoordinates() {
        return this.latitude !== 0 && this.longitude !== 0 &&
               !isNaN(this.latitude) && !isNaN(this.longitude);
    }

    /**
     * Calcula la población total basada en hogares y porcentajes
     */
    getTotalPopulation(zone) {
        if (!zone) return 0;
        
        const pop5min = this.homes_5min * (zone.percent_homes_5 / 100);
        const pop10min = this.homes_10min * (zone.percent_homes_10 / 100);
        
        return pop5min + pop10min;
    }

    /**
     * Obtiene la distribución de población por NSE
     */
    getNSEDistribution(zone) {
        const totalPop = this.getTotalPopulation(zone);
        
        return {
            d: totalPop * (this.percent_nse_d / 100),
            c_minus: totalPop * (this.percent_nse_c_minus / 100),
            c_plus: totalPop * (this.percent_nse_c_plus / 100),
            b: totalPop * (this.percent_nse_b / 100)
        };
    }
}
