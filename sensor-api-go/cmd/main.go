package main

import (
    "log"
    "os"
    "sensor-api-go/config"
    "sensor-api-go/routes"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
)

func main() {
    // Carga config desde variables de entorno
    cfg := config.LoadConfig()
    db := config.SetupDB(cfg)

    r := gin.Default()

    // ----------- CORS dinámico según entorno -----------
    allowOrigins := []string{"http://localhost:5173"} // local
    // Permite orígenes adicionales si defines FRONTEND_URL en producción
    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL != "" {
        allowOrigins = append(allowOrigins, frontendURL)
    }

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
        port = "8080" // ⚡ Cambia si prefieres 3001 u otro default
    }
    log.Printf("Servidor escuchando en el puerto %s", port)
    if err := r.Run(":" + port); err != nil {
        log.Fatalf("No se pudo iniciar el servidor: %v", err)
    }
    // ------------------------------------------------------
}
