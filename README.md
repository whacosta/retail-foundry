# Retail Foundry

Aplicación para analizar la factibilidad de localidades para abrir tiendas de retail.

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

## 🚀 Inicio Rápido

1. **Crear una localidad** con sus datos demográficos
2. **Agregar competidores** cercanos a la localidad
3. **Revisar los resultados** de viabilidad calculados automáticamente
4. **Exportar los datos** para análisis posterior

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

**Datos requeridos:**
- **Nombre** de la localidad
- **Tipo** de formato (Supermercado, Discounters, etc.)
- **Tamaño** en metros cuadrados
- **Ubicación** (latitud y longitud)
- **Datos demográficos:**
  - Hogares a 5 minutos y su porcentaje
  - Hogares a 10 minutos y su porcentaje
  - Distribución por NSE (% de cada nivel socioeconómico)
  - Ingresos promedio por NSE
  - Porcentaje de gastos

### 2. Agregar Competidores

Para cada competidor cercano, registrar:
- **Nombre** del competidor
- **Tipo** de formato
- **Tamaño** en m²
- **Distancia** en metros desde la localidad

La aplicación calculará automáticamente todas las métricas de impacto.

### 3. Agregar Canibalizaciones (Opcional)

Si existen otras tiendas propias que puedan canibalizar ventas:
- **Nombre** de la tienda
- **Peso de canibalización** (porcentaje estimado)

### 4. Revisar Resultados

La aplicación muestra:
- **Gastos totales estimados** basados en población efectiva
- **Gastos ajustados** después de competencia y canibalización
- **Criterio de viabilidad** (No Viable, Viable, Óptimo)
- **Detalle de todos los cálculos** con fórmulas y valores

### 5. Configurar Criterios de Viabilidad (Opcional)

Para ajustar los umbrales de viabilidad según tu negocio:

1. Click en **⚙️ Configuración**
2. Seleccionar tab **"Criterios de Viabilidad"**
3. Ajustar valores en la tabla:
   - **Mínimo Viable**: Umbral mínimo para considerar viable
   - **Óptimo**: Umbral para considerar óptimo
4. Los criterios se aplican automáticamente según el tipo de localidad
5. Click en **"Guardar Configuración"**

**Nota:** Cada tipo de localidad (Supermercado, Discounters, etc.) puede tener diferentes criterios de viabilidad.

## 💾 Gestión de Datos

### Exportar Datos

**Backup completo:**
- Click en "📥 Exportar Datos" para descargar todas las localidades, competidores y configuraciones
- Archivo formato: `retail-foundry-backup-YYYY-MM-DD.json`

**Exportar resultados de evaluación:**
- Click en "� Exportar Resultados" en la página de evaluación
- Incluye todos los cálculos, fórmulas y valores intermedios
- Útil para auditoría y verificación de cálculos

### Importar Datos

- Click en "📤 Importar Datos"
- Seleccionar archivo JSON previamente exportado
- **Nota:** La importación reemplaza todos los datos actuales

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

## 📄 Notas Finales

- Todos los cálculos se realizan en tiempo real
- Las fórmulas y valores intermedios son visibles en la interfaz
- Los datos se almacenan localmente en el navegador
- Se recomienda exportar backups periódicamente

---

**Última actualización:** Marzo 2026
