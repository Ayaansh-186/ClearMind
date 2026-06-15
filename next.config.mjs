/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'buoloivoecavrflaehos.supabase.co',
      },
    ],
  },
}

export default nextConfig
