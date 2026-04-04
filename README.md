# Retail Foundry

Aplicación para analizar la factibilidad de localidades para abrir tiendas de retail.
Las formulas estan calibradas para su uso en el mercado Ecuatoriano, las constantes deben refinarse según la realidad geografica de cada retail.

Esta aplicación fue desarrollada con Claude Sonnet 4.5 

Según pruebas tiene un porcentaje de confiabilidad del 85% comparando los datos con los datos reales del local posterior a su apertura.
Se debe considerar la accesibilidad demografica del sector, que puede influir en los calculos y generar fallas en los resultados.

🌐 **Demo en vivo:** [https://whacosta.github.io/retail-foundry/](https://whacosta.github.io/retail-foundry/)

Se puede ejecutar localmente con cualquier servidor web, ejemplo:
```python
python3 -m http.server 8000
```

## � Descripción General

Retail Foundry es una herramienta de análisis que permite evaluar la viabilidad de abrir una tienda en una localidad específica, considerando:

- **Análisis demográfico** por nivel socioeconómico (NSE)
- **Evaluación de competencia** en el área
- **Cálculo de canibalización** con otras tiendas propias
- **Estimación de gastos** y viabilidad financiera

## ✨ Funcionalidades Principales

### 📍 Gestión de Localidades
- ✅ Crear, editar y eliminar localidades
- ✅ Búsqueda y filtrado de localidades
- ✅ Paginación y ordenamiento
- ✅ Integración con mapas (Leaflet + OpenStreetMap)
- ✅ Geocodificación inversa automática (provincia, cantón, parroquia)
- ✅ Cálculo automático de distancias usando coordenadas

### 📊 Evaluación Completa
- ✅ Página de evaluación detallada por localidad
- ✅ Visualización de viabilidad con código de colores
- ✅ Desglose completo de cálculos con fórmulas
- ✅ Gráficos de distribución por NSE
- ✅ Mapa interactivo con ubicación de la localidad
- ✅ Diseño responsive (desktop, tablet, móvil)

### 🏪 Gestión de Competidores
- ✅ Agregar competidores con coordenadas GPS
- ✅ Cálculo automático de distancia desde la localidad
- ✅ Edición de competidores con recálculo automático
- ✅ Visualización de métricas en tiempo real (Similarity, Affinity, Proximity, Impact)
- ✅ Tabla interactiva con todas las métricas

### 🔄 Gestión de Canibalizaciones
- ✅ Agregar locales propios que puedan canibalizar ventas
- ✅ Cálculo automático de factor de canibalización
- ✅ Edición con recálculo automático de métricas
- ✅ Visualización de impacto en gastos finales

### ⚙️ Configuración Avanzada
- ✅ **Zonas de Movilidad**: Configurar parámetros por zona (Popular, Media, Alta)
- ✅ **Ingresos NSE**: Ajustar ingresos promedio por nivel socioeconómico
- ✅ **Criterios de Viabilidad**: Personalizar umbrales por tipo de localidad
- ✅ **Constantes del Sistema**: Visualizar todas las constantes y fórmulas (solo lectura)

### 💾 Importación/Exportación
- ✅ **Exportar a Excel** (.xlsx) con 3 hojas: Localidades, Competidores, Canibalizadores
- ✅ **Importar desde Excel** con validación de duplicados
- ✅ **Exportar a JSON** (backup completo del sistema)
- ✅ **Importar desde JSON** (restaurar backup)
- ✅ **Exportar resultados de evaluación** con todos los cálculos

### 🎨 Interfaz de Usuario
- ✅ Diseño moderno y responsive
- ✅ Tabs para organizar configuraciones
- ✅ Modales para formularios
- ✅ Validación de datos en tiempo real
- ✅ Feedback visual de acciones
- ✅ Símbolos de moneda y unidades automáticos

## 🚀 Inicio Rápido

1. **Crear una localidad** con sus datos demográficos (o importar desde Excel)
2. **Hacer clic en "Evaluar"** para acceder a la página de evaluación completa
3. **Agregar competidores y canibalizadores** directamente desde la evaluación
4. **Revisar los resultados** de viabilidad calculados automáticamente
5. **Exportar los datos** en formato JSON o Excel para análisis posterior

## 📊 Tipos de Localidades y Competidores

La aplicación maneja cinco tipos de formatos de retail:

- **Supermercado**: Tiendas de formato tradicional
- **Discounters**: Tiendas de descuento
- **Tradicional**: Comercio tradicional/tiendas de barrio
- **Especializados**: Tiendas especializadas
- **Otros**: Otros formatos

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

## 🧮 Fórmulas de Cálculo

### Métricas Individuales por Competidor

Para cada competidor se calculan las siguientes métricas:

**1. Similarity(type) - Similitud por Tipo**
```
Valor obtenido de la matriz de afinidad según los tipos de localidad y competidor
```

**2. Similarity(size) - Similitud por Tamaño**
```
MIN(1, (Tamaño Competidor / Tamaño Localidad)^0.5)
```

**3. Affinity - Afinidad**
```
Affinity = Similarity(type) × Similarity(size)
```

**4. Proximity - Proximidad**
```
Proximity = 1 / (1 + distancia / 300)
```
Donde distancia está en metros.

**5. Impact - Impacto**
```
Impact = Affinity × Proximity
```

**6. Accessibility - Accesibilidad**
```
Valor fijo según el tipo de competidor (ver tabla de Accesibilidad)
```

### Métricas Globales de Competencia

Estas métricas se calculan una sola vez para toda la localidad:

**1. Competition Level - Nivel de Competencia**
```
CompetitionLevel = SUMA de todos los impacts de los competidores
```

**2. Competition Norm - Normalización de Competencia**
```
CompetitionNorm = 1 - e^(-CompetitionLevel)
```

**3. Score - Puntuación**
```
Score = 0.6 × Accesibilidad Promedio + 0.4 × (1 - CompetitionNorm)
```

**4. Share - Participación**
```
Share = ShareMin + (ShareMax - ShareMin) × Score
```
Donde ShareMin y ShareMax dependen del tipo de localidad y zona de movilidad.

### Matriz de Afinidad por Tipo

|                    | Supermercado | Discounters | Tradicional | Especializados | Otros |
|--------------------|--------------|-------------|-------------|----------------|-------|
| **Supermercado**   | 1.0          | 0.85        | 0.45        | 0.25           | 0.10  |
| **Discounters**    | 0.85         | 1.0         | 0.60        | 0.15           | 0.10  |
| **Tradicional**    | 0.45         | 0.60        | 1.0         | 0.20           | 0.10  |
| **Especializados** | 0.25         | 0.15        | 0.20        | 1.0            | 0.10  |
| **Otros**          | 0.10         | 0.10        | 0.10        | 0.10           | 1.0   |

## 📖 Uso de la Aplicación

### 1. Crear una Localidad

**Opción A: Crear manualmente**
1. Click en **"+ Nueva Localidad"**
2. Completar el formulario con:
   - **Nombre** de la localidad
   - **Tipo** de formato (Supermercado, Discounters, etc.)
   - **Tamaño** en metros cuadrados
   - **Ubicación** (latitud y longitud) - Se autocompleta provincia, cantón y parroquia
   - **Zona de Movilidad** (Popular, Media, Alta)
   - **Datos demográficos:**
     - Hogares a 5 minutos y su porcentaje
     - Hogares a 10 minutos y su porcentaje
     - Distribución por NSE (% de cada nivel socioeconómico)
     - Ingresos promedio por NSE (se cargan valores por defecto configurables)
     - Porcentaje de gastos
3. Click en **"Guardar"**

**Opción B: Importar desde Excel**
1. Click en **"📤 Importar Excel"**
2. Seleccionar archivo .xlsx con 3 hojas: Localidades, Competidores, Canibalizadores
3. El sistema valida y detecta duplicados automáticamente
4. Confirmar importación

### 2. Acceder a la Evaluación

1. En la tabla de localidades, click en **"Evaluar"** en la localidad deseada
2. Se abre la página de evaluación completa con:
   - Resumen de viabilidad con código de colores
   - Información detallada de la localidad
   - Mapa interactivo
   - Distribución por NSE
   - Gastos estimados
   - Secciones para competidores y canibalizadores

### 3. Agregar Competidores

Desde la página de evaluación:
1. Click en **"+ Agregar Competidor"**
2. Completar datos:
   - **Nombre** del competidor
   - **Tipo** de formato
   - **Tamaño** en m²
   - **Coordenadas GPS** (latitud y longitud)
   - La **distancia se calcula automáticamente**
3. Ver resultados de cálculos en tiempo real:
   - Similarity(type), Similarity(size)
   - Affinity, Proximity
   - Impact, Accessibility
4. Click en **"Guardar"**

**Editar competidor:**
- Click en **"Editar"** en la tabla de competidores
- Los cálculos se actualizan automáticamente
- Si hay coordenadas, la distancia se recalcula

### 4. Agregar Canibalizaciones (Opcional)

Desde la página de evaluación:
1. Click en **"+ Agregar Canibalización"**
2. Completar datos:
   - **Nombre** del local propio
   - **Tamaño** en m²
   - **Coordenadas GPS** (latitud y longitud)
   - La **distancia se calcula automáticamente**
3. Ver resultados de cálculos en tiempo real:
   - Proximity, Size Factor
   - Base, Cannibalization Factor
   - Impact
4. Click en **"Guardar"**

### 5. Revisar Resultados

La página de evaluación muestra:
- **Viabilidad** con código de colores (No Viable/Rojo, Viable/Naranja, Óptimo/Verde)
- **Población Efectiva** calculada con factores de mercado
- **Gastos Totales Estimados** basados en población efectiva
- **Gastos Finales Ajustados** después de competencia y canibalización
- **Desglose completo** de todos los cálculos con fórmulas
- **Tablas interactivas** de competidores y canibalizadores
- **Mapa** con la ubicación exacta

### 6. Configuración del Sistema

Click en **⚙️ Configuración** para acceder a 4 tabs:

#### Tab 1: Zonas de Movilidad
- Configurar parámetros para cada zona (Popular, Media, Alta):
  - % Hogares 5min
  - % Hogares 10min
  - % Gastos

#### Tab 2: Ingresos NSE
- Ajustar ingresos promedio mensuales por nivel socioeconómico:
  - NSE D
  - NSE C-
  - NSE C+
  - NSE B

#### Tab 3: Criterios de Viabilidad
- Personalizar umbrales por tipo de localidad:
  - **Mínimo Viable**: Umbral mínimo para considerar viable
  - **Óptimo**: Umbral para considerar óptimo
- Cada tipo (Supermercado, Discounters, etc.) tiene sus propios criterios

#### Tab 4: Constantes del Sistema (Solo lectura)
- Visualizar todas las constantes utilizadas en los cálculos:
  - Matriz de Afinidad por Tipo
  - Rangos de Captura de Mercado
  - Valores de Accesibilidad
  - Factores de Mercado Efectivo por NSE
  - Umbrales de Distancia
  - Fórmulas de Cálculo Principales

**Nota:** Los cambios en configuración se aplican inmediatamente a todas las evaluaciones.

## 💾 Gestión de Datos

### Exportar Datos

**Opción 1: Exportar a Excel (.xlsx)**
- Click en **"� Exportar Excel"** en la página principal
- Genera archivo con 3 hojas:
  - **Localidades**: Todos los datos demográficos y de ubicación
  - **Competidores**: Todos los competidores con sus métricas
  - **Canibalizadores**: Todos los canibalizadores registrados
  - **Tablas**: Datos de referencia (tipos, zonas)
- Formato: `localidades-YYYY-MM-DD_HH-MM.xlsx`
- Compatible con Excel, Google Sheets, LibreOffice

**Opción 2: Backup completo (JSON)**
- Click en **"📥 Exportar Datos"**
- Incluye localidades, competidores, canibalizaciones y configuraciones
- Formato: `retail-foundry-backup-YYYY-MM-DD.json`

**Opción 3: Exportar resultados de evaluación**
- Click en **"📊 Exportar Resultados"** en la página de evaluación
- Incluye todos los cálculos, fórmulas y valores intermedios
- Útil para auditoría y verificación de cálculos

### Importar Datos

**Opción 1: Importar desde Excel (.xlsx)**
- Click en **"📤 Importar Excel"**
- Seleccionar archivo .xlsx con estructura correcta (3 hojas)
- El sistema valida:
  - Existencia de las 3 hojas requeridas
  - Detección de IDs duplicados
  - Formato de datos
- Si hay duplicados, muestra advertencia y permite continuar
- **Nota:** Solo importa localidades nuevas (no duplicadas)

**Opción 2: Importar desde JSON**
- Click en **"📤 Importar Datos"**
- Seleccionar archivo JSON previamente exportado
- **Nota:** La importación reemplaza todos los datos actuales

### Plantilla de Excel

Para crear un archivo de importación:
1. Exportar datos existentes como referencia
2. O crear manualmente con estas hojas:
   - **Localidades**: ID, Nombre, Tipo, Tamaño (m²), Latitud, Longitud, etc.
   - **Competidores**: ID, Localidad ID, Nombre, Tipo, Tamaño (m²), Distancia (m)
   - **Canibalizadores**: ID, Localidad ID, Nombre, Tamaño (m²), Distancia (m), Factor Canibalización

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

## 📚 Parámetros y Configuración

### Tipos de Formatos

La aplicación reconoce cinco tipos de formatos de retail:
- Supermercado
- Discounters
- Tradicional
- Especializados
- Otros

### Matriz de Afinidad

La matriz de afinidad define qué tan similar es un tipo de competidor respecto al tipo de localidad (ver tabla completa en sección "Matriz de Afinidad por Tipo").

### Rangos de Participación (Share)

Rangos de participación de mercado (min-max %) según tipo de formato y zona de movilidad:

| Tipo | Zona Popular | Zona Media | Zona Alta |
|------|--------------|------------|----------|
| Supermercado | 15-22% | 22-30% | 30-40% |
| Discounters | 20-30% | 12-20% | 5-10% |
| Tradicional | 25-40% | 15-25% | 5-12% |
| Especializados | 5-10% | 8-15% | 15-25% |
| Otros | 2-5% | 2-5% | 3-6% |

### Valores de Accesibilidad

Valores fijos de accesibilidad según tipo de formato:
- Supermercado: 0.9
- Discounters: 0.6
- Tradicional: 0.6
- Especializados: 0.3
- Otros: 0.3

### Criterios de Viabilidad

La viabilidad de una localidad se determina según los gastos finales ajustados y el **tipo de localidad**. Los criterios son **configurables** desde el panel de configuración.

**Valores por defecto por tipo de localidad:**

| Tipo de Localidad | Mínimo Viable | Óptimo |
|-------------------|---------------|--------|
| Supermercado | $160,000 | $180,000 |
| Discounters | $140,000 | $160,000 |
| Tradicional | $100,000 | $120,000 |
| Especializados | $120,000 | $150,000 |
| Otros | $80,000 | $100,000 |

**Clasificación:**
- **No Viable**: Gastos finales < Mínimo Viable
- **Viable**: Mínimo Viable ≤ Gastos finales < Óptimo
- **Óptimo**: Gastos finales ≥ Óptimo

**Configuración:**
Los criterios pueden ajustarse desde **⚙️ Configuración → Criterios de Viabilidad**. Cada tipo de localidad puede tener sus propios umbrales según las características del negocio.

### Ingresos por NSE

Ingresos promedio mensuales por nivel socioeconómico:
- NSE D: $460
- NSE C-: $803
- NSE C+: $2,100
- NSE B: $4,013

### Factores de Mercado Efectivo

Ver tabla completa en sección "Factores de Mercado Efectivo por NSE y Formato".

### Zonas de Movilidad

La aplicación maneja tres zonas de movilidad predefinidas:

| Zona | Hogares 5min | Hogares 10min | % Gastos |
|------|--------------|---------------|----------|
| Popular | 80% | 20% | 35% |
| Media | 60% | 40% | 35% |
| Alta | 50% | 55% | 35% |

## 📊 Interpretación de Resultados

### Métricas Clave

**Gastos Totales Estimados:**
Potencial de mercado mensual basado en la población efectiva y sus ingresos.

**Gastos Ajustados por Competencia:**
Gastos después de aplicar el impacto de la competencia y la participación de mercado estimada.

**Gastos Finales Ajustados:**
Gastos después de aplicar tanto el ajuste por competencia como el ajuste por canibalización.

### Proceso de Cálculo

1. **Población Efectiva**: Se calcula aplicando factores de mercado según NSE y tipo de formato
2. **Gastos Totales**: Se estiman multiplicando población efectiva por ingresos y porcentaje de gastos
3. **Impacto de Competencia**: Se evalúa cada competidor y se calcula el nivel de competencia global
4. **Participación (Share)**: Se determina según el score de la localidad y los rangos del tipo de formato
5. **Ajuste por Competencia**: Se aplica la normalización de competencia y el share
6. **Ajuste por Canibalización**: Se aplica el porcentaje de canibalización estimado
7. **Viabilidad**: Se compara el resultado final contra los criterios establecidos

## �️ Tecnologías Utilizadas

### Frontend
- **HTML5, CSS3, JavaScript** (Vanilla JS, ES6 Modules)
- **Leaflet.js** - Mapas interactivos
- **OpenStreetMap** - Tiles de mapas
- **Nominatim** - Geocodificación inversa
- **SheetJS (xlsx)** - Importación/exportación Excel

### Almacenamiento
- **LocalStorage** - Persistencia de datos en el navegador
- **JSON** - Formato de datos y backups

### Arquitectura
- **SPA (Single Page Application)** - Navegación sin recargas
- **Modular** - Código organizado en módulos ES6
- **Responsive** - Diseño adaptable (Flexbox + Grid CSS)
- **Progressive Enhancement** - Funciona sin JavaScript (formularios básicos)

### Estructura del Proyecto
```
retail-foundry/
├── index.html              # Página principal
├── evaluation.html         # Página de evaluación
├── static/
│   ├── css/
│   │   └── styles.css     # Estilos globales
│   ├── js/
│   │   ├── app.js         # Lógica principal
│   │   ├── evaluation.js  # Lógica de evaluación
│   │   ├── calculations.js # Fórmulas y cálculos
│   │   ├── constants.js   # Constantes del sistema
│   │   ├── storage.js     # Gestión de localStorage
│   │   └── excelHandler.js # Import/Export Excel
│   └── docs/
│       └── sample_import.xlsx # Plantilla de ejemplo
└── README.md
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ Opera (últimas 2 versiones)

### Dispositivos
- ✅ Desktop (1024px+)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (320px - 768px)

### Características Responsive
- Grids adaptativos (4 → 2 → 1 columnas)
- Tablas con scroll horizontal
- Modales optimizados para móvil
- Botones táctiles de tamaño adecuado
- Formularios de una columna en móvil

## �📄 Notas Finales

- ✅ Todos los cálculos se realizan en tiempo real
- ✅ Las fórmulas y valores intermedios son visibles en la interfaz
- ✅ Los datos se almacenan localmente en el navegador (sin servidor)
- ✅ Se recomienda exportar backups periódicamente
- ✅ La aplicación funciona completamente offline después de la primera carga
- ✅ No requiere instalación ni registro
- ✅ Código abierto y auditable

## 🤝 Contribuciones

Este proyecto fue desarrollado con **Claude Sonnet 4.5** como asistente de desarrollo.

Para reportar bugs o sugerir mejoras, visita el repositorio en GitHub.

---

**Última actualización:** Abril 2026
**Versión:** 2.0
