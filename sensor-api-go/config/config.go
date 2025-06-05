package config

import (
    "fmt"
    "os"
    "log"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

type Config struct {
    DBHost     string
    DBPort     string
    DBUser     string
    DBPassword string
    DBName     string
}

func LoadConfig() *Config {
    dbPort := os.Getenv("DB_PORT")
    if dbPort == "" {
        dbPort = "5432"
    }

    cfg := &Config{
        DBHost:     os.Getenv("DB_HOST"),
        DBPort:     dbPort,
        DBUser:     os.Getenv("DB_USER"),
        DBPassword: os.Getenv("DB_PASSWORD"),
        DBName:     os.Getenv("DB_NAME"),
    }

    // Debug/log en desarrollo para detectar problemas de configuración
    if os.Getenv("APP_DEBUG") == "1" {
        log.Printf("[DEBUG] Config: %+v", cfg)
    }

    // Validación mínima: Detener si alguna variable crítica falta
    if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBPassword == "" || cfg.DBName == "" {
        log.Fatalf("ERROR: Faltan variables de entorno para la conexión a la base de datos. Revisar DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT.")
    }

    return cfg
}

func SetupDB(cfg *Config) *gorm.DB {
    dsn := fmt.Sprintf(
        "host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
        cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort,
    )
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic(fmt.Sprintf("Failed to connect to database: %v\nDSN: %s", err, dsn))
    }
    return db
}
