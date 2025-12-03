import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: './', // Use relative paths for assets
    build: {
      sourcemap: false, // Disable source maps in production
      minify: 'esbuild', // Minify code in production
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "${resolve(__dirname, 'src/variables.scss')}" as *;
        `,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    plugins: [
      react(),
      svgr({
        exportAsDefault: true, // Simplifies imports
      }),
    ],
  };
});