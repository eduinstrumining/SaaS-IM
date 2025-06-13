// cmd/alert_worker.go

package main

import (
	"fmt"
	"sensor-api-go/config"
	"sensor-api-go/models"
	"sensor-api-go/utils"
	"time"

	"gorm.io/gorm"
)

func main() {
	db := config.NewDB()
	fmt.Println("🚨 [ALERT WORKER] Iniciando worker de alertas de zonas...")

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		checkAlerts(db)
		<-ticker.C
	}
}

func checkAlerts(db *gorm.DB) {
	var alerts []models.ZoneAlert
	if err := db.Find(&alerts).Error; err != nil {
		fmt.Println("[ALERT WORKER] Error al obtener ZoneAlerts:", err)
		return
	}
	for _, za := range alerts {
		// Busca la última lectura de la zona
		var reading models.CameraReading
		err := db.Where("zone_id = ?", za.ZoneID).
			Order("timestamp DESC").
			First(&reading).Error
		if err != nil {
			// Puede que no haya lecturas aún
			continue
		}
		// Si no hay temperaturas válidas, sigue
		if reading.ID == 0 {
			continue
		}

		// ¿Temperatura fuera de umbrales?
		if reading.Temperature > za.UpperThresh || reading.Temperature < za.LowerThresh {
			subject := "⚠️ Alerta de Temperatura (SENSOR TERMOGRÁFICO)"
			body := fmt.Sprintf(`
                <h2>Se detectó una anomalía de temperatura</h2>
                <p>
                    <b>Cámara:</b> %v<br>
                    <b>Zona:</b> %v<br>
                    <b>Temperatura actual:</b> %.2f°C<br>
                    <b>Umbral Inferior:</b> %.2f°C<br>
                    <b>Umbral Superior:</b> %.2f°C<br>
                    <b>Fecha/Hora:</b> %v<br>
                </p>
            `, reading.CameraID, reading.ZoneID, reading.Temperature, za.LowerThresh, za.UpperThresh, reading.Timestamp.Format("2006-01-02 15:04:05"))

			// Envía el correo
			err = utils.SendEmail(za.Recipient, subject, body)
			if err != nil {
				fmt.Printf("[ALERT WORKER] Error al enviar alerta por email a %s: %v\n", za.Recipient, err)
			} else {
				fmt.Printf("[ALERT WORKER] Alerta enviada a %s (zona %v)\n", za.Recipient, reading.ZoneID)
			}
			// OPCIONAL: Aquí puedes guardar log de alerta enviada, si lo deseas
		}
	}
}
