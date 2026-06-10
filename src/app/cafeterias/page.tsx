import { createClient } from '@/lib/supabase/server'
import CafeteriasClient from './cafeterias-client'

export const revalidate = 0 // Dynamic rendering to always get active state

export default async function CafeteriasPage() {
  const supabase = (await createClient()) as any
  
  // Fetch active cafeterias
  const { data: cafeterias } = await supabase
    .from('cafeterias')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <CafeteriasClient initialCafeterias={cafeterias || []} />
  )
}
