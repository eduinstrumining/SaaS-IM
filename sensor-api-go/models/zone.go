package models

import (
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Zone struct {
    ID       uuid.UUID `gorm:"type:uuid;primaryKey"`
    DeviceID uuid.UUID `gorm:"type:uuid;not null" json:"device_id"`
    Name     string
    gorm.Model
}
