import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [NaiveUiResolver()] }),
    AutoImport({ resolvers: [NaiveUiResolver()] }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // Optimized build config for better performance
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large dependencies into chunks
          'codemirror-core': ['@codemirror/state', '@codemirror/view', '@codemirror/commands'],
          'codemirror-languages': [
            '@codemirror/lang-javascript',
            '@codemirror/lang-css',
            '@codemirror/lang-html',
            '@codemirror/lang-json',
            '@codemirror/lang-markdown',
            '@codemirror/lang-python',
            '@codemirror/lang-xml',
          ],
          'naive-ui-core': ['naive-ui'],
          'vue-vendor': ['vue', 'vue-router', 'vue-i18n'],
          'tauri-vendor': ['@tauri-apps/api'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
