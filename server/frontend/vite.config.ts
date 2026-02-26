import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    https: {
      key: fs.readFileSync(
        path.resolve(process.env.HOME ?? '', '.onewAy/onewAy.key'),
      ),
      cert: fs.readFileSync(
        path.resolve(process.env.HOME ?? '', '.onewAy/onewAy.crt'),
      ),
    },
  },
});
