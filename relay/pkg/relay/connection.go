package relay

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Connection represents a single active WebSocket connection from a local agent.
type Connection struct {
	ServerID    string
	UserID      string
	Conn        *websocket.Conn
	ConnectedAt time.Time
	mu          sync.Mutex
}

// NewConnection creates a new Connection instance.
func NewConnection(serverID, userID string, conn *websocket.Conn) *Connection {
	return &Connection{
		ServerID:    serverID,
		UserID:      userID,
		Conn:        conn,
		ConnectedAt: time.Now(),
	}
}

// WriteJSON sends a JSON message to the remote agent in a thread-safe manner.
func (c *Connection) WriteJSON(v interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.Conn.WriteJSON(v)
}

// Close closes the underlying WebSocket connection.
func (c *Connection) Close() error {
	return c.Conn.Close()
}

// Age returns how long this connection has been open.
func (c *Connection) Age() time.Duration {
	return time.Since(c.ConnectedAt)
}
