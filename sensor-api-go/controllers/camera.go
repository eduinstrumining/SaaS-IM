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

// --- Constantes de control ---
const (
    minTemp         = -40.0
    maxTemp         = 150.0
    maxPoints       = 1000
    paginationLimit = 1000
    maxRangeDirect  = 7 * 24 * time.Hour
)

// --- Estructuras ---
type ZoneStatus struct {
    ZoneID      int         `json:"zone_id"`
    LastTemp    *float64    `json:"last_temp"`
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

type CameraWithZones struct {
    CameraID int   `json:"camera_id"`
    Zones    []int `json:"zones"`
}

// --- Downsampling robusto para series largas ---
func downsample(points []TempPoint, max int) []TempPoint {
    n := len(points)
    if n <= max || max <= 0 {
        return points
    }
    step := float64(n) / float64(max)
    result := make([]TempPoint, max)
    for i := 0; i < max; i++ {
        idx := int(float64(i) * step)
        if idx >= n {
            idx = n - 1
        }
        result[i] = points[idx]
    }
    return result
}

// --- Parseo flexible de fechas ---
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

// --- Handler: GET /api/cameras/:camera_id/status ---
func CameraStatusDashboard(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, _ := c.Get("user_id")
        companyID, _ := c.Get("company_id")
        fmt.Printf("user_id: %v, company_id: %v\n", userID, companyID)

        cameraID, err := strconv.Atoi(c.Param("camera_id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "camera_id inválido"})
            return
        }

        desdeStr := c.DefaultQuery("desde", time.Now().Add(-24*time.Hour).Format(time.RFC3339))
        hastaStr := c.DefaultQuery("hasta", time.Now().Format(time.RFC3339))
        desde := parseDateFlexible(desdeStr, time.Now().Add(-24*time.Hour))
        hasta := parseDateFlexible(hastaStr, time.Now())
        if len(hastaStr) == len("2006-01-02") {
            hasta = hasta.Add(24 * time.Hour)
        }
        if hasta.Before(desde) {
            c.JSON(http.StatusBadRequest, gin.H{"error": "El rango de fechas es inválido"})
            return
        }

        fmt.Printf("[DEBUG] Consulta fechas - desde: %s, hasta: %s\n", desde.UTC().Format(time.RFC3339), hasta.UTC().Format(time.RFC3339))

        rangoDuracion := hasta.Sub(desde)
        useAggregation := rangoDuracion > maxRangeDirect

        // Leer zonas activas para la cámara *EN EL RANGO PEDIDO*
        var zonas []int
        err = db.Raw(`
            SELECT DISTINCT zone_id 
            FROM camera_readings 
            WHERE camera_id = ? 
              AND timestamp >= ? 
              AND timestamp <= ?
            ORDER BY zone_id
        `, cameraID, desde, hasta).Scan(&zonas).Error
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        zonasStatus := []ZoneStatus{}
        for _, z := range zonas {
            // Última lectura para mostrar estado y última temp
            var last models.CameraReading
            db.Where("camera_id = ? AND zone_id = ?", cameraID, z).
                Order("timestamp DESC").
                First(&last)
            var lastTemp *float64
            var lastTime *time.Time
            if last.Temperature >= minTemp && last.Temperature <= maxTemp {
                lastTemp = &last.Temperature
                lastTime = &last.Timestamp
            }

            var tempHistory []TempPoint

            // Consulta AGREGADA (más de 7 días, vista materializada)
            if useAggregation {
                type Row struct {
                    Bucket  time.Time
                    AvgTemp float64
                }
                var rows []Row
                err := db.Raw(`
                    SELECT bucket, avg_temp
                    FROM camera_readings_hourly_summary
                    WHERE camera_id = ? AND zone_id = ? AND bucket BETWEEN ? AND ?
                    ORDER BY bucket ASC
                `, cameraID, z, desde, hasta).Scan(&rows).Error
                if err != nil {
                    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
                    return
                }
                for _, r := range rows {
                    tempHistory = append(tempHistory, TempPoint{
                        Timestamp:   r.Bucket,
                        Temperature: r.AvgTemp,
                    })
                }
            } else {
                // Consulta DIRECTA (menos de 7 días)
                if rangoDuracion > maxRangeDirect {
                    c.JSON(http.StatusBadRequest, gin.H{"error": "Rango máximo para consulta sin agregación es 7 días"})
                    return
                }
                var offset int = 0
                for {
                    var batch []models.CameraReading
                    err := db.Where("camera_id = ? AND zone_id = ? AND timestamp >= ? AND timestamp <= ?", cameraID, z, desde, hasta).
                        Where("temperature BETWEEN ? AND ?", minTemp, maxTemp).
                        Order("timestamp ASC").
                        Limit(paginationLimit).
                        Offset(offset).
                        Find(&batch).Error
                    if err != nil {
                        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
                        return
                    }
                    if len(batch) == 0 {
                        break
                    }
                    for _, h := range batch {
                        tempHistory = append(tempHistory, TempPoint{
                            Timestamp:   h.Timestamp,
                            Temperature: h.Temperature,
                        })
                    }
                    offset += paginationLimit
                }
                tempHistory = downsample(tempHistory, maxPoints)
            }

            state := "Inactivo"
            if lastTime != nil && lastTime.After(time.Now().Add(-10*time.Minute)) {
                state = "Activo"
            }
            // SIEMPRE DEVUELVE [] NO null
            if tempHistory == nil {
                tempHistory = []TempPoint{}
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

// --- Handler: GET /api/camera-readings ---
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
        if err := query.Order("timestamp desc").Limit(paginationLimit).Find(&readings).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        var filtered []models.CameraReading
        for _, r := range readings {
            if r.Temperature >= minTemp && r.Temperature <= maxTemp {
                filtered = append(filtered, r)
            }
        }
        c.JSON(http.StatusOK, filtered)
    }
}

// --- Handler: GET /api/cameras ---
func ListUniqueCameras(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var cameras []int
        if err := db.Model(&models.CameraReading{}).Distinct("camera_id").Pluck("camera_id", &cameras).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        var result []CameraWithZones
        for _, camID := range cameras {
            var zones []int
            if err := db.Model(&models.CameraReading{}).
                Where("camera_id = ?", camID).
                Distinct("zone_id").
                Pluck("zone_id", &zones).Error; err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
                return
            }
            result = append(result, CameraWithZones{
                CameraID: camID,
                Zones:    zones,
            })
        }
        c.JSON(http.StatusOK, result)
    }
}
