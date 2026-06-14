import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { astroMeta } from "@rafters/astro-meta/astro";
import { defineSite } from "@rafters/astro-meta";
import siteFiles from "@casoon/astro-site-files";
import eminence from "eminence-astro-suite";

export default defineConfig({
  site: "https://recipe-site.pages.dev",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [400, 500, 600],
    },
    {
      provider: fontProviders.google(),
      name: "Outfit",
      cssVariable: "--font-outfit",
      weights: [500, 600, 700, 800],
    }
  ],
  integrations: [
    astroMeta({
      site: defineSite({
        url: "https://recipe-site.pages.dev",
        name: "Astro Recipe Site",
        description: "A premium Astro static recipe blog",
        locale: "en-US",
      }),
      robots: {
        rules: [{ userAgent: "*", allow: ["/"] }],
        contentSignals: {
          search: "yes",
          aiInput: "yes",
          aiTrain: "no",
        },
      },
    }),
    siteFiles({
      sitemap: {
        i18n: {
          defaultLocale: "en",
          locales: { en: "en" }
        }
      },
      robots: {
        rules: [{ userAgent: "*", allow: ["/"] }],
      },
      llms: {
        title: "Astro Recipe Site",
        description: "A premium static recipe blog built with Astro 6.4.",
      }
    }),
    eminence({
      headTags: {
        titleTemplate: "%s | Astro Recipe Site",
        colorScheme: "light dark",
      }
    })
  ]
});
