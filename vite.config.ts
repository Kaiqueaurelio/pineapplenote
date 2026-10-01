// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public (publishable) backend config. The root .env is git-ignored in this repo, so published
// builds would otherwise miss these values and crash with a blank screen. Safe to ship: these
// are the same values the browser already receives; RLS protects the data.
const PUBLIC_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ygjyivznyagouhovdhsq.supabase.co";
const PUBLIC_SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Kjw9F9ml-WuT1tiG4XxJzg_0t3KJoS9";
const PUBLIC_SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || "ygjyivznyagouhovdhsq";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(PUBLIC_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(PUBLIC_SUPABASE_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(PUBLIC_SUPABASE_PROJECT_ID),
    },
  },
});
