declare module "virtual:astro-meta/site" {
  export interface SiteIdentity {
    url: string;
    name: string;
    description?: string;
    locale?: string;
  }
  export const site: SiteIdentity;
}
