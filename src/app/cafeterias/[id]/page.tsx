import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CafeteriaMenuClient from './cafeteria-menu-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0 // Keep menus dynamic

export default async function CafeteriaDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = (await createClient()) as any

  // 1. Fetch cafeteria
  const { data: cafeteria } = await supabase
    .from('cafeterias')
    .select('*')
    .eq('id', parseInt(id))
    .single()

  if (!cafeteria) {
    notFound()
  }

  // 2. Fetch categories
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('cafeteria_id', parseInt(id))
    .order('sort_order', { ascending: true })

  // 3. Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('cafeteria_id', parseInt(id))
    .eq('is_available', true)

  return (
    <CafeteriaMenuClient
      cafeteria={cafeteria}
      categories={categories || []}
      products={products || []}
    />
  )
}
