// models/zone_alert_event.go

package models

import (
	"time"

	"github.com/google/uuid"
)

type ZoneAlertEvent struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ZoneID      uuid.UUID `gorm:"type:uuid;index" json:"zone_id"`
	CameraID    int       `json:"camera_id"`
	Temperature float64   `json:"temperature"`
	Threshold   float64   `json:"threshold"`
	Type        string    `json:"type"` // "upper", "lower"
	Timestamp   time.Time `json:"timestamp"`
	Recipient   string    `json:"recipient"`
	Sent        bool      `json:"sent"`
	Error       string    `json:"error"`
}
