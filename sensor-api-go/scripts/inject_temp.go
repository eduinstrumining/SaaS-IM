package main

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// CameraReading es el modelo mínimo compatible con tu tabla
type CameraReading struct {
	ID          uint `gorm:"primaryKey"`
	CameraID    int
	ZoneID      int
	Temperature float64
	Timestamp   time.Time
}

func main() {
	// 1. Cargar variables desde .env automáticamente
	_ = godotenv.Load()

	// 2. Leer config desde entorno
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
		dbHost, dbUser, dbPass, dbName, dbPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("No se pudo conectar a la base de datos: %v", err))
	}

	// 3. Definir valores a inyectar (ajusta según tus cámaras y zonas reales)
	cameraID := 2 // <- Cambia esto según la cámara real
	zoneID := 1   // <- Cambia esto según la zona real
	// Para simular alerta, pon temperatura arriba o abajo de los umbrales definidos en la plataforma
	temperature := 150.0 // <-- Arriba de lo normal para disparar alerta
	timestamp := time.Now().UTC()

	// 4. Insertar el registro
	reading := CameraReading{
		CameraID:    cameraID,
		ZoneID:      zoneID,
		Temperature: temperature,
		Timestamp:   timestamp,
	}

	result := db.Create(&reading)
	if result.Error != nil {
		fmt.Println("Error insertando lectura de temperatura:", result.Error)
		os.Exit(1)
	}
	fmt.Printf("Lectura inyectada: Cámara %d, Zona %d, Temp %.2f°C, Hora %s\n",
		cameraID, zoneID, temperature, timestamp.Format(time.RFC3339),
	)
}
