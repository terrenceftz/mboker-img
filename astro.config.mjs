import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { siteConfig } from "./src/config/site";
import { ssrConfig } from "./src/config/ssr";
import { fileURLToPath } from "node:url";

// https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  output: ssrConfig.output,
  adapter: node(ssrConfig.nodeAdapter),
  vite: {
    resolve: {
      alias: {
        "@/elements": fileURLToPath(new URL("./src/components/elements", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
