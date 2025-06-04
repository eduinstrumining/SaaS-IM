module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { 
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        flowforge: {
          dark: "#0A0D12",         // Fondo general, muy oscuro casi negro
          panel: "#1F2937",        // Fondo panel inputs, gris azulado oscuro
          border: "#374151",       // Bordes medios, gris oscuro azulado
          accent: "#72B1FF",       // Azul celeste brillante para focus y acentos
          buttonBg: "#A9E7FF",     // Celeste pastel claro para botones
          buttonHover: "#8ED1FF",  // Celeste pastel hover para botones
          error: "#EF4444",        // Rojo para errores
          placeholder: "#9CA3AF",  // Gris para placeholders
          textLight: "#F9FAFB",    // Texto blanco casi puro para contraste
          textDark: "#111827",     // Texto oscuro para fondos claros (si aplica)
        }
      }
    } 
  },
  plugins: [],
}
