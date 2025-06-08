package main

import (
    "log"
    "os"
    "sensor-api-go/config"
    "sensor-api-go/routes"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "github.com/joho/godotenv"
    "path/filepath"
)

func main() {
    // --- Cargar .env desde la raíz, sin importar desde dónde corres ---
    rootEnv := filepath.Join("..", ".env")
    _ = godotenv.Load(rootEnv) // No falla si no está
    _ = godotenv.Load(".env")  // Tampoco falla si no está

    // Carga config desde variables de entorno (estructura propia)
    cfg := config.LoadConfig()
    db := config.SetupDB(cfg)

    r := gin.Default()

    // ----------- CORS dinámico según entorno N-----------
    allowOrigins := []string{"http://localhost:5173"}

    if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
        allowOrigins = append(allowOrigins, frontendURL)
        log.Printf("[INFO] FRONTEND_URL permitido para CORS: %s", frontendURL)
    } else {
        log.Println("[WARN] FRONTEND_URL no definido, sólo se permite localhost para CORS")
    }

    r.Use(cors.New(cors.Config{
        AllowOrigins:     allowOrigins,
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))
    // ---------------------------------------------------

    // ----------- Setea todas las rutas y API -----------
    routes.SetupRoutes(r, db)

    // ----------- Puerto dinámico: local y nube -----------
    port := os.Getenv("PORT")
    if port == "" {
        port = "5000" // Para local, por defecto
    }
    log.Printf("[INFO] Servidor escuchando en el puerto %s", port)

    if err := r.Run(":" + port); err != nil {
        log.Fatalf("[FATAL] No se pudo iniciar el servidor: %v", err)
    }
}
