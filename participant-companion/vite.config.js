import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'participant-companion' to match your actual GitHub repo name
// e.g., if your repo is github.com/yourname/my-tour-app → base: '/my-tour-app/'
export default defineConfig({
  plugins: [react()],
  base: '/participant-companion/',
})
