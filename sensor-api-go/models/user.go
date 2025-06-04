package models

import (
    "github.com/google/uuid"
    "time"
)

type User struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
    CompanyID uuid.UUID `gorm:"type:uuid;not null"`
    Name      string    `gorm:"not null"`                        // Nuevo campo
    Email     string    `gorm:"uniqueIndex;not null"`
    Password  string    `gorm:"not null"`
    Role      string    `gorm:"not null"`
    Status    string    `gorm:"not null;default:Active"`         // Nuevo campo ("Active" o "Inactive")
    CreatedAt time.Time
}
