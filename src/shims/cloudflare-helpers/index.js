// Astro Cloudflare Routing Helpers Shim
// Since this is a static build, routing is handled natively by Astro's file-based static routing.
// We export placeholder functions that might be expected.

export function getRouteHelper() {
  return null;
}

export const cloudflareHelpers = {
  getRouteHelper
};

export default cloudflareHelpers;
