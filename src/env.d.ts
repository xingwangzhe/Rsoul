// TypeScript declaration to allow importing JSON files as modules.
// This enables statements like: `import en from '../i18n/en.json';`
declare module "*.json" {
  const value: { [key: string]: any };
  export default value;
}

// Extend Vue's ComponentCustomProperties to include $t for i18n
import "@vue/runtime-core";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: (key: string, options?: any) => string;
  }
}
