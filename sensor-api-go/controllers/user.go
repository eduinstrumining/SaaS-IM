package controllers

import (
    "net/http"
    "sensor-api-go/models"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "golang.org/x/crypto/bcrypt"
    "github.com/google/uuid"
)

type CreateUserInput struct {
    Name      string `json:"name" binding:"required"`
    Email     string `json:"email" binding:"required"`
    Password  string `json:"password" binding:"required"`
    Role      string `json:"role" binding:"required"`
    Status    string `json:"status" binding:"required"` // "Active" o "Inactive"
    CompanyID string `json:"company_id" binding:"required"`
}

func CreateUser(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var input CreateUserInput
        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        // Hashear contraseña
        hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear el usuario"})
            return
        }
        // Parsear UUID de company_id
        companyUUID, err := uuid.Parse(input.CompanyID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "CompanyID inválido"})
            return
        }
        user := models.User{
            ID:        uuid.New(),
            Name:      input.Name,
            Email:     input.Email,
            Password:  string(hashed),
            Role:      input.Role,
            Status:    input.Status,
            CompanyID: companyUUID,
        }
        if err := db.Create(&user).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        user.Password = "" // Nunca exponer el hash al frontend
        c.JSON(http.StatusOK, user)
    }
}

// ListUsers retorna todos los usuarios (sin exponer el password)
func ListUsers(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var users []models.User
        if err := db.Find(&users).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        // Limpia el password antes de devolver
        usersClean := make([]models.User, len(users))
        for i, u := range users {
            u.Password = ""
            usersClean[i] = u
        }
        c.JSON(http.StatusOK, usersClean)
    }
}

// UpdateUserInput para edición parcial
type UpdateUserInput struct {
    Name   *string `json:"name"`
    Email  *string `json:"email"`
    Role   *string `json:"role"`
    Status *string `json:"status"`
}

// Actualiza un usuario existente
func UpdateUser(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.Param("id")
        uid, err := uuid.Parse(userID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
            return
        }

        var user models.User
        if err := db.First(&user, "id = ?", uid).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
            return
        }

        var input UpdateUserInput
        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        if input.Name != nil {
            user.Name = *input.Name
        }
        if input.Email != nil {
            user.Email = *input.Email
        }
        if input.Role != nil {
            user.Role = *input.Role
        }
        if input.Status != nil {
            user.Status = *input.Status
        }

        if err := db.Save(&user).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar el usuario"})
            return
        }

        user.Password = "" // no exponer hash
        c.JSON(http.StatusOK, user)
    }
}

// Elimina un usuario dado su ID
func DeleteUser(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.Param("id")
        uid, err := uuid.Parse(userID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
            return
        }

        if err := db.Delete(&models.User{}, "id = ?", uid).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el usuario"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "Usuario eliminado correctamente"})
    }
}
