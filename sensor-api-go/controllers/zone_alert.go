package controllers

import (
	"net/http"
	"sensor-api-go/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceAlertInput struct {
	DeviceID    string  `json:"device_id" binding:"required"`
	UpperThresh float64 `json:"upper_thresh"`
	LowerThresh float64 `json:"lower_thresh"`
	Recipient   string  `json:"recipient" binding:"required,email"`
}

type ZoneAlertInput struct {
	ZoneID      string  `json:"zone_id" binding:"required"`
	UpperThresh float64 `json:"upper_thresh"`
	LowerThresh float64 `json:"lower_thresh"`
	Recipient   string  `json:"recipient" binding:"required,email"`
}

// --- Device Alerts ---

func CreateDeviceAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input DeviceAlertInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		deviceUUID, err := uuid.Parse(input.DeviceID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "device_id inválido"})
			return
		}
		alert := models.DeviceAlert{
			ID:          uuid.New(),
			DeviceID:    deviceUUID,
			UpperThresh: input.UpperThresh,
			LowerThresh: input.LowerThresh,
			Recipient:   input.Recipient,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		if err := db.Create(&alert).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alert)
	}
}

func ListDeviceAlerts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var alerts []models.DeviceAlert
		if err := db.Find(&alerts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alerts)
	}
}

func UpdateDeviceAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		alertID, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var alert models.DeviceAlert
		if err := db.First(&alert, "id = ?", alertID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alerta no encontrada"})
			return
		}

		var input DeviceAlertInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		deviceUUID, err := uuid.Parse(input.DeviceID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "device_id inválido"})
			return
		}

		alert.DeviceID = deviceUUID
		alert.UpperThresh = input.UpperThresh
		alert.LowerThresh = input.LowerThresh
		alert.Recipient = input.Recipient
		alert.UpdatedAt = time.Now()

		if err := db.Save(&alert).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alert)
	}
}

func DeleteDeviceAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		alertID, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if err := db.Delete(&models.DeviceAlert{}, "id = ?", alertID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Alerta eliminada correctamente"})
	}
}

// --- Zone Alerts ---

func CreateZoneAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input ZoneAlertInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// --- ADAPTACIÓN CLAVE: Soportar zone_id como UUID o numérico ---
		var zoneUUID uuid.UUID
		var err error
		// Intenta parsear como UUID
		zoneUUID, err = uuid.Parse(input.ZoneID)
		if err != nil {
			// Si falla, intenta parsear como int
			if zoneInt, err2 := strconv.Atoi(input.ZoneID); err2 == nil {
				// Genera un UUID determinista usando namespace (ejemplo)
				zoneUUID = uuid.NewSHA1(uuid.NameSpaceOID, []byte(strconv.Itoa(zoneInt)))
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "zone_id inválido"})
				return
			}
		}

		alert := models.ZoneAlert{
			ID:          uuid.New(),
			ZoneID:      zoneUUID,
			UpperThresh: input.UpperThresh,
			LowerThresh: input.LowerThresh,
			Recipient:   input.Recipient,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		if err := db.Create(&alert).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alert)
	}
}

func ListZoneAlerts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var alerts []models.ZoneAlert
		if err := db.Find(&alerts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alerts)
	}
}

func UpdateZoneAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		alertID, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var alert models.ZoneAlert
		if err := db.First(&alert, "id = ?", alertID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Alerta no encontrada"})
			return
		}

		var input ZoneAlertInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var zoneUUID uuid.UUID
		// Intenta parsear como UUID
		zoneUUID, err = uuid.Parse(input.ZoneID)
		if err != nil {
			// Si falla, intenta parsear como int
			if zoneInt, err2 := strconv.Atoi(input.ZoneID); err2 == nil {
				zoneUUID = uuid.NewSHA1(uuid.NameSpaceOID, []byte(strconv.Itoa(zoneInt)))
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "zone_id inválido"})
				return
			}
		}

		alert.ZoneID = zoneUUID
		alert.UpperThresh = input.UpperThresh
		alert.LowerThresh = input.LowerThresh
		alert.Recipient = input.Recipient
		alert.UpdatedAt = time.Now()

		if err := db.Save(&alert).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, alert)
	}
}

func DeleteZoneAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		alertID, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if err := db.Delete(&models.ZoneAlert{}, "id = ?", alertID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Alerta eliminada correctamente"})
	}
}
