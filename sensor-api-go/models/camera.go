package models

import (
    "time"
)

type CameraReading struct {
    ID          uint      `gorm:"primaryKey"`
    CameraID    int       `gorm:"not null"`
    ZoneID      int       `gorm:"not null"`
    Temperature float64   `gorm:"not null"`
    Timestamp   time.Time `gorm:"not null"`
}
