/**
 * IsochroneManager
 * Maneja las isocronas (áreas de influencia) usando OpenRouteService
 * Responsabilidades:
 * - Cargar configuración desde localStorage
 * - Validar API key
 * - Llamar API de OpenRouteService
 * - Procesar respuesta y convertir a GeoJSON
 * - Dibujar isocronas en el mapa
 */

class IsochroneManager {
  constructor(map) {
    this.map = map;
    this.orsConfig = JSON.parse(localStorage.getItem('openRouteServiceConfig') || '{}');
    this.isochroneLayers = {}; // { walking: L.Layer, driving: L.Layer }
  }

  validateConfiguration() {
    if (!this.orsConfig.apiKey) {
      throw new Error('API Key no configurada. Ve a Configuración > Configuraciones del Sistema > OpenRouteService');
    }
    if (this.orsConfig.apiKey.length < 20) {
      throw new Error('API Key parece no válida (demasiado corta)');
    }
    return true;
  }

  async fetchIsochrone(lat, lon, profile = 'foot-walking', rangeSeconds = null) {
    this.validateConfiguration();
    
    // Usar tiempos por defecto si no se especifican
    if (!rangeSeconds) {
      rangeSeconds = profile === 'foot-walking' 
        ? (this.orsConfig.walkingSeconds || 300)
        : (this.orsConfig.drivingSeconds || 600);
    }
    
    const apiKey = this.orsConfig.apiKey;
    const baseUrl = 'https://api.openrouteservice.org';
    const url = `${baseUrl}/v2/isochrones/${profile}`;
    
    console.log(`[IsochroneManager] Fetching ${profile} isochrone for [${lat},${lon}] with ${rangeSeconds}s`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [[lon, lat]],
        range: [rangeSeconds],
        range_type: 'time',
        attributes: ['area', 'reachfactor']
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouteService error:', response.status, errorText);
      throw new Error(`OpenRouteService HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[IsochroneManager] ✓ Isochrone received', data);
    return data;
  }

  drawIsochrone(isochroneGeoJSON, layerName = 'walking', style = null) {
    // Remover capa previa si existe
    if (this.isochroneLayers[layerName]) {
      this.map.removeLayer(this.isochroneLayers[layerName]);
    }
    
    // Estilos por defecto
    const defaultStyles = {
      walking: { color: '#22c55e', weight: 2, opacity: 0.6, fillOpacity: 0.15 },
      driving: { color: '#3b82f6', weight: 2, opacity: 0.6, fillOpacity: 0.15 }
    };
    
    const finalStyle = style || defaultStyles[layerName] || defaultStyles.walking;
    
    this.isochroneLayers[layerName] = L.geoJSON(isochroneGeoJSON, {
      style: finalStyle,
      onEachFeature: (feature, layer) => {
        // Agregar popup con información si se desea
        if (feature.properties) {
          const props = feature.properties;
          layer.bindPopup(`<small>${layerName}: ${props.area ? (props.area / 1e6).toFixed(2) : '?'} km²</small>`);
        }
      }
    }).addTo(this.map);
    
    console.log(`[IsochroneManager] ✓ Isochrone '${layerName}' drawn on map`);
  }

  clearAll() {
    Object.values(this.isochroneLayers).forEach(layer => {
      if (layer) this.map.removeLayer(layer);
    });
    this.isochroneLayers = {};
    console.log('[IsochroneManager] ✓ All isochrones cleared');
  }
}

export default IsochroneManager;
