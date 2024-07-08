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
	ProofOfTask      string `json:"proofOfTask"`
	Performer        string `json:"performer"`
	Data             string `json:"data"`
	TaskDefinitionId int    `json:"taskDefinitionId"`
}

type ValidateResponse struct {
	Data    bool   `json:"data"`
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
	log.Println("Handling /task/validate request")

	// Try to read IPFS host from env & return error if not found
	ipfsHost := os.Getenv("IPFS_HOST")
	if ipfsHost == "" {
		ipfsHost = "https://othentic.mypinata.cloud/ipfs"
		log.Println("Warning: IPFS_HOST env variable not set. Using default:", ipfsHost)
	}

	var req ValidateRequest
	var res ValidateResponse

	// Decode the request body
	log.Println("Decoding request body...")
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("Error decoding request body: %v", err)
		return
	}

	// Log the request
	log.Printf("Received request: %+v\n", req)

	// Validation logic
	if req.ProofOfTask == "" {
		res.Data = false
		res.Error = "Task cannot be empty"
		log.Println("Error: Task cannot be empty")
		writeJSONResponse(w, res)
		return
	}

	// Perform validation of the execution of the block to verify
	// 1. Take the inputs from the request as proofOfTask and data
	cid := req.ProofOfTask

	// 2. Preparing the data for the block , so either fetch from the CID or something
	url := fmt.Sprintf("%s/%s", ipfsHost, cid)

	proofData, err := fetchUserData(url)
	if err != nil {
		log.Printf("Error fetching user data: %v", err)
		res.Data = false
		res.Error = err.Error()
		writeJSONResponse(w, res)
		return
	}

	currentAppState := json.RawMessage(proofData.RawState)
	log.Printf("Current app state: %v", currentAppState)

	// 3. Verify block execution
	valid, err := verifier.VerifyBlock(&proofData.Block, currentAppState)

	// 4. Return the result
	if err != nil {
		res.Data = false
		res.Error = err.Error()
		log.Printf("Error verifying block: %v", err)
	} else {
		res.Data = valid
		log.Printf("Block verification result: %v", valid)
	}

	writeJSONResponse(w, res)
}

func fetchUserData(url string) (*ProofData, error) {
	log.Printf("Fetching proof data from IPFS for CID: %v ..", url)

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
	log.Printf("Received proofData: %+v\n", proofData)

	if err := json.NewDecoder(resp.Body).Decode(&proofData); err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %v", err)
	}

	return &proofData, nil
}

func writeJSONResponse(w http.ResponseWriter, res ValidateResponse) {
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(res)
	if err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/task/validate", validateTaskHandler)

	port := ":4002"
	log.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
