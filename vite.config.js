import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Markdown-Editor/',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react'
          }
          if (id.includes('/docx/')) return 'vendor-docx'
          if (id.includes('/jszip/')) return 'vendor-jszip'
          if (id.includes('/katex/')) return 'vendor-katex'
          if (id.includes('/mermaid/') || id.includes('/dagre') || id.includes('/cytoscape') || id.includes('/d3-')) return 'vendor-mermaid'
          if (id.includes('/qrcode/') || id.includes('/dijkstrajs/')) return 'vendor-qrcode'
          if (id.includes('/markdown-it/') || id.includes('linkify-it') || id.includes('mdurl') || id.includes('uc.micro') || id.includes('entities')) {
            return 'vendor-markdown-it'
          }
          if (id.includes('/unified/') || id.includes('remark') || id.includes('mdast') || id.includes('micromark') || id.includes('vfile') || id.includes('unist')) {
            return 'vendor-remark'
          }
          if (id.includes('/idb/') || id.includes('nanoid') || id.includes('lz-string') || id.includes('file-saver')) {
            return 'vendor-utils'
          }
          if (id.includes('workbox')) return 'vendor-workbox'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon-180x180.png',
        'icon.svg',
      ],
      manifest: {
        name: 'Markdown to Word Converter',
        short_name: 'MD→Word',
        description:
          'Write, preview, share, and export Markdown as Microsoft Word .docx',
        theme_color: '#4F86F7',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'any',
        scope: '/Markdown-Editor/',
        start_url: '/Markdown-Editor/',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'asset-cache' },
          },
          {
            urlPattern: ({ request }) =>
              ['image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
