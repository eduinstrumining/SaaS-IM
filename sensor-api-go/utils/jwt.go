package utils

import (
    "time"
    "github.com/golang-jwt/jwt"
)

var jwtKey = []byte("mi_super_secreto") // Cámbialo por uno seguro

type Claims struct {
    UserID    string
    Email     string
    CompanyID string
    Role      string
    jwt.StandardClaims
}

func GenerateJWT(userID, email, companyID, role string) (string, error) {
    // Duración de una semana
    expirationTime := time.Now().Add(7 * 24 * time.Hour)
    claims := &Claims{
        UserID:    userID,
        Email:     email,
        CompanyID: companyID,
        Role:      role,
        StandardClaims: jwt.StandardClaims{
            ExpiresAt: expirationTime.Unix(),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtKey)
}

func ValidateJWT(tokenString string) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        return jwtKey, nil
    })
    if err != nil || !token.Valid {
        return nil, err
    }
    return claims, nil
}
