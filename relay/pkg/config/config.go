package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port      string
	JWTSecret string
	APISecret string // shared secret with Node.js API
}

func Load() *Config {
	cfg := &Config{
		Port:      getEnv("PORT", "8080"),
		JWTSecret: os.Getenv("JWT_SECRET"),
		APISecret: os.Getenv("API_RELAY_SECRET"),
	}
	if cfg.JWTSecret == "" {
		panic("JWT_SECRET is required")
	}
	if cfg.APISecret == "" {
		panic("API_RELAY_SECRET is required")
	}
	fmt.Printf("Relay config loaded (port=%s)\n", cfg.Port)
	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
