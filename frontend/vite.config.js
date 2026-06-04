VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon-192.png', 'icon-512.png', 'favicon.ico'],
  manifest: {
    name: 'Paynote',
    short_name: 'Paynote',
    description: 'Professional invoice and payment management app',
    theme_color: '#020617',
    background_color: '#f4f5f8',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    id: '/?pwa=true',           // Helps with uniqueness
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',        // Fixed
        purpose: 'any maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',        // Fixed
        purpose: 'any maskable'
      }
    ]
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|ico)$/,
        handler: 'CacheFirst'
      }
    ]
  }
})
