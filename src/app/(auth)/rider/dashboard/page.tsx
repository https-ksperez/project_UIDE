import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RiderDashboardClient from './rider-dashboard-client'

export const revalidate = 0 // Rider dashboard must always be dynamic

export default async function RiderDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify rider role
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()) as any

  if (!profile || (profile.role !== 'repartidor' && profile.role !== 'admin')) {
    redirect('/')
  }

  return (
    <RiderDashboardClient riderId={user?.id || ''} />
  )
}
