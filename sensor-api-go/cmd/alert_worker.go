package main

import (
	"fmt"
	"log"
	"time"

	"sensor-api-go/config"
	"sensor-api-go/models"
	"sensor-api-go/utils"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Cargar variables de entorno desde .env
	godotenv.Load()

	// Configuración y conexión a la base de datos
	cfg := config.LoadConfig()
	db := config.SetupDB(cfg)

	log.Println("[ALERT WORKER] Iniciado. Supervisando zonas cada 10 segundos...")

	for {
		revisarZonas(db)
		time.Sleep(10 * time.Second)
	}
}

func revisarZonas(db *gorm.DB) {
	// Trae todas las alertas configuradas
	var alerts []models.ZoneAlert
	if err := db.Find(&alerts).Error; err != nil {
		log.Printf("[ALERT WORKER] Error obteniendo alertas: %v", err)
		return
	}

	for _, za := range alerts {
		// Buscar la última lectura de esa zona
		var reading models.CameraReading
		err := db.Where("zone_id = ?", za.ZoneID).
			Order("timestamp DESC").
			First(&reading).Error

		if err != nil {
			// Si no hay lecturas para esa zona, ignorar
			continue
		}

		// Verifica si está fuera de umbrales
		if reading.Temperature > za.UpperThresh || reading.Temperature < za.LowerThresh {
			// Enviar alerta solo si está fuera de umbrales
			subject := fmt.Sprintf("[ALERTA] Cámara %d Zona %d fuera de umbral", reading.CameraID, reading.ZoneID)
			body := fmt.Sprintf(`
                <b>¡Alerta de temperatura!</b><br/>
                <ul>
                  <li><b>Cámara:</b> %d</li>
                  <li><b>Zona:</b> %d</li>
                  <li><b>Temperatura:</b> %.2f°C</li>
                  <li><b>Umbral superior:</b> %.2f°C</li>
                  <li><b>Umbral inferior:</b> %.2f°C</li>
                  <li><b>Fecha/Hora:</b> %s</li>
                </ul>
                <b>Motivo:</b> %s
            `,
				reading.CameraID,
				reading.ZoneID,
				reading.Temperature,
				za.UpperThresh,
				za.LowerThresh,
				reading.Timestamp.Format(time.RFC3339),
				motivo(reading.Temperature, za.UpperThresh, za.LowerThresh),
			)

			// Intenta enviar el email y guarda el resultado del envío
			sendErr := utils.SendEmail(za.Recipient, subject, body)
			if sendErr != nil {
				log.Printf("[ALERT WORKER] Error enviando alerta: %v", sendErr)
			} else {
				log.Printf("[ALERT WORKER] Alerta enviada: Cámara %d Zona %d -> %s", reading.CameraID, reading.ZoneID, za.Recipient)
			}

			// REGISTRA el evento de alerta (siempre, aunque falle el envío)
			eventType := "upper"
			threshold := za.UpperThresh
			if reading.Temperature < za.LowerThresh {
				eventType = "lower"
				threshold = za.LowerThresh
			}

			event := models.ZoneAlertEvent{
				ID:          uuid.New(),
				ZoneID:      reading.ZoneID,
				CameraID:    reading.CameraID,
				Temperature: reading.Temperature,
				Threshold:   threshold,
				Type:        eventType,
				Timestamp:   reading.Timestamp,
				Recipient:   za.Recipient,
				Sent:        sendErr == nil,
				Error:       fmt.Sprintf("%v", sendErr),
			}
			if err := db.Create(&event).Error; err != nil {
				log.Printf("[ALERT WORKER] Error registrando evento de alerta: %v", err)
			}
		}
	}
}

func motivo(temp, upper, lower float64) string {
	if temp > upper {
		return "Temperatura sobre el umbral permitido"
	}
	if temp < lower {
		return "Temperatura bajo el umbral permitido"
	}
	return "Anomalía detectada"
}
