package models

import (
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Device struct {
    ID    uuid.UUID `gorm:"type:uuid;primaryKey"`
    Name  string
    Zones []Zone `gorm:"foreignKey:DeviceID" json:"zones"`
    gorm.Model
}
