import { notFound } from 'next/navigation'
import AdminPage from '../link.gauravasdimn2007/page'

export const dynamic = 'force-dynamic'

export default async function SecretPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params
  const expected = process.env.ADMIN_ROUTE
  if (!expected || secret !== expected) {
    notFound()
  }
  return await AdminPage()
}
