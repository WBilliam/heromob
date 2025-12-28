package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	port := flag.Int("port", 5173, "port to serve on")
	root := flag.String("root", ".", "directory to serve")
	flag.Parse()

	if _, err := os.Stat(*root); err != nil {
		log.Fatalf("Failed to find root directory %q: %v", *root, err)
	}

	addr := fmt.Sprintf(":%d", *port)
	http.Handle("/", http.FileServer(http.Dir(*root)))
	log.Printf("Serving %s on http://localhost:%d/", *root, *port)
	log.Fatal(http.ListenAndServe(addr, nil))
}
