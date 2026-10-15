import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  const adminRoute = process.env.ADMIN_ROUTE || 'link.gauravasdimn2007'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/confessions', '/track'],
      disallow: [`/${adminRoute}`, '/api/'],
    },
  }
}
