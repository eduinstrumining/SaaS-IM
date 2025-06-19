package controllers

import (
	"net/http"
	"sensor-api-go/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// --- HANDLER: Traer lecturas de cámaras (clásico) ---
func GetCameraReadings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var readings []models.CameraReading
		if err := db.Find(&readings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las lecturas"})
			return
		}
		c.JSON(http.StatusOK, readings)
	}
}

// --- HANDLER: Listar cámaras únicas ---
func ListUniqueCameras(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cameraIDs []int
		if err := db.Raw("SELECT DISTINCT camera_id FROM camera_readings").Scan(&cameraIDs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las cámaras"})
			return
		}
		c.JSON(http.StatusOK, cameraIDs)
	}
}

// --- HANDLER: Listar zonas por cámara ---
func ListZonasByCamera(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		cameraID, err := strconv.Atoi(c.Param("camera_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id inválido"})
			return
		}
		var zonas []int
		if err := db.Raw("SELECT DISTINCT zone_id FROM camera_readings WHERE camera_id = ?", cameraID).Scan(&zonas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las zonas"})
			return
		}
		c.JSON(http.StatusOK, zonas)
	}
}

// --- NUEVO: Dashboard resumen rápido ---
type ZoneStatus struct {
	ZoneID   int                    `json:"zone_id"`
	LastTemp *float64               `json:"last_temp,omitempty"`
	LastTime *time.Time             `json:"last_time,omitempty"`
	State    string                 `json:"state"`
	Readings []models.CameraReading `json:"readings,omitempty"` // solo para históricos
}

type CameraDashboard struct {
	CameraID int          `json:"camera_id"`
	Zonas    []ZoneStatus `json:"zonas"`
}

const minTemp = 5.0
const maxTemp = 45.0

func CameraSummaryDashboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		cameraID, err := strconv.Atoi(c.Param("camera_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id inválido"})
			return
		}
		var zonas []int
		err = db.Raw(`
            SELECT DISTINCT zone_id 
            FROM camera_readings 
            WHERE camera_id = ?
            ORDER BY zone_id
        `, cameraID).Scan(&zonas).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		zonasStatus := make([]ZoneStatus, 0, len(zonas))
		for _, z := range zonas {
			var last models.CameraReading
			db.Where("camera_id = ? AND zone_id = ?", cameraID, z).
				Order("timestamp DESC").
				Limit(1).
				First(&last)
			var lastTemp *float64
			var lastTime *time.Time
			if last.Temperature >= minTemp && last.Temperature <= maxTemp {
				lastTemp = &last.Temperature
				lastTime = &last.Timestamp
			}
			state := "Inactivo"
			if lastTime != nil && lastTime.After(time.Now().Add(-10*time.Minute)) {
				state = "Activo"
			}
			zonasStatus = append(zonasStatus, ZoneStatus{
				ZoneID:   z,
				LastTemp: lastTemp,
				LastTime: lastTime,
				State:    state,
				Readings: nil,
			})
		}
		resp := CameraDashboard{
			CameraID: cameraID,
			Zonas:    zonasStatus,
		}
		c.JSON(http.StatusOK, resp)
	}
}

// --- Dashboard histórico con rango de fechas ---
func CameraStatusDashboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		cameraID, err := strconv.Atoi(c.Param("camera_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id inválido"})
			return
		}
		desdeStr := c.Query("desde")
		hastaStr := c.Query("hasta")
		var desde, hasta time.Time
		if desdeStr != "" {
			desde, _ = time.Parse(time.RFC3339, desdeStr)
		} else {
			desde = time.Now().Add(-24 * time.Hour)
		}
		if hastaStr != "" {
			hasta, _ = time.Parse(time.RFC3339, hastaStr)
		} else {
			hasta = time.Now()
		}
		var zonas []int
		err = db.Raw(`
            SELECT DISTINCT zone_id 
            FROM camera_readings 
            WHERE camera_id = ?
            ORDER BY zone_id
        `, cameraID).Scan(&zonas).Error
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		zonasStatus := make([]ZoneStatus, 0, len(zonas))
		for _, z := range zonas {
			var readings []models.CameraReading
			db.Where("camera_id = ? AND zone_id = ? AND timestamp >= ? AND timestamp <= ?", cameraID, z, desde, hasta).
				Order("timestamp").
				Find(&readings)
			var lastTemp *float64
			var lastTime *time.Time
			if len(readings) > 0 {
				lr := readings[len(readings)-1]
				if lr.Temperature >= minTemp && lr.Temperature <= maxTemp {
					lastTemp = &lr.Temperature
					lastTime = &lr.Timestamp
				}
			}
			state := "Inactivo"
			if lastTime != nil && lastTime.After(time.Now().Add(-10*time.Minute)) {
				state = "Activo"
			}
			zonasStatus = append(zonasStatus, ZoneStatus{
				ZoneID:   z,
				LastTemp: lastTemp,
				LastTime: lastTime,
				State:    state,
				Readings: readings,
			})
		}
		resp := CameraDashboard{
			CameraID: cameraID,
			Zonas:    zonasStatus,
		}
		c.JSON(http.StatusOK, resp)
	}
}
