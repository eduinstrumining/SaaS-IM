package controllers

import (
    "net/http"
    "fmt"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "sensor-api-go/models"
)

func GetDevicesWithZones(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Estructura para devolver
        type DeviceWithZones struct {
            CameraID int    `json:"camera_id"` // es int en tu modelo
            Zones    []int  `json:"zones"`     // igual es int, no int64
        }

        var devices []DeviceWithZones

        // Obtener dispositivos únicos (cameras)
        var cameraIDs []int
        if err := db.Model(&models.CameraReading{}).Distinct("camera_id").Pluck("camera_id", &cameraIDs).Error; err != nil {
            fmt.Printf("Error al obtener camera_ids: %v\n", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        // Para cada cámara obtener zonas únicas
        for _, camID := range cameraIDs {
            var zones []int
            if err := db.Model(&models.CameraReading{}).
                Where("camera_id = ?", camID).
                Distinct("zone_id").
                Pluck("zone_id", &zones).Error; err != nil {
                fmt.Printf("Error al obtener zones para camera_id %d: %v\n", camID, err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
                return
            }

            devices = append(devices, DeviceWithZones{
                CameraID: camID,
                Zones:    zones,
            })
        }

        c.JSON(http.StatusOK, devices)
    }
}
