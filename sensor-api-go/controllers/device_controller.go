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
        // --- Logging de usuario/empresa para debug multiempresa ---
        userID, _ := c.Get("user_id")
        companyID, _ := c.Get("company_id")
        fmt.Printf("user_id: %v, company_id: %v\n", userID, companyID)

        // Estructura para devolver
        type DeviceWithZones struct {
            CameraID int   `json:"camera_id"`
            Zones    []int `json:"zones"`
        }

        var devices []DeviceWithZones

        // --- Filtrado multiempresa: descomenta si tu modelo tiene company_id ---
        // baseQuery := db.Where("company_id = ?", companyID)
        baseQuery := db // Deja así si no usas company_id en CameraReading

        // Obtener dispositivos únicos (cameras)
        var cameraIDs []int
        if err := baseQuery.Model(&models.CameraReading{}).Distinct("camera_id").Pluck("camera_id", &cameraIDs).Error; err != nil {
            fmt.Printf("Error al obtener camera_ids: %v\n", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        // Para cada cámara obtener zonas únicas
        for _, camID := range cameraIDs {
            var zones []int
            if err := baseQuery.Model(&models.CameraReading{}).
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
