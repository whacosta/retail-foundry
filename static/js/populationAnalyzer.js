/**
 * PopulationAnalyzer
 * Maneja datos de población del INEC
 * Responsabilidades:
 * - Cargar datos INEC (GeoJSON)
 * - Intersectar isocronas con datos de población
 * - Calcular total de habitantes en área
 * - Calcular área geográfica
 * - Calcular densidad de población
 */

class PopulationAnalyzer {
  constructor() {
    this.inecConfig = JSON.parse(localStorage.getItem('inecConfig') || '{}');
    this.populationData = null;
  }

  async loadPopulationData() {
    if (!this.inecConfig.inecDataPath || !this.inecConfig.inecPopulationFile) {
      throw new Error('Datos INEC no configurados. Ve a Configuración > Configuraciones del Sistema > Datos INEC');
    }
    
    let path = this.inecConfig.inecDataPath;
    
    // Asegurar que termina con /
    if (!path.endsWith('/')) {
      path += '/';
    }
    
    path = path + this.inecConfig.inecPopulationFile;
    
    console.log('[PopulationAnalyzer] Loading INEC data from:', path);
    
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se pudo acceder a ${path}`);
      }
      this.populationData = await response.json();
      console.log('[PopulationAnalyzer] ✓ INEC data loaded:', this.populationData.features.length, 'features');
    } catch (error) {
      console.error('[PopulationAnalyzer] Error loading INEC:', error);
      throw error;
    }
  }

  calculatePopulationInIsochrone(isochroneGeoJSON) {
    if (!this.populationData) {
      throw new Error('Datos INEC no cargados. Ejecuta loadPopulationData() primero');
    }

    let totalPopulation = 0;
    let featuresMatched = 0;
    
    // Usar Turf.js para intersecciones: point-in-polygon
    this.populationData.features.forEach(feature => {
      // Manejo de geometría Point
      if (feature.geometry.type === 'Point') {
        if (turf.booleanPointInPolygon(feature.geometry, isochroneGeoJSON)) {
          totalPopulation += feature.properties.population || 0;
          featuresMatched++;
        }
      }
      // Manejo de geometría Polygon (si INEC usa polígonos)
      else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        // Calcular intersección de polígonos
        try {
          const intersection = turf.intersect(feature, isochroneGeoJSON);
          if (intersection) {
            totalPopulation += feature.properties.population || 0;
            featuresMatched++;
          }
        } catch (e) {
          // Ignorar errores de intersección
        }
      }
    });

    console.log('[PopulationAnalyzer] Calculation:', totalPopulation, 'hab in', featuresMatched, 'features');
    
    return {
      totalPopulation,
      featuresMatched,
      avgPopulationPerFeature: featuresMatched > 0 ? totalPopulation / featuresMatched : 0
    };
  }

  calculateIsochroneArea(isochroneGeoJSON) {
    // Calcular área en km² usando Turf.js
    try {
      const areaInKm2 = turf.area(isochroneGeoJSON) / 1000000;
      console.log('[PopulationAnalyzer] Area calculated:', areaInKm2.toFixed(2), 'km²');
      return areaInKm2;
    } catch (error) {
      console.error('[PopulationAnalyzer] Error calculating area:', error);
      return 0;
    }
  }

  calculateDensity(population, areaKm2) {
    if (areaKm2 === 0) return 0;
    const density = population / areaKm2;
    console.log('[PopulationAnalyzer] Density:', density.toFixed(0), 'hab/km²');
    return density;
  }
}

export default PopulationAnalyzer;
