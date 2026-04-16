package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/myprox/relay/pkg/auth"
	"github.com/myprox/relay/pkg/config"
	"github.com/myprox/relay/pkg/hub"
	"github.com/myprox/relay/pkg/metrics"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	cfg := config.Load()
	h := hub.New()

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Agent connects here via WebSocket
	// GET /agent/connect?token=<agent_jwt>
	mux.HandleFunc("/agent/connect", func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateAgentToken(token, cfg.JWTSecret)
		if err != nil {
			log.Printf("Agent auth failed: %v", err)
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: %v", err)
			return
		}

		log.Printf("[agent] connected: serverID=%s userID=%s", claims.ServerID, claims.UserID)
		metrics.IncrAgents()
		h.Register(claims.ServerID, conn)
		metrics.DecrAgents() // hub.Register blocks until disconnect
	})

	// API backend proxies Proxmox requests through here
	// POST /proxy/{serverID}
	// Body: hub.ProxyRequest JSON
	// Header: Authorization: Bearer <API_RELAY_SECRET>
	mux.HandleFunc("/proxy/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Validate API secret
		authHeader := r.Header.Get("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" || token == authHeader || token != cfg.APISecret {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		serverID := strings.TrimPrefix(r.URL.Path, "/proxy/")
		if serverID == "" {
			http.Error(w, "missing serverID", http.StatusBadRequest)
			return
		}

		var req hub.ProxyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		resp, err := h.Proxy(serverID, req)
		if err != nil {
			metrics.IncrFailed()
			log.Printf("[proxy] error serverID=%s: %v", serverID, err)
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}

		metrics.IncrProxied()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.Status)
		w.Write(resp.Body)
	})

	// Relay connection status — no auth (used by API)
	// GET /status/{serverID}
	mux.HandleFunc("/status/", func(w http.ResponseWriter, r *http.Request) {
		serverID := strings.TrimPrefix(r.URL.Path, "/status/")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"connected": h.IsConnected(serverID)})
	})

	// Internal metrics endpoint — GET /metrics
	mux.HandleFunc("/metrics", metrics.Handler())

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("MyProx Relay listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
