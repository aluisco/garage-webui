package schema

type Config struct {
	RPCBindAddr   string `json:"rpc_bind_addr" toml:"rpc_bind_addr"`
	RPCPublicAddr string `json:"rpc_public_addr" toml:"rpc_public_addr"`
	RPCSecret     string `json:"rpc_secret" toml:"rpc_secret"`
	Admin         Admin  `json:"admin" toml:"admin"`
	S3API         S3API  `json:"s3_api" toml:"s3_api"`
	S3Web         S3Web  `json:"s3_web" toml:"s3_web"`
}

type Admin struct {
	AdminToken   string `json:"admin_token" toml:"admin_token"`
	APIBindAddr  string `json:"api_bind_addr" toml:"api_bind_addr"`
	MetricsToken string `json:"metrics_token" toml:"metrics_token"`
}

type S3API struct {
	APIBindAddr string `json:"api_bind_addr" toml:"api_bind_addr"`
	RootDomain  string `json:"root_domain" toml:"root_domain"`
	S3Region    string `json:"s3_region" toml:"s3_region"`
}

type S3Web struct {
	BindAddr   string `json:"bind_addr" toml:"bind_addr"`
	Index      string `json:"index" toml:"index"`
	RootDomain string `json:"root_domain" toml:"root_domain"`
}

// S3Configuration represents the S3 configuration that can be modified at runtime
type S3Configuration struct {
	Region           string `json:"region"`
	Endpoint         string `json:"endpoint"`
	AdminAPI         string `json:"admin_api"`
	WebEndpoint      string `json:"web_endpoint"`
	MaxBuckets       int    `json:"max_buckets"`
	MaxKeys          int    `json:"max_keys"`
	DefaultQuota     int64  `json:"default_quota"`
	AllowBucketCRUD  bool   `json:"allow_bucket_crud"`
	AllowKeysCRUD    bool   `json:"allow_keys_crud"`
	RequireAuth      bool   `json:"require_auth"`
}

// GetDefaultS3Config returns default S3 configuration
func GetDefaultS3Config() *S3Configuration {
	return &S3Configuration{
		Region:           "garage",
		Endpoint:         "http://localhost:3900",
		AdminAPI:         "http://localhost:3903",
		WebEndpoint:      "",
		MaxBuckets:       10,
		MaxKeys:          100,
		DefaultQuota:     0, // No limit
		AllowBucketCRUD:  true,
		AllowKeysCRUD:    true,
		RequireAuth:      true,
	}
}
