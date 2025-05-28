/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_AWS_DOMAIN_NAME: string;
  readonly VITE_AWS_BASE_DOMAIN: string;
  readonly VITE_AWS_HOSTED_ZONE_ID: string;
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
