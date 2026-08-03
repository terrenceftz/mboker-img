import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { siteConfig } from "./src/config/site";
import { ssrConfig } from "./src/config/ssr";
import { resolvePublicSiteConfig } from "./src/config/public-site";
import { fileURLToPath } from "node:url";

const publicSite = resolvePublicSiteConfig(process.env.PUBLIC_SITE_URL, siteConfig.url);

// https://astro.build/config
export default defineConfig({
  site: publicSite.site,
  output: ssrConfig.output,
  adapter: node(ssrConfig.nodeAdapter),
  security: {
    checkOrigin: true,
    allowedDomains: [publicSite.allowedDomain],
  },
  vite: {
    resolve: {
      alias: {
        "@/elements": fileURLToPath(new URL("./src/components/elements", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
