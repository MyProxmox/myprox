package hub

import (
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// ProxyRequest is sent from the relay to the local agent.
type ProxyRequest struct {
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    json.RawMessage   `json:"body,omitempty"`
}

// ProxyResponse is sent back from the local agent.
type ProxyResponse struct {
	ID     string          `json:"id"`
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body"`
	Error  string          `json:"error,omitempty"`
}

type agent struct {
	conn    *websocket.Conn
	mu      sync.Mutex
	pending sync.Map // requestID → chan ProxyResponse
}

// Hub maintains the registry of connected agents.
type Hub struct {
	agents sync.Map // serverID → *agent
}

func New() *Hub {
	return &Hub{}
}

// Register upgrades an HTTP connection to WebSocket and registers the agent.
func (h *Hub) Register(serverID string, conn *websocket.Conn) {
	a := &agent{conn: conn}
	h.agents.Store(serverID, a)
	go h.readLoop(serverID, a)
}

func (h *Hub) readLoop(serverID string, a *agent) {
	defer func() {
		a.conn.Close()
		h.agents.Delete(serverID)
		// drain pending requests
		a.pending.Range(func(key, val interface{}) bool {
			val.(chan ProxyResponse) <- ProxyResponse{Error: "agent disconnected"}
			return true
		})
	}()
	for {
		_, msg, err := a.conn.ReadMessage()
		if err != nil {
			return
		}
		var resp ProxyResponse
		if err := json.Unmarshal(msg, &resp); err != nil {
			continue
		}
		if ch, ok := a.pending.LoadAndDelete(resp.ID); ok {
			ch.(chan ProxyResponse) <- resp
		}
	}
}

// Proxy forwards a request to the agent identified by serverID.
func (h *Hub) Proxy(serverID string, req ProxyRequest) (*ProxyResponse, error) {
	agentI, ok := h.agents.Load(serverID)
	if !ok {
		return nil, errors.New("agent not connected for server " + serverID)
	}
	a := agentI.(*agent)

	req.ID = uuid.New().String()
	ch := make(chan ProxyResponse, 1)
	a.pending.Store(req.ID, ch)

	msg, err := json.Marshal(req)
	if err != nil {
		a.pending.Delete(req.ID)
		return nil, err
	}

	a.mu.Lock()
	err = a.conn.WriteMessage(websocket.TextMessage, msg)
	a.mu.Unlock()
	if err != nil {
		a.pending.Delete(req.ID)
		return nil, err
	}

	select {
	case resp := <-ch:
		if resp.Error != "" {
			return nil, errors.New(resp.Error)
		}
		return &resp, nil
	case <-time.After(30 * time.Second):
		a.pending.Delete(req.ID)
		return nil, errors.New("proxy timeout after 30s")
	}
}

// IsConnected returns true if an agent is registered for this serverID.
func (h *Hub) IsConnected(serverID string) bool {
	_, ok := h.agents.Load(serverID)
	return ok
}
