/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PLACES_API_KEY: string
  readonly VITE_FATHOM_SITE_ID: string
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}