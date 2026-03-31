import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/predicthq': {
        target: 'https://api.predicthq.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/predicthq/, ''),
      },
      '/api/ra': {
        target: 'https://ra.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ra/, ''),
        headers: { Referer: 'https://ra.co/' },
      },
      '/api/blogto': {
        target: 'https://www.blogto.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blogto/, ''),
      },
      '/api/meetup': {
        target: 'https://www.meetup.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/meetup/, '/gql2'),
      },
    },
  },
})
