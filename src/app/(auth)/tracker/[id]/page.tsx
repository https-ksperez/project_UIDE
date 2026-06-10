import { notFound } from 'next/navigation'
import OrderTrackerClient from './order-tracker-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0 // Tracker page must reflect live database states

export default async function TrackerPage({ params }: PageProps) {
  const { id } = await params
  
  if (!id) {
    notFound()
  }

  return (
    <OrderTrackerClient orderId={id} />
  )
}
