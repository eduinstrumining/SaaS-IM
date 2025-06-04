package controllers

import (
    "fmt"
    "net/http"
    "sensor-api-go/models"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "strconv"
    "time"
)

// Rango de temperatura aceptable
const (
    minTemp = -40.0
    maxTemp = 150.0
    maxPoints = 500 // <--- Limitar puntos por zona
)

// ----- Estructuras para status -----
type ZoneStatus struct {
    ZoneID      int         `json:"zone_id"`
    LastTemp    *float64    `json:"last_temp"`  // puntero para permitir null si hay outlier
    LastTime    *time.Time  `json:"last_time"`
    State       string      `json:"state"`
    Readings    []TempPoint `json:"readings"`
}

type TempPoint struct {
    Timestamp   time.Time `json:"timestamp"`
    Temperature float64   `json:"temperature"`
}

type CameraDashboard struct {
    CameraID int          `json:"camera_id"`
    Zonas    []ZoneStatus `json:"zonas"`
}

// ====== NUEVA: parseo flexible de fechas ======
func parseDateFlexible(dateStr string, def time.Time) time.Time {
    t, err := time.Parse(time.RFC3339, dateStr)
    if err == nil {
        return t
    }
    t, err = time.Parse("2006-01-02", dateStr)
    if err == nil {
        return t
    }
    return def
}

// ----- Handler: GET /api/cameras/:camera_id/status -----
func CameraStatusDashboard(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        cameraID, err := strconv.Atoi(c.Param("camera_id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id inválido"})
            return
        }

        // Permite ISO8601 y YYYY-MM-DD
        desdeStr := c.DefaultQuery("desde", time.Now().Add(-24*time.Hour).Format(time.RFC3339))
        hastaStr := c.DefaultQuery("hasta", time.Now().Format(time.RFC3339))
        desde := parseDateFlexible(desdeStr, time.Now().Add(-24*time.Hour))
        hasta := parseDateFlexible(hastaStr, time.Now())
        hasta = hasta.Add(24 * time.Hour) // hasta fin del día

        var zonas []int
        db.Model(&models.CameraReading{}).
            Where("camera_id = ?", cameraID).
            Distinct("zone_id").
            Pluck("zone_id", &zonas)

        zonasStatus := []ZoneStatus{}
        for _, z := range zonas {
            var last models.CameraReading
            db.Where("camera_id = ? AND zone_id = ?", cameraID, z).
                Order("timestamp DESC").
                First(&last)

            // Solo consideramos last si está en rango válido
            var lastTemp *float64
            var lastTime *time.Time
            if last.Temperature >= minTemp && last.Temperature <= maxTemp {
                lastTemp = &last.Temperature
                lastTime = &last.Timestamp
            } else {
                lastTemp = nil
                lastTime = nil
            }

            var history []models.CameraReading
            db.Where("camera_id = ? AND zone_id = ? AND timestamp >= ? AND timestamp <= ?", cameraID, z, desde, hasta).
                Order("timestamp ASC").
                Find(&history)

            // Filtrar outliers en el histórico
            tempHistory := []TempPoint{}
            for _, h := range history {
                if h.Temperature >= minTemp && h.Temperature <= maxTemp {
                    tempHistory = append(tempHistory, TempPoint{
                        Timestamp:   h.Timestamp,
                        Temperature: h.Temperature,
                    })
                }
            }

            // ==== LIMITA la cantidad de puntos por zona (downsampling) ====
            if len(tempHistory) > maxPoints {
                tempHistory = tempHistory[len(tempHistory)-maxPoints:]
            }

            // LOG para debug rápido en backend
            fmt.Printf("Camera %d, Zone %d, desde: %v, hasta: %v, readings enviados: %d\n", cameraID, z, desde, hasta, len(tempHistory))

            // Estado: Activo si la última lectura válida fue en los últimos 10 minutos
            state := "Inactivo"
            if lastTime != nil && lastTime.After(time.Now().Add(-10*time.Minute)) {
                state = "Activo"
            }

            zonasStatus = append(zonasStatus, ZoneStatus{
                ZoneID:   z,
                LastTemp: lastTemp,
                LastTime: lastTime,
                State:    state,
                Readings: tempHistory,
            })
        }

        resp := CameraDashboard{
            CameraID: cameraID,
            Zonas:    zonasStatus,
        }
        c.JSON(http.StatusOK, resp)
    }
}

// ----- Handler: GET /api/camera-readings -----
func GetCameraReadings(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var readings []models.CameraReading
        query := db

        if cameraID := c.Query("camera_id"); cameraID != "" {
            query = query.Where("camera_id = ?", cameraID)
        }
        if zoneID := c.Query("zone_id"); zoneID != "" {
            query = query.Where("zone_id = ?", zoneID)
        }
        if desde := c.Query("desde"); desde != "" {
            if t, err := time.Parse(time.RFC3339, desde); err == nil {
                query = query.Where("timestamp >= ?", t)
            } else if t, err := time.Parse("2006-01-02", desde); err == nil {
                query = query.Where("timestamp >= ?", t)
            }
        }
        if hasta := c.Query("hasta"); hasta != "" {
            if t, err := time.Parse(time.RFC3339, hasta); err == nil {
                query = query.Where("timestamp <= ?", t)
            } else if t, err := time.Parse("2006-01-02", hasta); err == nil {
                query = query.Where("timestamp <= ?", t)
            }
        }
        if err := query.Order("timestamp desc").Limit(1000).Find(&readings).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        // Filtra outliers antes de devolver
        var filtered []models.CameraReading
        for _, r := range readings {
            if r.Temperature >= minTemp && r.Temperature <= maxTemp {
                filtered = append(filtered, r)
            }
        }
        c.JSON(http.StatusOK, filtered)
    }
}

// ----- Handler: GET /api/cameras -----
type CameraWithZones struct {
    CameraID int   `json:"camera_id"`
    Zones    []int `json:"zones"`
}

func ListUniqueCameras(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var readings []models.CameraReading
        if err := db.Select("camera_id, zone_id").Find(&readings).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        cameras := map[int]map[int]bool{}
        for _, r := range readings {
            if _, ok := cameras[r.CameraID]; !ok {
                cameras[r.CameraID] = map[int]bool{}
            }
            cameras[r.CameraID][r.ZoneID] = true
        }
        var result []CameraWithZones
        for cam, zonesMap := range cameras {
            zones := []int{}
            for z := range zonesMap {
                zones = append(zones, z)
            }
            result = append(result, CameraWithZones{
                CameraID: cam,
                Zones:    zones,
            })
        }
        c.JSON(http.StatusOK, result)
    }
}
