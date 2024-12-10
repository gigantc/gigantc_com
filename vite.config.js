import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
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
        // $fonts: resolve('./src/assets/fonts'),
        // $headshots: resolve('./src/assets/headshots'),
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