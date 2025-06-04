package controllers

import (
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "sensor-api-go/models"
)

func TestGetCameraReadings_EmptyDB(t *testing.T) {
    // Usa una base en memoria para no afectar la real
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    if err != nil {
        t.Fatalf("No se pudo abrir base en memoria: %v", err)
    }
    // Migrar el modelo para crear la tabla temporal
    db.AutoMigrate(&models.CameraReading{})

    // Prepara el router y endpoint
    r := gin.Default()
    r.GET("/api/camera-readings", GetCameraReadings(db))

    // Ejecuta request HTTP de prueba
    req, _ := http.NewRequest("GET", "/api/camera-readings", nil)
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)

    // Espera 200 OK aunque la base esté vacía
    if w.Code != http.StatusOK {
        t.Errorf("Esperado status 200, pero fue %d", w.Code)
    }

    // Opcional: puedes chequear que devuelva un array vacío
    body := w.Body.String()
    esperado := "[]"
    if body != esperado && body != esperado+"\n" {
        t.Errorf("Esperado body vacío %v, pero fue: %v", esperado, body)
    }
}
