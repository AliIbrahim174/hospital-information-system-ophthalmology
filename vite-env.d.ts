/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  // add more as needed:
  // readonly VITE_SOMETHING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
