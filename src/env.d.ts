// TypeScript declaration to allow importing JSON files as modules.
// This enables statements like: `import en from '../i18n/en.json';`
declare module "*.json" {
  const value: { [key: string]: any };
  export default value;
}
