package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"AVS-WebAPI/verifier"
)

// The request and response structure
type ValidateRequest struct {
	ProofOfTask string `json:"proofOfTask"`
	Performer   string `json:"performer"`
	Data        []byte `json:"data"`
}

type ValidateResponse struct {
	Data    bool   `json:"valid"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// The structure of the proof data from the IPFS
type ProofData struct {
	Block    verifier.Block `json:"block"`
	RawState string         `json:"rawState"`
}

// Handler for the /task/validate endpoint
func validateTaskHandler(w http.ResponseWriter, r *http.Request) {
	ipfsHost := os.Getenv("IPFS_HOST")

	var req ValidateRequest
	var res ValidateResponse

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
		// 1. Take the inputs from the request as proofOfTask and data
		cid := req.ProofOfTask

		// 2. Preparing the data for the block , so either fetch from the CID or something
		url := fmt.Sprintf("%s/%s", ipfsHost, cid)

		proofData, err := fetchUserData(url)
		if err != nil {
			log.Fatalf("Error fetching user data: %v", err)
		}

		currentAppState := json.RawMessage(proofData.RawState)

		// 3. Verify block execution
		valid, err := verifier.VerifyBlock(&proofData.Block, currentAppState)

		// 4. Return the result
		if err != nil {
			res.Data = false
			res.Error = err.Error()
		} else {
			res.Data = valid
		}
	}

	// Encode the response as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func fetchUserData(url string) (*ProofData, error) {
	// Perform GET request
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to perform GET request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %v", resp.Status)
	}

	// Decode JSON response
	var proofData ProofData
	if err := json.NewDecoder(resp.Body).Decode(&proofData); err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %v", err)
	}

	return &proofData, nil
}

func main() {
	http.HandleFunc("/task/validate", validateTaskHandler)

	port := ":4002"
	log.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
