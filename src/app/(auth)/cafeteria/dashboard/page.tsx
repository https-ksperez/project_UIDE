import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CafeteriaDashboardClient from './cafeteria-dashboard-client'

export const revalidate = 0

export default async function CafeteriaDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Verify cafeteria role
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()) as any

  if (!profile || (profile.role !== 'cafeteria' && profile.role !== 'admin')) {
    redirect('/')
  }

  // 2. Fetch the cafeteria owned by this user
  const { data: cafeteria } = await supabase
    .from('cafeterias')
    .select('*')
    .eq('owner_id', user?.id || '')
    .single()

  if (!cafeteria) {
    // If no cafeteria has been assigned to this owner yet, redirect or show message
    redirect('/')
  }

  return (
    <CafeteriaDashboardClient cafeteria={cafeteria} />
  )
}
