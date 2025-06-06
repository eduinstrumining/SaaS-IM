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
    if err := godotenv.Load(rootEnv); err != nil {
        // Si no lo encuentra, intenta cargar el .env local
        godotenv.Load(".env")
    }

    // Carga config desde variables de entorno
    cfg := config.LoadConfig()
    db := config.SetupDB(cfg)

    r := gin.Default()

    // ----------- CORS dinámico según entorno -----------
    allowOrigins := []string{"http://localhost:5173"}

    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL != "" {
        allowOrigins = append(allowOrigins, frontendURL)
    } else {
        log.Println("[WARN] FRONTEND_URL no definido, sólo se permite localhost para CORS")
    }

    log.Printf("CORS allowed origins: %v\n", allowOrigins)

    r.Use(cors.New(cors.Config{
        AllowOrigins:     allowOrigins,
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))
    // ---------------------------------------------------

    routes.SetupRoutes(r, db)

    // ----------- Puerto dinámico: local y nube -----------
    port := os.Getenv("PORT")
    if port == "" {
        port = "5000"
    }
    log.Printf("Servidor escuchando en el puerto %s", port)

    if err := r.Run(":" + port); err != nil {
        log.Fatalf("No se pudo iniciar el servidor: %v", err)
    }
}
