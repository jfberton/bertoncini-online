# Bertoncini Herramientas & Ferretería Industrial
### Plataforma de Catálogo Online, Tienda Mercado Libre, Carrito B2B y Panel Analytics

Plataforma web moderna de alto rendimiento desarrollada a medida para **Bertoncini (Resistencia, Chaco)**, integrando los **1.137 artículos reales** de su base de datos, carrito de pedidos con cotizaciones estructuradas por WhatsApp, vinculación inteligente con su **Tienda Oficial en Mercado Libre** y un **Panel de Métricas y Analytics en tiempo real**.

---

## 🎨 Identidad & Nuevas Funcionalidades

- **Tema Claro y Modo Oscuro (Light & Dark Mode):** Switch interactivo en el header con icono de Sol (☀️) y Luna (🌙), guardando la preferencia del usuario automáticamente.
- **Tienda Oficial Mercado Libre:**
  - Banner destacado en la landing con acceso directo a la página de vendedor `HIGINIOBERTONCINIYCIASA`.
  - **Botón "Ver en Mercado Libre" en cada uno de los 1.137 productos:** Busca el producto automáticamente dentro del catálogo oficial de Bertoncini en Mercado Libre.
- **📊 Panel de Métricas & Analytics (Dashboard en Tiempo Real):**
  - Registra visitas a la página.
  - Registra clicks en el Banner principal de Mercado Libre.
  - Registra clicks en botones de productos individuales hacia Mercado Libre con ranking de los más solicitados.
  - Registra pedidos generados por WhatsApp y carritos armados.
  - Acceso desde el pie de página o mediante el atajo de teclado **`Alt + A`**.
- **Catálogo Completo con 1.137 Artículos:** Buscador por SKU, marcas y categorías.
- **Cortes y Medidas a Pedido:** Campo editable para especificar cortes de chapas, caños, perfiles, etc., tanto al agregar como en el carrito.
- **Cotizador por WhatsApp & Hoja de Impresión/PDF.**

---

## 🚀 Cómo Ejecutar la Aplicación

### Opción 1: Abrir directamente en el navegador
Hacé doble clic en `index.html` en el explorador de Windows. Funciona de forma 100% autónoma.

### Opción 2: Servidor Local Integrado (PowerShell)
Abrí una terminal en esta carpeta y ejecutá:
```powershell
pwsh -File server.ps1
```
Se abrirá automáticamente en `http://localhost:3000/`.

---

## ⚙️ Configuración

En `js/app.js` podés configurar las URLs y números de contacto:

```javascript
const CONFIG = {
  WHATSAPP_PHONE: '5493624608000',
  ML_STORE_URL: 'https://www.mercadolibre.com.ar/pagina/higiniobertonciniyciasa',
  ML_SEARCH_BASE: 'https://listado.mercadolibre.com.ar/pagina/higiniobertonciniyciasa/',
  STORE_NAME: 'Bertoncini Herramientas & Suministros Industriales',
  LOCATION: 'Av. Alvear 2100, Resistencia, Chaco'
};
```
