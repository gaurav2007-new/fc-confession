import { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://example.com'
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/confessions`, lastModified: new Date() },
    { url: `${base}/track`, lastModified: new Date() },
  ]
}
