import { createClient } from '@/lib/supabase/server'
import CheckoutClient from './checkout-client'

export const revalidate = 0 // Checkout must always be dynamic

export default async function CheckoutPage() {
  const supabase = await createClient()

  // Fetch approved delivery locations
  const { data: locations } = await supabase
    .from('delivery_locations')
    .select('*')
    .eq('status', 'aprobado')
    .order('name', { ascending: true })

  return (
    <CheckoutClient approvedLocations={locations || []} />
  )
}
