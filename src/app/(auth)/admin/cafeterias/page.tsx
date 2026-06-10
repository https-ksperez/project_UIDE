import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCafeteriasClient from './admin-cafeterias-client'

export const revalidate = 0

export default async function AdminCafeteriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify role
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()) as any

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Fetch all cafeterias
  const { data: cafeterias } = await supabase
    .from('cafeterias')
    .select('*')
    .order('name', { ascending: true })

  // Fetch potential owner profiles (users with role = 'cafeteria')
  const { data: owners } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'cafeteria')

  return (
    <AdminCafeteriasClient 
      initialCafeterias={cafeterias || []} 
      cafeteriaOwners={owners || []} 
    />
  )
}
