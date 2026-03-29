# Instrucciones de Ejecución Local - Retail Foundry

## 🚀 Métodos para Ejecutar la Aplicación Localmente

### Método 1: Abrir Directamente (Simple pero puede tener limitaciones)

1. Navega a la carpeta del proyecto
2. Abre el archivo `index.html` con doble clic
3. O arrastra `index.html` a tu navegador

**⚠️ Nota:** Algunos navegadores pueden bloquear módulos ES6 por CORS.

---

### Método 2: Servidor HTTP con Python (Recomendado)

#### Si tienes Python 3 instalado:

```bash
# Navega a la carpeta del proyecto
cd /Users/wilmer.acosta/sources/retail-foundry

# Inicia el servidor
python3 -m http.server 8000
```

#### Si tienes Python 2:

```bash
python -m SimpleHTTPServer 8000
```

**Acceder a la aplicación:**
- Abre tu navegador
- Ve a: `http://localhost:8000`
- La aplicación se cargará automáticamente

---

### Método 3: Servidor HTTP con Node.js

#### Si tienes Node.js instalado:

```bash
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# Navega a la carpeta del proyecto
cd /Users/wilmer.acosta/sources/retail-foundry

# Inicia el servidor
http-server -p 8000
```

**Acceder:** `http://localhost:8000`

---

### Método 4: Live Server en VS Code (Más conveniente para desarrollo)

1. Instala la extensión "Live Server" en VS Code
2. Abre la carpeta del proyecto en VS Code
3. Click derecho en `index.html`
4. Selecciona "Open with Live Server"
5. Se abrirá automáticamente en tu navegador

**Ventaja:** Recarga automática cuando guardas cambios

---

## ✅ Verificar que Funciona Correctamente

Una vez que abras la aplicación, deberías ver:

1. **Página principal** con título "Retail Foundry"
2. **Botón "+ Nueva Localidad"**
3. **Tabla de localidades** (vacía si es primera vez)
4. **Botón "⚙️ Configuración"**

---

## 🔧 Solución de Problemas

### Error: "Failed to load module script"
- **Causa:** Módulos ES6 bloqueados por CORS
- **Solución:** Usa un servidor HTTP (Método 2, 3 o 4)

### La página se ve sin estilos
- **Verifica:** Que la carpeta `static/` esté completa
- **Verifica:** Que `static/css/styles.css` exista

### Los datos no se guardan
- **No uses modo incógnito** del navegador
- **Verifica:** Que localStorage esté habilitado en tu navegador

### Consola muestra errores de archivos JS
- **Verifica:** Que todos los archivos en `static/js/` existan:
  - `constants.js`
  - `calculations.js`
  - `storage.js`
  - `app-new.js`
  - `evaluation-new.js`

---

## 📱 Navegadores Compatibles

- ✅ Chrome 61+
- ✅ Firefox 60+
- ✅ Safari 11+
- ✅ Edge 79+

---

## 🎯 Próximos Pasos

1. Ejecuta la aplicación con uno de los métodos anteriores
2. Crea tu primera localidad con "+ Nueva Localidad"
3. Completa los datos requeridos
4. Agrega competidores y evalúa la viabilidad

---

**¿Necesitas ayuda adicional?** Abre la consola del navegador (F12) para ver mensajes de error detallados.
