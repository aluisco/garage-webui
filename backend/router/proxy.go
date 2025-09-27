package router

import (
	"bytes"
	"fmt"
	"io"
	"khairul169/garage-webui/utils"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func ProxyHandler(w http.ResponseWriter, r *http.Request) {
	// Log CreateBucket requests
	if strings.Contains(r.URL.Path, "CreateBucket") && r.Method == "POST" {
		body, err := io.ReadAll(r.Body)
		if err == nil {
			log.Printf("CreateBucket request body: %s", string(body))
			// Restore body for proxy
			r.Body = io.NopCloser(bytes.NewReader(body))
		}
	}

	target, err := url.Parse(utils.Garage.GetAdminEndpoint())
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	proxy := &httputil.ReverseProxy{
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(target)
			r.Out.URL.Path = strings.TrimPrefix(r.In.URL.Path, "/api")
			r.Out.Header.Set("Authorization", fmt.Sprintf("Bearer %s", utils.Garage.GetAdminKey()))
		},
	}

	proxy.ServeHTTP(w, r)
}
