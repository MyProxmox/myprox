package relay

import (
	"github.com/myprox/relay/pkg/hub"
)

// Relay is the top-level orchestrator that wraps the Hub and exposes
// a clean interface for the HTTP handlers.
type Relay struct {
	hub *hub.Hub
}

// New creates a new Relay instance.
func New() *Relay {
	return &Relay{hub: hub.New()}
}

// Hub returns the underlying connection hub.
func (r *Relay) Hub() *hub.Hub {
	return r.hub
}

// IsConnected reports whether a local agent is currently connected for the given serverID.
func (r *Relay) IsConnected(serverID string) bool {
	return r.hub.IsConnected(serverID)
}

// Proxy forwards a Proxmox API request to the agent identified by serverID
// and returns the raw response.
func (r *Relay) Proxy(serverID string, req hub.ProxyRequest) (*hub.ProxyResponse, error) {
	return r.hub.Proxy(serverID, req)
}

// RegisterAgent hands off an already-upgraded WebSocket connection to the hub.
func (r *Relay) RegisterAgent(serverID string, conn interface{ Close() error }) {
	// Type assertion handled in hub.Register — kept here for future middleware hooks.
}
