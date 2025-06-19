// controllers/zone_alert_event.go

package controllers

import (
	"net/http"
	"sensor-api-go/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GET /api/zones/:zone_id/alert-events
func ListZoneAlertEvents(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		zoneIDStr := c.Param("zone_id")
		zoneID, err := uuid.Parse(zoneIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "zone_id inválido"})
			return
		}
		var events []models.ZoneAlertEvent
		if err := db.Where("zone_id = ?", zoneID).Order("timestamp DESC").Find(&events).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener los eventos"})
			return
		}
		c.JSON(http.StatusOK, events)
	}
}
