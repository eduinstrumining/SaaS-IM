package models

import (
    "github.com/google/uuid"
)

type Company struct {
    ID   uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
    Name string    `gorm:"type:varchar(255);not null" json:"name"`
}
