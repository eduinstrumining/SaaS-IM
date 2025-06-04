package main

import (
    "sensor-api-go/config"
    "sensor-api-go/routes"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
)

func main() {
    cfg := config.LoadConfig()
    db := config.SetupDB(cfg)
    r := gin.Default()

    // Configuración CORS
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"}, // ⚡ Puerto frontend Vite
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))

    routes.SetupRoutes(r, db)
    r.Run(":8080")
}
