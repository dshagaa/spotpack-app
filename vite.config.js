import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: { dev: true },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        bypass(req) {
          // Don't proxy import-schedule (multipart) through Vite
          if (req.url?.includes('/import')) return null
          return null
        },
      },
    },
  },
})
