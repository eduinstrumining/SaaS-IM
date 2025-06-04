package utils

import (
    "gopkg.in/gomail.v2"
    "os"
    "fmt"
    "strconv" // <--- Agregado aquí
)

// SendEmail envía un correo con subject y body al destinatario "to"
func SendEmail(to, subject, body string) error {
    m := gomail.NewMessage()

    from := os.Getenv("EMAIL_FROM")
    if from == "" {
        return fmt.Errorf("EMAIL_FROM no está configurado en variables de entorno")
    }

    m.SetHeader("From", from)
    m.SetHeader("To", to)
    m.SetHeader("Subject", subject)
    m.SetBody("text/html", body) // Puedes usar text/plain si prefieres

    host := os.Getenv("SMTP_HOST")
    port := os.Getenv("SMTP_PORT")
    user := os.Getenv("SMTP_USER")
    pass := os.Getenv("SMTP_PASS")

    if host == "" || port == "" || user == "" || pass == "" {
        return fmt.Errorf("Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en variables de entorno")
    }

    portNum, err := strconv.Atoi(port)
    if err != nil {
        return fmt.Errorf("Puerto SMTP inválido: %v", err)
    }

    d := gomail.NewDialer(host, portNum, user, pass)
    return d.DialAndSend(m)
}
