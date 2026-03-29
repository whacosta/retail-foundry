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

### Campos Renombrados

| Campo Anterior | Campo Nuevo | Descripción |
|----------------|-------------|-------------|
| `Distance` | `Proximity` | Distancia en metros |
| `Weight` | `Impact` | Impacto calculado |
| `ChannelCapture` | `Share` | Participación del canal |

### Nuevas Fórmulas de Cálculo

```
Similarity(type) = Valor de matriz de afinidad
Similarity(size) = MIN(1, (Competitor.size / Location.size)^0.5)
Affinity = Similarity(type) × Similarity(size)
Proximity = 1 / (1 + distance/1000)
Impact = Affinity × Proximity
Score = (CompetitionLevel + Accessibility + Affinity) / 3
Share = CaptureMin + (CaptureMax - CaptureMin) × Score
Aporte = Impact × Share
```

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

### Hogares por NSE
```
Población × (% NSE / 100)
```

### Gastos Promedio por NSE
```
Hogares NSE × Ingresos NSE × (% Gastos / 100)
```

### Gastos Totales
```
Suma de gastos de todos los NSE
```

### Ajuste por Competencia
```
Suma de aportes de todos los competidores
```

### Gastos Ajustados Finales
```
Gastos Totales - Ajuste Competencia - Ajuste Canibalización
```

### Viabilidad
- **No Viable**: < $160,000
- **Viable**: $160,000 - $180,000
- **Óptimo**: ≥ $180,000

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
