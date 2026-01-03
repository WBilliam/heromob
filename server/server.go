package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	port := flag.Int("port", 5173, "port to serve on")
	root := flag.String("root", ".", "directory to serve")
	flag.Parse()

	if _, err := os.Stat(*root); err != nil {
		log.Fatalf("Failed to find root directory %q: %v", *root, err)
	}

	addr := fmt.Sprintf(":%d", *port)
	http.HandleFunc("/api/save-stage", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		body, err := io.ReadAll(io.LimitReader(r.Body, 2<<20))
		if err != nil {
			http.Error(w, "Unable to read request body.", http.StatusBadRequest)
			return
		}
		if len(body) == 0 {
			http.Error(w, "Stage JSON is empty.", http.StatusBadRequest)
			return
		}
		if !json.Valid(body) {
			http.Error(w, "Stage JSON is invalid.", http.StatusBadRequest)
			return
		}

		stagePath := filepath.Join(*root, "public", "stages", "stage-config.json")
		if err := os.MkdirAll(filepath.Dir(stagePath), 0o755); err != nil {
			http.Error(w, "Unable to prepare stage folder.", http.StatusInternalServerError)
			return
		}
		if err := os.WriteFile(stagePath, body, 0o644); err != nil {
			http.Error(w, "Unable to save stage file.", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	})
	http.Handle("/", http.FileServer(http.Dir(*root)))
	log.Printf("Serving %s on http://localhost:%d/", *root, *port)
	log.Fatal(http.ListenAndServe(addr, nil))
}
