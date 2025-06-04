package models

import (
    "github.com/google/uuid"
    "time"
)

type ZoneAlert struct {
    ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
    ZoneID       uuid.UUID `gorm:"type:uuid;not null"`
    UpperThresh  float64
    LowerThresh  float64
    Recipient    string    `gorm:"not null"` // correo al que se enviará alerta
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
