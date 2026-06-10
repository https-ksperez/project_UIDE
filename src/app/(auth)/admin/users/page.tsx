import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminUsersClient from './admin-users-client'

export const revalidate = 0

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify role is admin
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()) as any

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AdminUsersClient initialProfiles={profiles || []} />
  )
}
