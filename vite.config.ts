import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const PROXY_PREFIXES = [
  "/user-login",
  "/register-user",
  "/update-user",
  "/get-all-inactive-riders",
  "/get-all-riders",
  "/activate-rider",
] as const;

export default defineConfig(({ command }) => {
  const proxyTarget =
    command === "serve"
      ? loadEnv("development", process.cwd(), "").VITE_DEV_PROXY_TARGET
      : undefined;

  const proxy = proxyTarget
    ? Object.fromEntries(
        PROXY_PREFIXES.map((prefix) => [
          prefix,
          {
            target: proxyTarget,
            changeOrigin: true,
            cookieDomainRewrite: "localhost",
            secure: true,
          },
        ]),
      )
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
    server: {
      proxy,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./tests/setup.ts"],
      include: ["tests/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["tests/e2e/**", "node_modules/**"],
      css: false,
      clearMocks: true,
      restoreMocks: true,
      env: {
        VITE_API_BASE_URL: "http://localhost:3000",
        VITE_ENABLE_MSW: "true",
      },
    },
  };
});
