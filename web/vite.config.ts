import {defineConfig} from 'vite'
import tailwindcss from '@tailwindcss/vite'
import fs from "fs";

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 6102,
    strictPort: true,
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
  },
})