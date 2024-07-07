package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Define the request and response structure
type TaskRequest struct {
	ProofOfTask string `json:"proofOfTask"`
	Performer   string `json:"performer"`
	Data        []byte `json:"data"`
}

type TaskResponse struct {
	Data    bool   `json:"valid"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// Handler for the /task/validate endpoint
func validateTaskHandler(w http.ResponseWriter, r *http.Request) {
	var req TaskRequest
	var res TaskResponse

	// Decode the request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validation logic
	if req.ProofOfTask == "" {
		res.Data = false
		res.Error = "Task cannot be empty"
	} else {

		// Perform validation of the execution of the block to verify
		res.Data = true
	}

	// Encode the response as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func main() {
	http.HandleFunc("/task/validate", validateTaskHandler)

	port := ":4002"
	log.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
