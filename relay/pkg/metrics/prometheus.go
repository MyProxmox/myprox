package metrics

import (
	"encoding/json"
	"net/http"
	"sync/atomic"
)

// Counters holds lightweight atomic metrics for the relay.
var (
	AgentsConnected  int64
	RequestsProxied  int64
	RequestsFailed   int64
)

// IncrAgents increments the connected agent count.
func IncrAgents() { atomic.AddInt64(&AgentsConnected, 1) }

// DecrAgents decrements the connected agent count.
func DecrAgents() { atomic.AddInt64(&AgentsConnected, -1) }

// IncrProxied increments the proxied request counter.
func IncrProxied() { atomic.AddInt64(&RequestsProxied, 1) }

// IncrFailed increments the failed request counter.
func IncrFailed() { atomic.AddInt64(&RequestsFailed, 1) }

// Snapshot returns a JSON-serialisable snapshot of current metrics.
type Snapshot struct {
	AgentsConnected int64 `json:"agents_connected"`
	RequestsProxied int64 `json:"requests_proxied"`
	RequestsFailed  int64 `json:"requests_failed"`
}

// Handler returns an HTTP handler that serves current metrics as JSON.
// Accessible at GET /metrics (internal — do NOT expose publicly in prod without auth).
func Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		snap := Snapshot{
			AgentsConnected: atomic.LoadInt64(&AgentsConnected),
			RequestsProxied: atomic.LoadInt64(&RequestsProxied),
			RequestsFailed:  atomic.LoadInt64(&RequestsFailed),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snap)
	}
}
