package routes

import (
	"sensor-api-go/controllers"
	"sensor-api-go/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes define todas las rutas protegidas y públicas del API.
// Compatible con despliegue local y en la nube (AWS/RDS).
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// --------- Endpoint público para health check ---------
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	// -----------------------------------------------------

	api := r.Group("/api")
	{
		// --- Autenticación ---
		api.POST("/login", controllers.Login(db))

		// --- Endpoints principales protegidos ---
		api.GET("/camera-readings", middleware.JWTAuthMiddleware(), controllers.GetCameraReadings(db))
		api.GET("/cameras", middleware.JWTAuthMiddleware(), controllers.ListUniqueCameras(db))
		api.GET("/cameras/:camera_id/status", middleware.JWTAuthMiddleware(), controllers.CameraStatusDashboard(db))

		// --- NUEVO: Zonas por cámara (usado por Alerts.jsx) ---
		api.GET("/cameras/:camera_id/zonas", middleware.JWTAuthMiddleware(), controllers.ListZonasByCamera(db))

		// --- Empresas ---
		api.GET("/companies", controllers.ListCompanies(db)) // Pública o protégela según tu modelo

		// --- User Management ---
		api.GET("/users", middleware.JWTAuthMiddleware(), controllers.ListUsers(db))
		api.POST("/users", middleware.JWTAuthMiddleware(), controllers.CreateUser(db))

		// --- Dispositivos y Zonas ---
		api.GET("/devices", middleware.JWTAuthMiddleware(), controllers.GetDevicesWithZones(db))

		// --- Device Alerts ---
		api.GET("/device-alerts", middleware.JWTAuthMiddleware(), controllers.ListDeviceAlerts(db))
		api.POST("/device-alerts", middleware.JWTAuthMiddleware(), controllers.CreateDeviceAlert(db))
		api.PUT("/device-alerts/:id", middleware.JWTAuthMiddleware(), controllers.UpdateDeviceAlert(db))
		api.DELETE("/device-alerts/:id", middleware.JWTAuthMiddleware(), controllers.DeleteDeviceAlert(db))

		// --- Zone Alerts ---
		api.GET("/zone-alerts", middleware.JWTAuthMiddleware(), controllers.ListZoneAlerts(db))
		api.POST("/zone-alerts", middleware.JWTAuthMiddleware(), controllers.CreateZoneAlert(db))
		api.PUT("/zone-alerts/:id", middleware.JWTAuthMiddleware(), controllers.UpdateZoneAlert(db))
		api.DELETE("/zone-alerts/:id", middleware.JWTAuthMiddleware(), controllers.DeleteZoneAlert(db))
	}
}
