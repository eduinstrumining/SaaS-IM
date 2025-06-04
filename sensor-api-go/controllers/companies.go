package controllers

import (
    "net/http"
    "sensor-api-go/models"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func ListCompanies(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        var companies []models.Company
        if err := db.Find(&companies).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron obtener las empresas"})
            return
        }
        c.JSON(http.StatusOK, companies)
    }
}
