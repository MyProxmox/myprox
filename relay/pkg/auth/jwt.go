package auth

import (
	"errors"

	"github.com/golang-jwt/jwt/v5"
)

type AgentClaims struct {
	ServerID string `json:"serverID"`
	UserID   string `json:"userID"`
	Type     string `json:"type"`
	jwt.RegisteredClaims
}

func ValidateAgentToken(tokenStr, secret string) (*AgentClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &AgentClaims{},
		func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		},
		jwt.WithoutClaimsValidation(), // agent tokens have no expiry
	)
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*AgentClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Type != "agent" {
		return nil, errors.New("not an agent token")
	}
	return claims, nil
}
