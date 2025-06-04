package main

import (
    "database/sql"
    "fmt"
    "log"
    "time"

    _ "github.com/lib/pq"
)

func main() {
    // Cambia según tu configuración
    dsn := "host=tu_host user=tu_usuario password=tu_password dbname=tu_db port=5432 sslmode=disable"

    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatal("Error al conectar a la BD: ", err)
    }
    defer db.Close()

    // Verificar conexión
    if err := db.Ping(); err != nil {
        log.Fatal("No se pudo conectar a la BD: ", err)
    }

    // Datos a insertar: cámara 1, sin zona (NULL), temperatura 50, timestamp ahora
    query := `
        INSERT INTO camera_readings (camera_id, zone_id, temperature, timestamp)
        VALUES ($1, $2, $3, $4)
    `
    _, err = db.Exec(query, 1, nil, 50.0, time.Now())
    if err != nil {
        log.Fatal("Error insertando lectura: ", err)
    }

    fmt.Println("Lectura insertada correctamente, debería gatillar alerta.")
}
