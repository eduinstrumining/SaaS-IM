package controllers

import (
    "net/http"
    "sensor-api-go/models"
    "sensor-api-go/utils"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "golang.org/x/crypto/bcrypt"
)

type LoginInput struct {
    Email     string `json:"email" binding:"required"`
    Password  string `json:"password" binding:"required"`
    CompanyID string `json:"company_id" binding:"required"`
}

func Login(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var input LoginInput
        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        var user models.User
        // Ahora busca por email **y** company_id
        if err := db.Where("email = ? AND company_id = ?", input.Email, input.CompanyID).First(&user).Error; err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Email, empresa o contraseña incorrectos"})
            return
        }
        if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Email, empresa o contraseña incorrectos"})
            return
        }
        token, err := utils.GenerateJWT(user.ID.String(), user.Email, user.CompanyID.String(), user.Role)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
            return
        }
        c.JSON(http.StatusOK, gin.H{"token": token})
    }
}
