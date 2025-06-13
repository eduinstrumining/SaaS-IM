package controllers

import (
	"fmt"
	"net/http"
	"sensor-api-go/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- Device Alerts (igual que antes, omito para foco en zona) ---

type DeviceAlertInput struct {
	DeviceID    string  `json:"device_id" binding:"required"`
	UpperThresh float64 `json:"upper_thresh"`
	LowerThresh float64 `json:"lower_thresh"`
	Recipient   string  `json:"recipient" binding:"required,email"`
}

type ZoneAlertInput struct {
	ZoneID      string  `json:"zone_id" binding:"required"` // Puede venir como string (UUID) o número (int)
	UpperThresh float64 `json:"upper_thresh"`
	LowerThresh float64 `json:"lower_thresh"`
	Recipient   string  `json:"recipient" binding:"required,email"`
}

// --- Device Alerts (igual que antes, sin cambios) ---
// ... (lo mismo que tu código anterior)

// --- Zone Alerts ---

func CreateZoneAlert(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input ZoneAlertInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// PATCH: Aceptar zone_id como string UUID o número entero (int)
		var zoneUUID uuid.UUID
		var err error
		// 1. Intenta como UUID (string clásico)
		zoneUUID, err = uuid.Parse(input.ZoneID)
		if err != nil {
			// 2. Si falla, intenta parsear como int (ej: "1"), y genera un UUID determinista
			if numID, errInt := strconv.Atoi(input.ZoneID); errInt == nil {
				// Para mantener unicidad, creamos un "UUID basado en el int": puedes cambiar el namespace si tienes uno definido
				zoneUUID = uuid.NewMD5(uuid.NameSpaceOID, []byte(fmt.Sprintf("zone-%d", numID)))
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "zone_id inválido (debe ser UUID o número)"})
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

		// PATCH: mismo manejo flexible que en CreateZoneAlert
		var zoneUUID uuid.UUID
		// 1. Intenta como UUID
		zoneUUID, err = uuid.Parse(input.ZoneID)
		if err != nil {
			// 2. Intenta como int
			if numID, errInt := strconv.Atoi(input.ZoneID); errInt == nil {
				zoneUUID = uuid.NewMD5(uuid.NameSpaceOID, []byte(fmt.Sprintf("zone-%d", numID)))
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "zone_id inválido (debe ser UUID o número)"})
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
