import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const isDevelopment = mode === 'development';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: true, // Listen on all addresses (needed for Docker)
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true, // Enable polling for file changes in Docker
        interval: 100,
      },
      hmr: {
        port: 5173,
        host: 'localhost',
      },
      proxy: {
        "/api": {
          target: process.env.VITE_API_URL || "http://localhost:3909",
          changeOrigin: true,
          secure: false,
          ws: true,
          cookieDomainRewrite: "",
          cookiePathRewrite: "/",
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    build: {
      sourcemap: isDevelopment,
      minify: !isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['react-daisyui', 'tailwindcss'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query'],
    },
  };
});
