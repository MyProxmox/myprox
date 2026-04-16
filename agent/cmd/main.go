package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type ProxyRequest struct {
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    json.RawMessage   `json:"body,omitempty"`
}

type ProxyResponse struct {
	ID     string          `json:"id"`
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body"`
	Error  string          `json:"error,omitempty"`
}

type proxmoxSession struct {
	mu     sync.Mutex
	ticket string
	csrf   string
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		fmt.Fprintf(os.Stderr, "Missing required env var: %s\n", key)
		os.Exit(1)
	}
	return v
}

func main() {
	relayURL := mustEnv("RELAY_URL")    // e.g. ws://relay:8080/agent/connect
	agentToken := mustEnv("AGENT_TOKEN")
	proxmoxURL := mustEnv("PROXMOX_URL") // e.g. https://10.20.0.253:8006/api2/json
	proxmoxUser := mustEnv("PROXMOX_USER")
	proxmoxPass := mustEnv("PROXMOX_PASS")

	httpClient := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	session := &proxmoxSession{}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	connectURL := relayURL + "?token=" + agentToken

	for {
		if err := run(connectURL, proxmoxURL, proxmoxUser, proxmoxPass, httpClient, session, interrupt); err != nil {
			log.Printf("Disconnected: %v — reconnecting in 5s", err)
			time.Sleep(5 * time.Second)
		} else {
			// clean shutdown
			return
		}
	}
}

func run(connectURL, proxmoxURL, proxmoxUser, proxmoxPass string,
	client *http.Client, session *proxmoxSession, interrupt chan os.Signal) error {

	log.Printf("Connecting to relay…")
	conn, _, err := websocket.DefaultDialer.Dial(connectURL, nil)
	if err != nil {
		return err
	}
	defer conn.Close()
	log.Printf("Connected to relay")

	// Initial Proxmox auth
	if err := reauth(client, proxmoxURL, proxmoxUser, proxmoxPass, session); err != nil {
		return fmt.Errorf("proxmox auth failed: %w", err)
	}
	log.Printf("Authenticated with Proxmox")

	done := make(chan error, 1)
	var wg sync.WaitGroup

	go func() {
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				done <- err
				return
			}

			var req ProxyRequest
			if err := json.Unmarshal(msg, &req); err != nil {
				log.Printf("Bad message: %v", err)
				continue
			}

			wg.Add(1)
			go func(req ProxyRequest) {
				defer wg.Done()
				resp := execute(client, proxmoxURL, proxmoxUser, proxmoxPass, session, req)
				data, _ := json.Marshal(resp)
				conn.WriteMessage(websocket.TextMessage, data)
			}(req)
		}
	}()

	select {
	case err := <-done:
		wg.Wait()
		return err
	case <-interrupt:
		conn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		return nil
	}
}

func reauth(client *http.Client, proxmoxURL, user, pass string, session *proxmoxSession) error {
	body := fmt.Sprintf("username=%s&password=%s", user, pass)
	resp, err := client.Post(proxmoxURL+"/access/ticket",
		"application/x-www-form-urlencoded", strings.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Ticket string `json:"ticket"`
			CSRF   string `json:"CSRFPreventionToken"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}
	if result.Data.Ticket == "" {
		return fmt.Errorf("authentication failure")
	}

	session.mu.Lock()
	session.ticket = result.Data.Ticket
	session.csrf = result.Data.CSRF
	session.mu.Unlock()
	return nil
}

func execute(client *http.Client, proxmoxURL, user, pass string,
	session *proxmoxSession, req ProxyRequest) ProxyResponse {

	resp := doRequest(client, proxmoxURL, session, req)

	// Re-auth on Proxmox 401 and retry once
	if resp.Status == 401 {
		log.Printf("Proxmox 401, re-authenticating…")
		if err := reauth(client, proxmoxURL, user, pass, session); err != nil {
			return ProxyResponse{ID: req.ID, Status: 502, Error: "reauth failed: " + err.Error()}
		}
		resp = doRequest(client, proxmoxURL, session, req)
	}

	return resp
}

func doRequest(client *http.Client, proxmoxURL string, session *proxmoxSession, req ProxyRequest) ProxyResponse {
	var bodyReader io.Reader
	if len(req.Body) > 0 && string(req.Body) != "null" {
		bodyReader = bytes.NewReader(req.Body)
	}

	httpReq, err := http.NewRequest(req.Method, proxmoxURL+req.Path, bodyReader)
	if err != nil {
		return ProxyResponse{ID: req.ID, Status: 500, Error: err.Error()}
	}

	session.mu.Lock()
	httpReq.Header.Set("Cookie", "PVEAuthCookie="+session.ticket)
	httpReq.Header.Set("CSRFPreventionToken", session.csrf)
	session.mu.Unlock()

	if bodyReader != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return ProxyResponse{ID: req.ID, Status: 502, Error: err.Error()}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return ProxyResponse{
		ID:     req.ID,
		Status: resp.StatusCode,
		Body:   json.RawMessage(body),
	}
}
