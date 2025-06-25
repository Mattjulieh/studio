import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChatFamily',
    short_name: 'ChatFamily',
    description: 'A modern chat application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/fcicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/fcicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
