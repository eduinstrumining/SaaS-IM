package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
    "time"

    "golang.org/x/crypto/bcrypt"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "github.com/google/uuid"
)

type Company struct {
    ID   uuid.UUID `gorm:"type:uuid;primaryKey"`
    Name string    `gorm:"not null;unique"`
}

type User struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
    CompanyID uuid.UUID `gorm:"type:uuid;not null"`
    Email     string    `gorm:"uniqueIndex;not null"`
    Password  string    `gorm:"not null"`
    Role      string    `gorm:"not null"`
    CreatedAt time.Time
}

func main() {
    reader := bufio.NewReader(os.Stdin)

    fmt.Print("Nombre de la empresa: ")
    companyName, _ := reader.ReadString('\n')
    companyName = strings.TrimSpace(companyName)

    fmt.Print("Email del usuario: ")
    email, _ := reader.ReadString('\n')
    email = strings.TrimSpace(email)

    fmt.Print("Contraseña: ")
    password, _ := reader.ReadString('\n')
    password = strings.TrimSpace(password)

    fmt.Print("Rol (admin/user): ")
    role, _ := reader.ReadString('\n')
    role = strings.TrimSpace(role)
    if role == "" {
        role = "admin"
    }

    hashedPwd, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        panic(err)
    }

    dsn := fmt.Sprintf(
        "host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
        os.Getenv("DB_HOST"),
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_NAME"),
        os.Getenv("DB_PORT"),
    )
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("Failed to connect to database: " + err.Error())
    }

    // 1. Busca la empresa por nombre
    var company Company
    if err := db.Where("name = ?", companyName).First(&company).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            // No existe, la crea
            company = Company{
                ID:   uuid.New(),
                Name: companyName,
            }
            if err := db.Create(&company).Error; err != nil {
                panic("No se pudo crear la empresa: " + err.Error())
            }
            fmt.Printf("Empresa '%s' creada con ID: %s\n", companyName, company.ID.String())
        } else {
            panic("Error buscando empresa: " + err.Error())
        }
    } else {
        fmt.Printf("Empresa encontrada: %s (ID: %s)\n", company.Name, company.ID.String())
    }

    // 2. Crea el usuario
    user := User{
        ID:        uuid.New(),
        CompanyID: company.ID,
        Email:     email,
        Password:  string(hashedPwd),
        Role:      role,
        CreatedAt: time.Now(),
    }

    if err := db.Create(&user).Error; err != nil {
        panic("No se pudo crear el usuario: " + err.Error())
    }

    fmt.Printf("Usuario creado con éxito: %s (rol: %s, empresa: %s)\n", email, role, company.Name)
}
