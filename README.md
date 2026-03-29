# Retail Foundry

**Single Page Application (SPA)** para analizar la factibilidad de localidades para abrir tiendas de retail.

> **Versión 2.0** - JavaScript puro + localStorage

🌐 **Demo en vivo:** [https://whacosta.github.io/retail-foundry/](https://whacosta.github.io/retail-foundry/)

## 🚀 Inicio Rápido

1. **Abrir la aplicación**: Simplemente abre `index.html` en tu navegador
2. **No requiere instalación** - Funciona completamente offline
3. **No requiere servidor** - Todo se ejecuta en el navegador

## ✨ Características

- ✅ **Single Page Application** - No requiere servidor backend
- ✅ **Almacenamiento local** - Datos guardados en localStorage del navegador
- ✅ **Interfaz moderna y responsive**
- ✅ **Gestión completa de localidades** (crear, editar, eliminar)
- ✅ **Búsqueda y filtrado** de localidades
- ✅ **Paginación** de resultados
- ✅ **Evaluación detallada** con cálculos automáticos
- ✅ **Análisis por nivel socioeconómico** (NSE)
- ✅ **Cálculos en tiempo real** con visualización de fórmulas
- ✅ **Compatible con GitHub Pages**
- ✅ **Exportar/Importar datos** - Backup y restauración con un click
- ✅ **Validación de datos** - Verificación automática al importar

## 📋 Requisitos

- Navegador web moderno con soporte para:
  - ES6 Modules
  - localStorage
  - CSS Grid y Flexbox

**Navegadores compatibles:**
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## 🎯 Nuevas Funcionalidades (v2.0)

### Campos Agregados

**En Localidades y Competidores:**
- **`type`**: Tipo (Supermercado, Discounters, Tradicional, Especializados, Otros)
- **`size`**: Tamaño en metros cuadrados (m²)

### 📊 Cálculo de Población Efectiva

La aplicación calcula la **Población Efectiva** (mercado objetivo real) basándose en el NSE y el tipo de localidad, aplicando factores de mercado específicos:

#### Tabla de Factores de Mercado Efectivo por NSE y Formato

| NSE / Formato | Supermercado | Discounters | Tradicional | Especializados | Otros |
|---------------|--------------|-------------|-------------|----------------|-------|
| **B**         | 70%          | 20%         | 25%         | 40%            | 10%   |
| **C+**        | 60%          | 35%         | 40%         | 30%            | 10%   |
| **C-**        | 40%          | 60%         | 55%         | 20%            | 10%   |
| **D**         | 20%          | 70%         | 65%         | 10%            | 10%   |

**Ejemplo de cálculo:**
- Si una localidad tipo "Supermercado" tiene 1000 hogares NSE B, la población efectiva de ese segmento será: 1000 × 0.70 = 700 hogares
- La población efectiva total es la suma de todos los segmentos NSE aplicando sus respectivos factores

**Nota:** Los cálculos de gastos y viabilidad se basan en la población efectiva, no en la población total.

### Campos Renombrados

| Campo Anterior | Campo Nuevo | Descripción |
|----------------|-------------|-------------|
| `Distance` | `Proximity` | Distancia en metros |
| `Weight` | `Impact` | Impacto calculado |
| `ChannelCapture` | `Share` | Participación del canal |

### Fórmulas de Cálculo (Actualizadas)

#### Métricas Individuales por Competidor

```
Similarity(type) = Valor de matriz de afinidad (TYPE_AFFINITY_MATRIX)
Similarity(size) = MIN(1, (Competitor.size / Location.size)^0.5)
Affinity = Similarity(type) × Similarity(size)
Proximity = 1 / (1 + distance / 300)
Impact = Affinity × Proximity
Accessibility = Valor según tipo de competidor (ACCESSIBILITY_VALUES)
```

#### Métricas Globales de Competencia

```
CompetitionLevel = SUM(impacts de todos los competidores)
CompetitionNorm = 1 - e^(-CompetitionLevel)
Score = 0.6 × avgAccessibility + 0.4 × (1 - CompetitionNorm)
Share = min + (max - min) × Score
CompetitionAdjustmentAmount = totalExpenses × (1 - CompetitionNorm) × share
```

**Nota importante:** Las métricas Score y Share ahora se calculan globalmente (una sola vez para toda la localidad), no por cada competidor individual.

### Matriz de Afinidad por Tipo

|                    | Supermercado | Discounters | Tradicional | Especializados | Otros |
|--------------------|--------------|-------------|-------------|----------------|-------|
| **Supermercado**   | 1.0          | 0.85        | 0.45        | 0.25           | 0.10  |
| **Discounters**    | 0.85         | 1.0         | 0.60        | 0.15           | 0.10  |
| **Tradicional**    | 0.45         | 0.60        | 1.0         | 0.20           | 0.10  |
| **Especializados** | 0.25         | 0.15        | 0.20        | 1.0            | 0.10  |
| **Otros**          | 0.10         | 0.10        | 0.10        | 0.10           | 1.0   |

## 📖 Uso de la Aplicación

### Página Principal

1. **Crear Localidad**: Click en "+ Nueva Localidad"
2. **Completar formulario** con todos los datos:
   - Nombre, tipo y tamaño
   - Ubicación (latitud/longitud)
   - Hogares y porcentajes
   - Niveles socioeconómicos
   - Ingresos por NSE
3. **Guardar** - Los datos se almacenan automáticamente

### Evaluación de Localidad

1. **Ver Evaluación**: Click en el botón de una localidad
2. **Agregar Competidores**:
   - Nombre, tipo y tamaño
   - Distancia (proximidad)
   - **Ver cálculos en tiempo real** mientras completas el formulario
3. **Agregar Canibalizaciones** (opcional)
4. **Revisar resultados** con todas las métricas calculadas

### Visualización de Cálculos

Al agregar/editar competidores, se muestra una sección con:
- **Similarity(type)**: Afinidad entre tipos
- **Similarity(size)**: Similitud por tamaño
- **Affinity**: Afinidad total
- **Proximity**: Proximidad normalizada
- **Impact**: Impacto calculado
- **Competition Level**: Nivel de competencia
- **Accessibility**: Accesibilidad
- **Score**: Puntuación final
- **Share**: Participación del canal
- **Aporte**: Contribución total

Cada métrica muestra la fórmula utilizada para su cálculo.

### Configuración de Zonas

1. Click en "⚙️ Configuración"
2. Seleccionar zona (Popular, Media, Alta)
3. Ajustar parámetros:
   - % Hogares 5min/10min
   - % Gastos
   - Rangos de pesos por tipo de competidor
4. Guardar cambios

## 📁 Estructura del Proyecto

```
retail-foundry/
├── index.html                          # Página principal (SPA)
├── evaluation.html                     # Página de evaluación (SPA)
├── README.md                           # Este archivo
├── static/
│   ├── css/
│   │   └── styles.css                 # Estilos de la aplicación
│   └── js/
│       ├── constants.js               # Constantes y configuración
│       ├── calculations.js            # Módulo de cálculos
│       ├── storage.js                 # Módulo de localStorage
│       ├── app-new.js                 # Lógica principal SPA
│       └── evaluation-new.js          # Lógica de evaluación SPA
└── [archivos obsoletos Go]            # Ya no se usan
```

## 💾 Gestión de Datos

### Almacenamiento

Los datos se guardan automáticamente en **localStorage** del navegador:
- Localidades
- Competidores
- Canibalizaciones
- Zonas de movilidad

### 📥 Exportar Datos (Nuevo)

Puedes exportar todos tus datos con un solo click:

1. Click en el botón **"📥 Exportar Datos"** en el header
2. Se descargará automáticamente un archivo JSON con formato:
   - `retail-foundry-backup-YYYY-MM-DD.json`
3. El archivo incluye:
   - ✅ Todas las localidades
   - ✅ Todos los competidores
   - ✅ Todas las canibalizaciones
   - ✅ Configuración de zonas de movilidad

**Uso recomendado:**
- Hacer backups periódicos de tus datos
- Transferir datos entre dispositivos
- Compartir datos con otros usuarios

### 📤 Importar Datos (Nuevo)

Puedes importar datos desde un archivo JSON exportado previamente:

1. Click en el botón **"📤 Importar Datos"** en el header
2. Selecciona un archivo JSON válido
3. Revisa el resumen de datos a importar
4. Confirma la importación

**⚠️ IMPORTANTE:**
- La importación **reemplazará todos los datos actuales**
- Se recomienda exportar tus datos actuales antes de importar
- El archivo debe ser un JSON válido exportado por la aplicación

### Exportar/Importar desde Consola (Avanzado)

También puedes usar la consola del navegador (F12):

```javascript
// Exportar todos los datos
const data = exportData();
console.log(JSON.stringify(data));

// Importar datos desde JSON
const data = { /* tu JSON aquí */ };
importData(data);

// Limpiar todos los datos (cuidado!)
clearAllData();
```

## 🌐 Despliegue en GitHub Pages

La aplicación está lista para GitHub Pages:

1. Crear repositorio en GitHub
2. Subir archivos (solo los necesarios):
   - `index.html`
   - `evaluation.html`
   - `static/` (completa)
3. Ir a Settings → Pages
4. Seleccionar rama y carpeta raíz
5. Aplicación disponible en: `https://[usuario].github.io/[repo]/`

## 🔧 Solución de Problemas

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- No uses modo incógnito
- Revisa la consola del navegador (F12) por errores

### Los cálculos no se muestran
- Completa todos los campos requeridos
- Asegúrate de que la localidad tenga tipo y tamaño
- Verifica la consola por errores

### La aplicación no carga
- Abre `index.html` (no los archivos en `templates/`)
- Usa un navegador moderno compatible
- Verifica que todos los archivos JS estén en `static/js/`

### Error de módulos ES6
- Algunos navegadores requieren servir desde un servidor HTTP
- Usa extensiones como "Live Server" en VS Code
- O usa Python: `python -m http.server 8000`

## 📊 Cálculos Realizados

### Población Total
```
(Hogares 5min × % Hogares 5) + (Hogares 10min × % Hogares 10)
```

### Población Efectiva por NSE
```
Población NSE × Factor de Mercado Efectivo (según tipo de localidad)
```
Ver tabla de factores en sección "Factores de Mercado Efectivo"

### Hogares por NSE
```
Población × (% NSE / 100)
```

### Gastos Promedio por NSE
```
Hogares Efectivos NSE × Ingresos NSE × (% Gastos / 100)
```

### Gastos Totales
```
Suma de gastos de todos los NSE (usando población efectiva)
```

### Ajuste por Competencia
```
CompetitionAdjustmentAmount = totalExpenses × (1 - CompetitionNorm) × share
```

### Cálculo de Gastos Ajustados (Paso a Paso)

```
1. Gastos después de Competencia:
   expensesAfterCompetition = totalExpenses × (1 - competitionNorm)

2. Gastos Ajustados por Share:
   totalAdjustedExpenses = expensesAfterCompetition × share

3. Gastos Finales (después de Canibalización):
   finalAdjustedExpenses = totalAdjustedExpenses × (1 - cannibalizationAdjustment)
```

**Nota:** El cálculo ahora aplica los ajustes de forma multiplicativa en lugar de sustractiva, reflejando mejor el impacto porcentual de cada factor.

### Viabilidad
- **No Viable**: < $160,000
- **Viable**: $160,000 - $180,000
- **Óptimo**: ≥ $180,000

## 📚 Constantes y Configuración

Todas las constantes de la aplicación están definidas en `static/js/constants.js`:

### COMPETITOR_TYPES
Tipos de competidores/localidades disponibles:
- Supermercado
- Discounters
- Tradicional
- Especializados
- Otros

### TYPE_AFFINITY_MATRIX
Matriz de afinidad entre tipos (ver tabla en sección "Matriz de Afinidad por Tipo")

### CAPTURE_RANGES
Rangos de captura de canal (min-max %) por tipo de competidor y zona de movilidad:

| Tipo | Zona Popular | Zona Media | Zona Alta |
|------|--------------|------------|----------|
| Supermercado | 15-22% | 22-30% | 30-40% |
| Discounters | 20-30% | 12-20% | 5-10% |
| Tradicional | 25-40% | 15-25% | 5-12% |
| Especializados | 5-10% | 8-15% | 15-25% |
| Otros | 2-5% | 2-5% | 3-6% |

### ACCESSIBILITY_VALUES
Valores de accesibilidad por tipo de competidor:
- Supermercado: 0.9
- Discounters: 0.6
- Tradicional: 0.6
- Especializados: 0.3
- Otros: 0.3

### VIABILITY_CRITERIA
- Mínimo viable: $160,000
- Óptimo: $180,000

### DEFAULT_NSE_INCOME
Ingresos por defecto por NSE:
- NSE D: $460
- NSE C-: $803
- NSE C+: $2,100
- NSE B: $4,013

### EFFECTIVE_MARKET_FACTORS
Factores de mercado efectivo por NSE y tipo de localidad (ver tabla en sección "Factores de Mercado Efectivo")

### DEFAULT_MOBILITY_ZONES
Tres zonas de movilidad predefinidas:
- Zona popular (80% hogares 5min, 20% hogares 10min)
- Zona media (60% hogares 5min, 40% hogares 10min)
- Zona alta (50% hogares 5min, 55% hogares 10min)

### STORAGE_KEYS
Claves de localStorage:
- `rf_locations`: Localidades
- `rf_competitors`: Competidores
- `rf_cannibalizations`: Canibalizaciones
- `rf_mobility_zones`: Zonas de movilidad
- `rf_global_config`: Configuración global

## 📤 Exportación de Resultados

La aplicación permite exportar los resultados completos de evaluación en formato JSON:

1. Click en "📊 Exportar Resultados" en la página de evaluación
2. Se descarga un archivo JSON con:
   - Metadata (fecha, localidad, versión)
   - Datos completos de la localidad
   - Análisis de población y gastos
   - Análisis de competencia (competidores, métricas, fórmulas, cálculos)
   - Análisis de canibalización
   - Resultados finales y viabilidad

**Uso:** El JSON exportado contiene información suficiente para que una IA pueda verificar la exactitud de todos los cálculos.

## 🗂️ Archivos Obsoletos

Los siguientes archivos ya **NO se usan** (pueden eliminarse):

```
❌ main.go
❌ go.mod
❌ run.sh
❌ run.bat
❌ database/
❌ handlers/
❌ models/
❌ templates/ (versiones Go)
❌ static/js/app.js (versión antigua)
❌ static/js/evaluation.js (versión antigua)
```

## 📝 Notas de Migración

Esta aplicación fue migrada de:
- **Backend**: Go → JavaScript
- **Base de datos**: SQLite → localStorage
- **Arquitectura**: Server-side → Single Page Application

Todos los cálculos y funcionalidades se mantienen, con mejoras en:
- Visualización de fórmulas en tiempo real
- Nuevos campos (type, size)
- Nuevas fórmulas de cálculo más precisas
- Interfaz más interactiva

## 📄 Licencia

Este proyecto es de uso interno.

---

**Versión:** 2.0 (SPA)  
**Última actualización:** Marzo 2026
