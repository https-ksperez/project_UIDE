import { createClient } from '@/lib/supabase/server'
import OrdersClient from './orders-client'

export const revalidate = 0 // Keep orders list dynamic

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <OrdersClient studentId={user?.id || ''} />
  )
}
