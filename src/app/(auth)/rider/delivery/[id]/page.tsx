import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import RiderDeliveryClient from './rider-delivery-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0

export default async function RiderDeliveryPage({ params }: PageProps) {
  const { id } = await params
  
  if (!id) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify role
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()) as any

  if (!profile || (profile.role !== 'repartidor' && profile.role !== 'admin')) {
    redirect('/')
  }

  return (
    <RiderDeliveryClient orderId={id} />
  )
}
