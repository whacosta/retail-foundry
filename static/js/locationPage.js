/**
 * LocationPageManager
 * Maneja la lógica de la página location.html para crear y editar localidades
 */

import { 
    getMobilityZones, 
    getMobilityZoneById,
    getLocationById, 
    getLocations,
    createLocation, 
    updateLocation,
    getGlobalConfig 
} from './storage.js';
import { COMPETITOR_TYPES } from './constants.js';
import IsochroneManager from './isochroneManager.js';
import PopulationAnalyzer from './populationAnalyzer.js';

export default class LocationPageManager {
    constructor() {
        // Elementos del DOM
        this.form = document.getElementById('locationForm');
        this.loading = document.getElementById('loading');
        this.pageTitle = document.getElementById('pageTitle');
        this.pageSubtitle = document.getElementById('pageSubtitle');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.exportBtn = document.getElementById('exportLocationBtn');
        this.locationIdInput = document.getElementById('locationId');
        this.mobilityZoneSelect = document.getElementById('mobilityZone');
        this.locationTypeSelect = document.getElementById('locationType');
        this.map = null;
        this.mapMarker = null;
        
        // Estado
        this.mobilityZones = [];
        this.currentMode = 'create'; // 'create' o 'edit'
        this.currentLocationId = null;
        this.originalLocationId = null; // Guardar el ID original en modo editar
        this.nextSuggestedId = 1; // Siguiente ID sugerido en modo crear
        
        // Managers para isocronas y análisis de población
        this.isochroneManager = null;
        this.populationAnalyzer = null;
        
        // Almacenamiento temporal de isocronas en modo crear (antes de guardar la localidad)
        this.pendingWalkingIsochrone = null;
        this.pendingDrivingIsochrone = null;
        this.populationAnalyzer = null;
    }

    /**
     * Inicializa la página
     */
    async init() {
        try {
            // Detectar si es crear o editar
            const params = new URLSearchParams(window.location.search);
            const locationId = params.get('id');
            
            if (locationId) {
                this.currentMode = 'edit';
                this.currentLocationId = parseInt(locationId);
                this.pageTitle.textContent = 'Editar Localidad';
                this.pageSubtitle.textContent = 'Modifica los datos de la localidad';
            } else {
                // En modo crear, sugerir el siguiente ID disponible
                const allLocations = getLocations();
                const maxId = allLocations.length > 0 ? Math.max(...allLocations.map(l => l.id)) : 0;
                // Mostrar el siguiente ID sugerido
                this.nextSuggestedId = maxId + 1;
            }
            
            // Cargar datos
            this.loadMobilityZones();
            this.loadLocationTypes();
            
            // Cargar ingresos globales
            this.loadGlobalConfig();
            
            // Mostrar formulario
            this.form.style.display = 'block';
            
            // Agregar event listeners
            this.attachEventListeners();
            
            // Inicializar mapa interactivo ANTES de cargar localidad (IsochroneManager se crea aquí)
            this.initializeMap();
            
            // Si es editar, cargar localidad DESPUÉS de inicializar el mapa
            if (this.currentMode === 'edit') {
                this.loading.style.display = 'block';
                await this.loadLocation(this.currentLocationId);
                this.loading.style.display = 'none';
            } else {
                // En modo crear, llenar el campo de ID con el siguiente número sugerido
                this.locationIdInput.value = this.nextSuggestedId;
                this.locationIdInput.readOnly = false; // Permitir editar el ID
            }
        } catch (error) {
            console.error('Error al initializar página:', error);
            alert('Error al cargar la página');
        }
    }

    /**
     * Carga y pobla el select de zonas de movilidad
     */
    loadMobilityZones() {
        try {
            this.mobilityZones = getMobilityZones();
            
            this.mobilityZoneSelect.innerHTML = '<option value="">Seleccione una zona...</option>';
            this.mobilityZones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone.id;
                option.textContent = zone.name;
                this.mobilityZoneSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar zonas de movilidad:', error);
        }
    }

    /**
     * Carga y pobla el select de tipos de localidad
     */
    loadLocationTypes() {
        try {
            this.locationTypeSelect.innerHTML = '<option value="">Seleccione un tipo...</option>';
            COMPETITOR_TYPES.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                this.locationTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar tipos de localidad:', error);
        }
    }

    /**
     * Carga configuración global (ingresos NSE)
     */
    loadGlobalConfig() {
        try {
            const globalConfig = getGlobalConfig();
            
            document.getElementById('incomeD').value = globalConfig.income_d;
            document.getElementById('incomeCMinus').value = globalConfig.income_c_minus;
            document.getElementById('incomeCPlus').value = globalConfig.income_c_plus;
            document.getElementById('incomeB').value = globalConfig.income_b;
        } catch (error) {
            console.error('Error al cargar configuración global:', error);
        }
    }

    /**
     * Carga una localidad existente y rellena el formulario
     */
    async loadLocation(id) {
        try {
            const location = getLocationById(id);
            
            if (!location) {
                alert('Localidad no encontrada');
                window.location.href = 'index.html';
                return;
            }
            
            // Guardar las coordenadas originales para detectar cambios
            this.originalCoordinates = {
                latitude: location.latitude,
                longitude: location.longitude
            };
            
            // Guardar el ID original (para detectar si cambió)
            this.originalLocationId = location.id;
            
            // Rellenar el formulario con los datos de la localidad
            this.locationIdInput.value = location.id;
            this.locationIdInput.readOnly = true; // En modo editar, el ID no se puede cambiar via readonly
            document.getElementById('name').value = location.name;
            document.getElementById('locationType').value = location.type || '';
            document.getElementById('locationSize').value = location.size || '';
            document.getElementById('latitude').value = location.latitude;
            document.getElementById('longitude').value = location.longitude;
            document.getElementById('provincia').value = location.provincia || '';
            document.getElementById('canton').value = location.canton || '';
            document.getElementById('parroquia').value = location.parroquia || '';
            document.getElementById('direccion').value = location.direccion || '';
            document.getElementById('mobilityZone').value = location.mobility_zone_id || 1;
            document.getElementById('homes5Min').value = location.homes_5min;
            document.getElementById('homes10Min').value = location.homes_10min;
            document.getElementById('percentNSED').value = location.percent_nse_d;
            document.getElementById('percentNSECMinus').value = location.percent_nse_c_minus;
            document.getElementById('percentNSECPlus').value = location.percent_nse_c_plus;
            document.getElementById('percentNSEB').value = location.percent_nse_b;
            
            // Actualizar porcentajes según la zona de movilidad
            this.updatePercentagesFromZone(location.mobility_zone_id || 1);
            
            // Actualizar indicadores de isocronas (timestamps)
            this.updateIsochroneStatusDisplay();
            
            // Actualizar mapa a las coordenadas de la localidad cargada
            this.updateMapFromInputs();
                        
            // Redibujar isocronas guardadas si existen (ahora isochroneManager ya existe)
            if (location.walking_isochrone && location.walking_isochrone.geometry) {
                this.isochroneManager.drawIsochrone(location.walking_isochrone.geometry, 'walking');
                console.log('[locationPage] Isocronas walking restauradas desde almacenamiento');
                this.calculateAndDisplayPopulationStats(location.walking_isochrone.geometry, 'walking');
            }
            if (location.driving_isochrone && location.driving_isochrone.geometry) {
                this.isochroneManager.drawIsochrone(location.driving_isochrone.geometry, 'driving');
                console.log('[locationPage] Isocronas driving restauradas desde almacenamiento');
                this.calculateAndDisplayPopulationStats(location.driving_isochrone.geometry, 'driving');
            }
            
        } catch (error) {
            console.error('Error al cargar localidad:', error);
            alert('Error al cargar la localidad');
        }
    }

    /**
     * Actualiza los porcentajes de hogares y gastos según la zona de movilidad seleccionada
     */
    updatePercentagesFromZone(zoneId) {
        try {
            const zone = this.mobilityZones.find(z => z.id == zoneId);
            if (zone) {
                document.getElementById('percentHomes5').value = zone.percent_homes_5;
                document.getElementById('percentHomes10').value = zone.percent_homes_10;
                document.getElementById('percentExpenses').value = zone.percent_expenses;
            }
        } catch (error) {
            console.error('Error al actualizar porcentajes:', error);
        }
    }

    /**
     * Valida el formulario
     */
    validateForm() {
        // Validar que el ID sea un número válido
        const locationIdValue = this.locationIdInput.value.trim();
        if (!locationIdValue || isNaN(locationIdValue) || parseInt(locationIdValue) <= 0) {
            alert('❌ El ID debe ser un número positivo');
            return false;
        }
        
        const locationId = parseInt(locationIdValue);
        
        // Validar que el ID sea único
        const allLocations = getLocations();
        const existingIds = allLocations.map(loc => loc.id);
        
        // Si es crear (sin ID original), verificar que el ID no exista
        if (this.currentMode === 'create' && existingIds.includes(locationId)) {
            alert(`❌ Ya existe una localidad con el ID ${locationId}. Por favor, use un ID único.`);
            return false;
        }
        
        const percentNSED = parseFloat(document.getElementById('percentNSED').value);
        const percentNSECMinus = parseFloat(document.getElementById('percentNSECMinus').value);
        const percentNSECPlus = parseFloat(document.getElementById('percentNSECPlus').value);
        const percentNSEB = parseFloat(document.getElementById('percentNSEB').value);
        
        const totalNSE = percentNSED + percentNSECMinus + percentNSECPlus + percentNSEB;
        
        if (Math.abs(totalNSE - 100) > 0.01) {
            alert(`La suma de los porcentajes NSE debe ser 100%. Actualmente es ${totalNSE.toFixed(2)}%`);
            return false;
        }
        
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);
        
        // Validar coordenadas
        if (latitude < -90 || latitude > 90) {
            alert('❌ La latitud debe estar entre -90 y 90 grados');
            return false;
        }
        
        if (longitude < -180 || longitude > 180) {
            alert('❌ La longitud debe estar entre -180 y 180 grados');
            return false;
        }
        
        return true;
    }

    /**
     * Recopila los datos del formulario
     */
    getFormData() {
        return {
            id: parseInt(this.locationIdInput.value), // Incluir el ID del usuario
            name: document.getElementById('name').value,
            type: document.getElementById('locationType').value,
            size: parseFloat(document.getElementById('locationSize').value),
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            provincia: document.getElementById('provincia').value,
            canton: document.getElementById('canton').value,
            parroquia: document.getElementById('parroquia').value,
            direccion: document.getElementById('direccion').value,
            homes_5min: parseInt(document.getElementById('homes5Min').value),
            percent_homes_5: parseFloat(document.getElementById('percentHomes5').value),
            homes_10min: parseInt(document.getElementById('homes10Min').value),
            percent_homes_10: parseFloat(document.getElementById('percentHomes10').value),
            mobility_zone_id: parseInt(document.getElementById('mobilityZone').value),
            percent_nse_d: parseFloat(document.getElementById('percentNSED').value),
            percent_nse_c_minus: parseFloat(document.getElementById('percentNSECMinus').value),
            percent_nse_c_plus: parseFloat(document.getElementById('percentNSECPlus').value),
            percent_nse_b: parseFloat(document.getElementById('percentNSEB').value),
            income_d: parseFloat(document.getElementById('incomeD').value),
            income_c_minus: parseFloat(document.getElementById('incomeCMinus').value),
            income_c_plus: parseFloat(document.getElementById('incomeCPlus').value),
            income_b: parseFloat(document.getElementById('incomeB').value),
            percent_expenses: parseFloat(document.getElementById('percentExpenses').value)
        };
    }

    /**
     * Maneja el envío del formulario
     */
    handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
        
        try {
            const locationData = this.getFormData();
            
            // Si las coordenadas cambiaron, limpiar datos de isocronas
            if (this.currentMode === 'edit' && this.originalCoordinates) {
                const coordsChanged = 
                    locationData.latitude !== this.originalCoordinates.latitude ||
                    locationData.longitude !== this.originalCoordinates.longitude;
                
                if (coordsChanged) {
                    locationData.walking_isochrone = null;
                    locationData.driving_isochrone = null;
                    console.log('[locationPage] Coordenadas cambiadas, isocronas limpiadas');
                } else {
                    // Si las coordenadas NO cambiaron, preservar las isocronas existentes
                    const currentLocation = getLocationById(this.originalLocationId);
                    if (currentLocation) {
                        if (currentLocation.walking_isochrone) {
                            locationData.walking_isochrone = currentLocation.walking_isochrone;
                        }
                        if (currentLocation.driving_isochrone) {
                            locationData.driving_isochrone = currentLocation.driving_isochrone;
                        }
                    }
                }
            }
                        
            if (this.currentMode === 'edit') {
                // En modo editar, usar el ID original para la actualización
                updateLocation(this.originalLocationId, locationData);
                console.log('[locationPage] Localidad actualizada correctamente');
            } else {
                // En modo crear, incluir isocronas pendientes si existen
                if (this.pendingWalkingIsochrone) {
                    locationData.walking_isochrone = this.pendingWalkingIsochrone;
                }
                if (this.pendingDrivingIsochrone) {
                    locationData.driving_isochrone = this.pendingDrivingIsochrone;
                }
                createLocation(locationData);
                // Limpiar isocronas pendientes tras guardar
                this.pendingWalkingIsochrone = null;
                this.pendingDrivingIsochrone = null;
                console.log('[locationPage] Localidad creada correctamente');
            }
            
            // Volver a index.html
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Error al guardar localidad:', error);
            alert('Error al guardar la localidad: ' + error.message);
        }
    }

    /**
     * Maneja el botón de cancelar
     */
    handleCancel = () => {
        window.location.href = 'index.html';
    }

    /**
     * Exporta la localidad actual como JSON
     */
    handleExportLocation = () => {
        try {
            if (this.currentMode === 'edit') {
                const location = getLocationById(this.currentLocationId);
                if (!location) {
                    alert('Localidad no encontrada');
                    return;
                }
                
                const dataStr = JSON.stringify(location.toJSON(), null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `localidad_${location.id}_${location.name.replace(/\s+/g, '_')}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            } else {
                alert('Guarde la localidad primero antes de exportarla');
            }
        } catch (error) {
            console.error('Error al exportar localidad:', error);
            alert('Error al exportar la localidad');
        }
    }

    /**
     * Agrega los event listeners necesarios
     */
    attachEventListeners() {
        // Submit del formulario
        this.form.addEventListener('submit', this.handleSubmit);
        
        // Botón cancelar
        this.cancelBtn.addEventListener('click', this.handleCancel);
        
        // Botón exportar
        this.exportBtn.addEventListener('click', this.handleExportLocation);
        
        // Cambio de zona de movilidad
        this.mobilityZoneSelect.addEventListener('change', (e) => {
            this.updatePercentagesFromZone(e.target.value);
        });

        // Sincronizar mapa cuando cambian las coordenadas
        document.getElementById('latitude').addEventListener('change', () => this.updateMapFromInputs());
        document.getElementById('longitude').addEventListener('change', () => this.updateMapFromInputs());
    }

    /**
     * Inicializa el mapa Leaflet para la localidad
     */
    initializeMap() {
        const latValue = parseFloat(document.getElementById('latitude').value);
        const lonValue = parseFloat(document.getElementById('longitude').value);
        const lat = !isNaN(latValue) ? latValue : -0.9219;
        const lon = !isNaN(lonValue) ? lonValue : -78.1834;
        const mapContainer = document.getElementById('mapContainer');

        if (mapContainer) {
            mapContainer.style.display = 'block';
        }

        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        if (this.map) {
            this.map.remove();
        }

        this.map = L.map('map').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false,
            maxWidth: 200
        }).addTo(this.map);

        // Instanciar managers para isocronas y población
        this.isochroneManager = new IsochroneManager(this.map);
        this.populationAnalyzer = new PopulationAnalyzer();

        this.createDraggableMarker(lat, lon);

        this.map.on('click', (e) => {
            const clickedLat = e.latlng.lat;
            const clickedLon = e.latlng.lng;
            document.getElementById('latitude').value = clickedLat.toFixed(6);
            document.getElementById('longitude').value = clickedLon.toFixed(6);
            this.createDraggableMarker(clickedLat, clickedLon);
            this.reverseGeocodeAndFill(clickedLat, clickedLon);
        });
    }

    /**
     * Realiza geocodificación inversa para llenar campos de provincia, cantón y parroquia
     */
    async reverseGeocodeAndFill(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&countrycodes=ec`
            );
            if (!response.ok) {
                throw new Error(`Reverse geocode failed: ${response.status}`);
            }
            const data = await response.json();
            const address = data.address || {};

            const provincia = address.state || address.region || address.county || '';
            const canton = address.county || address.city || address.town || address.village || '';
            const parroquia = address.city_district || address.suburb || address.neighbourhood || address.hamlet || address.locality || '';

            document.getElementById('provincia').value = provincia;
            document.getElementById('canton').value = canton;
            document.getElementById('parroquia').value = parroquia;
        } catch (error) {
            console.error('Error al obtener la dirección desde el mapa:', error);
        }
    }

    /**
     * Crea un marcador draggable y sincroniza lat/lon con el formulario
     */
    createDraggableMarker(lat, lon) {
        if (!this.map) return;

        if (this.mapMarker) {
            this.map.removeLayer(this.mapMarker);
        }

        this.mapMarker = L.marker([lat, lon], { draggable: true }).addTo(this.map)
            .bindPopup(`<strong>${document.getElementById('name').value || 'Localidad'}</strong><br>Arrastra para ajustar coordenadas`)
            .openPopup();

        this.mapMarker.on('dragend', () => {
            const newPos = this.mapMarker.getLatLng();
            document.getElementById('latitude').value = newPos.lat.toFixed(6);
            document.getElementById('longitude').value = newPos.lng.toFixed(6);
            this.reverseGeocodeAndFill(newPos.lat, newPos.lng);
        });
    }

    /**
     * Actualiza el mapa en base a los valores de latitud y longitud del formulario
     */
    updateMapFromInputs() {
        const lat = parseFloat(document.getElementById('latitude').value);
        const lon = parseFloat(document.getElementById('longitude').value);
        const mapContainer = document.getElementById('mapContainer');

        if (mapContainer) {
            mapContainer.style.display = (!isNaN(lat) && !isNaN(lon)) ? 'block' : 'none';
        }

        if (isNaN(lat) || isNaN(lon) || !this.map) return;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

        this.map.setView([lat, lon], this.map.getZoom());
        this.createDraggableMarker(lat, lon);
    }

    /**
     * Guarda la localidad actual con los datos de isocronas
     * @param {string} isochroneType - 'walking' o 'driving'
     * @param {object} isochroneData - { geometry, area, reachfactor, timestamp }
     */
    async saveCurrentLocationWithIsochrone(isochroneType, isochroneData) {
        try {
            // Guardar o actualizar en storage
            if (this.currentMode === 'edit') {
                // En modo editar, guardar directamente
                const locationData = this.getFormData();
                
                // Asignar datos de isocronas
                if (isochroneType === 'walking') {
                    locationData.walking_isochrone = isochroneData;
                } else if (isochroneType === 'driving') {
                    locationData.driving_isochrone = isochroneData;
                }
                
                updateLocation(this.originalLocationId, locationData);
                console.log(`[locationPage] Location ${this.originalLocationId} actualizada con isocronas ${isochroneType}`);
                // Actualizar indicadores visuales
                this.updateIsochroneStatusDisplay();
            } else {
                // En modo crear, almacenar temporalmente hasta que el usuario guarde la localidad
                if (isochroneType === 'walking') {
                    this.pendingWalkingIsochrone = isochroneData;
                    console.log('[locationPage] Isocronas walking almacenadas temporalmente (se guardarán al crear la localidad)');
                } else if (isochroneType === 'driving') {
                    this.pendingDrivingIsochrone = isochroneData;
                    console.log('[locationPage] Isocronas driving almacenadas temporalmente (se guardarán al crear la localidad)');
                }
            }
        } catch (error) {
            console.error(`[locationPage] Error guardando isocronas ${isochroneType}:`, error);
        }
    }

    /**
     * Actualiza los indicadores visuales del estado de isocronas
     */
    updateIsochroneStatusDisplay() {
        try {
            // Obtener datos actuales de la localidad si estamos en modo edit
            if (this.currentMode === 'edit' && this.originalLocationId) {
                const location = getLocationById(this.originalLocationId);
                if (location) {
                    // Actualizar estado de walking isochrone
                    const walkingStatus = document.getElementById('walkingIsochroneStatus');
                    if (walkingStatus) {
                        if (location.walking_isochrone && location.walking_isochrone.timestamp) {
                            const date = new Date(location.walking_isochrone.timestamp);
                            const formatted = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            walkingStatus.textContent = `✓ Calculada: ${formatted}`;
                            walkingStatus.style.color = '#22c55e';
                        } else {
                            walkingStatus.textContent = '';
                            walkingStatus.style.color = '#666';
                        }
                    }
                    
                    // Actualizar estado de driving isochrone
                    const drivingStatus = document.getElementById('drivingIsochroneStatus');
                    if (drivingStatus) {
                        if (location.driving_isochrone && location.driving_isochrone.timestamp) {
                            const date = new Date(location.driving_isochrone.timestamp);
                            const formatted = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            drivingStatus.textContent = `✓ Calculada: ${formatted}`;
                            drivingStatus.style.color = '#3b82f6';
                        } else {
                            drivingStatus.textContent = '';
                            drivingStatus.style.color = '#666';
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[locationPage] Error actualizando indicadores de isocronas:', error);
        }
    }

    /**
     * Calcula y muestra estadísticas de población para una isócrona
     */
    async calculateAndDisplayPopulationStats(isoGeometry, type, homesElementId) {
        try {
            if (!this.populationAnalyzer.populationData) {
                await this.populationAnalyzer.loadPopulationData();
            }
            const stats = this.populationAnalyzer.calculatePopulationInIsochrone(isoGeometry);
            const area = this.populationAnalyzer.calculateIsochroneArea(isoGeometry);
            const density = this.populationAnalyzer.calculateDensity(stats.totalPopulation, area);
            console.log(`[${type}] Población: ${stats.totalPopulation} hab | Área: ${area.toFixed(2)} km² | Densidad: ${density.toFixed(0)} hab/km²`);
            
            // Actualizar estadísticas en la página
            const homes = parseInt(document.getElementById(homesElementId).value) || 0;
            this.updatePopulationDisplay(type.toLowerCase(), homes, area, density);
        } catch (e) {
            // Manejo de errores - principalmente cuando INEC no está configurado
            if (e.message.includes('no configurado')) {
                console.warn('[locationPage] Datos INEC no configurados');
            } else if (e.message.includes('no cargado')) {
                console.warn('[locationPage] Datos INEC no disponibles - configurar en Settings');
            } else {
                console.warn('[locationPage] Error cargar datos INEC:', e.message);
            }
            // Continuar sin estadísticas - no es crítico
        }
    }

    /**
     * Calcular y mostrar isocrona de 5 minutos a pie
     */
    async calculateIsochroneWalking() {
        if (!this.mapMarker) {
            alert('Primero selecciona una ubicación en el mapa');
            return;
        }
        
        try {
            const { lat, lng } = this.mapMarker.getLatLng();
            const isoData = await this.isochroneManager.fetchIsochrone(lat, lng, 'foot-walking');
            
            if (isoData.features && isoData.features.length > 0) {
                const isoGeometry = isoData.features[0].geometry;
                const isoProperties = isoData.features[0].properties;
                this.isochroneManager.drawIsochrone(isoGeometry, 'walking');
                
                // Guardar datos de isocronas en la localidad
                const isochroneData = {
                    geometry: isoGeometry,
                    area: isoProperties.area || 0,
                    reachfactor: isoProperties.reachfactor || 0,
                    timestamp: new Date().toISOString()
                };
                this.saveCurrentLocationWithIsochrone('walking', isochroneData);
                
                // Calcular y mostrar estadísticas de población
                this.calculateAndDisplayPopulationStats(isoGeometry, 'Walking', 'homes5Min');
            }
        } catch (error) {
            alert('❌ Error calculando isócrona: ' + error.message);
            console.error('[locationPage] Walking isochrone error:', error);
        }
    }

    /**
     * Calcular y mostrar isócrona de 10 minutos en auto
     */
    async calculateIsochroneDriving() {
        if (!this.mapMarker) {
            alert('Primero selecciona una ubicación en el mapa');
            return;
        }
        
        try {
            const { lat, lng } = this.mapMarker.getLatLng();
            const isoData = await this.isochroneManager.fetchIsochrone(lat, lng, 'driving-car');
            
            if (isoData.features && isoData.features.length > 0) {
                const isoGeometry = isoData.features[0].geometry;
                const isoProperties = isoData.features[0].properties;
                this.isochroneManager.drawIsochrone(isoGeometry, 'driving');
                
                // Guardar datos de isocronas en la localidad
                const isochroneData = {
                    geometry: isoGeometry,
                    area: isoProperties.area || 0,
                    reachfactor: isoProperties.reachfactor || 0,
                    timestamp: new Date().toISOString()
                };
                this.saveCurrentLocationWithIsochrone('driving', isochroneData);
                
                // Calcular y mostrar estadísticas de población
                this.calculateAndDisplayPopulationStats(isoGeometry, 'Driving', 'homes10Min');
            }
        } catch (error) {
            alert('❌ Error calculando isócrona: ' + error.message);
            console.error('[locationPage] Driving isochrone error:', error);
        }
    }

    /**
     * Limpiar todas las isocronas del mapa
     */
    clearIsochrones() {
        if (this.isochroneManager) {
            this.isochroneManager.clearAll();
            console.log('[locationPage] Isocronas limpiadas');
        }
        
        // Limpiar estadísticas de la página
        const statsDiv = document.getElementById('populationStats');
        if (statsDiv) {
            statsDiv.style.display = 'none';
            document.getElementById('walkingPop').textContent = '—';
            document.getElementById('walkingArea').textContent = '—';
            document.getElementById('walkingDensity').textContent = '—';
            document.getElementById('drivingPop').textContent = '—';
            document.getElementById('drivingArea').textContent = '—';
            document.getElementById('drivingDensity').textContent = '—';
        }
    }

    /**
     * Actualizar las estadísticas de población en la página
     */
    updatePopulationDisplay(type, population, areaKm2, density) {
        const statsDiv = document.getElementById('populationStats');
        if (!statsDiv) return;

        // Formatear números con separador de miles
        const formatNumber = (num) => Math.round(num).toLocaleString('es-EC');
        
        if (type === 'walking') {
            document.getElementById('walkingPop').textContent = formatNumber(population);
            document.getElementById('walkingArea').textContent = areaKm2.toFixed(2);
            document.getElementById('walkingDensity').textContent = formatNumber(density);
        } else if (type === 'driving') {
            document.getElementById('drivingPop').textContent = formatNumber(population);
            document.getElementById('drivingArea').textContent = areaKm2.toFixed(2);
            document.getElementById('drivingDensity').textContent = formatNumber(density);
        }

        // Mostrar el div de estadísticas
        statsDiv.style.display = 'block';
    }
}

