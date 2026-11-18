import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 * - Scripts: Next.js and our pre-paint script are inline, so 'unsafe-inline' is needed (a per-request nonce would force every
 *   page to render dynamically and defeat cacheComponents). Third-party script hosts are limited to Smartsupp.
 * - Smartsupp domains follow https://help.smartsupp.com/en/articles/12647653 (CSP v2).
 * - Cover images are served from our own /media route; fonts are self-hosted by next/font.
 * - Development additionally needs 'unsafe-eval' and websockets for hot reload.
 */
const smartsupp = ["https://*.smartsupp.com", "https://*.smartsuppchat.com", "https://*.smartsuppcdn.com"];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}${smartsupp.join(" ")}`,
  `style-src 'self' 'unsafe-inline' https://*.smartsuppcdn.com`,
  // Smartsupp shows agent photos and visitor uploads from several hosts, so images may come from any https origin.
  "img-src 'self' data: blob: https:",
  `font-src 'self' data: https://*.smartsuppcdn.com`,
  `media-src 'self' https://*.smartsuppcdn.com`,
  `connect-src 'self' wss://*.smartsupp.com ${smartsupp.join(" ")}${isDev ? " ws: http://localhost:*" : ""}`,
  `frame-src ${smartsupp.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Report-only logs violations in the browser console without blocking anything. Set CSP_ENFORCE=1 once the console is clean.
const cspHeader = process.env.CSP_ENFORCE === "1" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const securityHeaders = [
  { key: cspHeader, value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS only makes sense over https; browsers ignore it on http, and we do not want it cached for localhost.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin screens and chat/auth APIs must never be stored by browsers or shared caches.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/chat/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
