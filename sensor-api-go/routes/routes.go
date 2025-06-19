package routes

import (
	"sensor-api-go/controllers"
	"sensor-api-go/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Endpoint público para health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login(db))

		api.GET("/camera-readings", middleware.JWTAuthMiddleware(), controllers.GetCameraReadings(db))
		api.GET("/cameras", middleware.JWTAuthMiddleware(), controllers.ListUniqueCameras(db))
		api.GET("/cameras/:camera_id/status", middleware.JWTAuthMiddleware(), controllers.CameraStatusDashboard(db))
		api.GET("/cameras/:camera_id/zonas", middleware.JWTAuthMiddleware(), controllers.ListZonasByCamera(db))
		api.GET("/companies", controllers.ListCompanies(db))
		api.GET("/users", middleware.JWTAuthMiddleware(), controllers.ListUsers(db))
		api.POST("/users", middleware.JWTAuthMiddleware(), controllers.CreateUser(db))
		api.GET("/devices", middleware.JWTAuthMiddleware(), controllers.GetDevicesWithZones(db))

		// Device Alerts
		api.GET("/device-alerts", middleware.JWTAuthMiddleware(), controllers.ListDeviceAlerts(db))
		api.POST("/device-alerts", middleware.JWTAuthMiddleware(), controllers.CreateDeviceAlert(db))
		api.PUT("/device-alerts/:id", middleware.JWTAuthMiddleware(), controllers.UpdateDeviceAlert(db))
		api.DELETE("/device-alerts/:id", middleware.JWTAuthMiddleware(), controllers.DeleteDeviceAlert(db))

		// Zone Alerts
		api.GET("/zone-alerts", middleware.JWTAuthMiddleware(), controllers.ListZoneAlerts(db))
		api.POST("/zone-alerts", middleware.JWTAuthMiddleware(), controllers.CreateZoneAlert(db))
		api.PUT("/zone-alerts/:id", middleware.JWTAuthMiddleware(), controllers.UpdateZoneAlert(db))
		api.DELETE("/zone-alerts/:id", middleware.JWTAuthMiddleware(), controllers.DeleteZoneAlert(db))

		// Historial de eventos de alerta de zona
		api.GET("/zones/:zone_id/alert-events", middleware.JWTAuthMiddleware(), controllers.ListZoneAlertEvents(db))
	}
}
