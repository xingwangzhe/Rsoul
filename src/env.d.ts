// TypeScript 声明，允许将 JSON 文件作为模块导入。
// 这允许像 `import en from '../i18n/en.json';` 这样的语句。
declare module "*.json" {
  const value: { [key: string]: any };
  export default value;
}

// 扩展 Vue 的 ComponentCustomProperties 以包含用于 i18n 的 $t
// 扩展 Vue 的 ComponentCustomProperties 以包含用于 i18n 的 $t
import "@vue/runtime-core";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: (key: string, options?: any) => any;
  }
}
