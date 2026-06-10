'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Order } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Bike, 
  MapPin, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Loader2, 
  User, 
  Utensils, 
  CheckCircle, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  ClipboardList
} from 'lucide-react'

interface RiderDashboardClientProps {
  riderId: string
}

const supabase = createClient() as any

export default function RiderDashboardClient({ riderId }: RiderDashboardClientProps) {
  const { profile, setProfile } = useAuthStore()

  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingShift, setIsUpdatingShift] = useState(false)

  // Fetch all dashboard data
  const fetchRiderData = useCallback(async () => {
    try {
      // 1. Fetch available orders (listo_para_entrega and no rider assigned)
      const { data: availData, error: availErr } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, physical_location),
          location:delivery_locations(name, description)
        `)
        .eq('status', 'listo_para_entrega')
        .is('delivery_rider_id', null)
        .order('created_at', { ascending: true })

      if (availErr) throw availErr
      setAvailableOrders(availData || [])

      // 2. Fetch claimed active deliveries (en_camino and assigned to this rider)
      const { data: activeData, error: activeErr } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, physical_location),
          location:delivery_locations(name, description),
          student:profiles!student_id(full_name, phone)
        `)
        .eq('status', 'en_camino')
        .eq('delivery_rider_id', riderId)
        .order('updated_at', { ascending: false })

      if (activeErr) throw activeErr
      setActiveDeliveries(activeData || [])

    } catch (err: any) {
      console.error('Error fetching rider dashboard:', err)
      toast.error('Error al sincronizar datos del panel de reparto.')
    } finally {
      setIsLoading(false)
    }
  }, [riderId, supabase])

  useEffect(() => {
    fetchRiderData()

    // Realtime listener for lists syncing
    const channel = supabase
      .channel('rider-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchRiderData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [riderId, fetchRiderData, supabase])

  const handleToggleShift = async () => {
    if (!profile) return
    setIsUpdatingShift(true)

    const nextAvailability = !profile.is_available_for_delivery

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_available_for_delivery: nextAvailability })
        .eq('id', riderId)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      toast.success(nextAvailability ? '¡Ya estás en turno activo! Buscando pedidos...' : 'Has cerrado tu turno de reparto.')
    } catch (err: any) {
      console.error('Error toggling shift:', err)
      toast.error('No se pudo modificar el estado de disponibilidad.')
    } finally {
      setIsUpdatingShift(false)
    }
  }

  const handleClaimOrder = async (orderId: string) => {
    if (!profile?.is_available_for_delivery) {
      toast.error('Debes activar tu turno para reclamar pedidos.')
      return
    }

    try {
      // Direct transactional update
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_rider_id: riderId,
          status: 'en_camino'
        })
        .eq('id', orderId)
        .is('delivery_rider_id', null)
        .eq('status', 'listo_para_entrega')

      if (error) throw error

      toast.success('¡Pedido reclamado! Retíralo en la cafetería y dirígete al punto de encuentro.')
      fetchRiderData()
    } catch (err: any) {
      console.error('Error claiming order:', err)
      toast.error('No se pudo reclamar el pedido. Quizá otro repartidor lo tomó primero.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      {/* Header Panel */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Bike className="w-7 h-7 text-primary" />
              Panel de Reparto
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Gestiona entregas rápidas dentro del campus UIDE
            </p>
          </div>

          {/* Shift Switcher */}
          <div className="flex items-center gap-3 bg-muted/60 p-2.5 rounded-2xl border border-border/40 self-start sm:self-auto shadow-xs">
            <span className="text-xs font-extrabold text-foreground">
              {profile?.is_available_for_delivery ? 'Turno Activo' : 'Turno Inactivo'}
            </span>
            <button
              onClick={handleToggleShift}
              disabled={isUpdatingShift}
              className="text-primary hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
            >
              {profile?.is_available_for_delivery ? (
                <ToggleRight className="w-9 h-9" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 grid md:grid-cols-12 gap-8 flex-1">
        {/* Left: Active Deliveries Claimed */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-1.5">
              <Bike className="w-5 h-5 text-primary animate-bounce" />
              Entregas en Camino
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {activeDeliveries.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : activeDeliveries.length > 0 ? (
            <div className="space-y-4">
              {activeDeliveries.map((order) => (
                <Card key={order.id} className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-primary/15 flex justify-between items-center bg-primary/10 text-xs">
                    <span className="font-black text-primary">Pedido #{String(order.id).slice(0, 8).toUpperCase()}</span>
                    <span className="font-bold text-muted-foreground">{formatDate(order.created_at)}</span>
                  </div>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <Utensils className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Origen (Retiro):</p>
                          <p className="text-[11px] mt-0.5">{order.cafeteria?.name} — {order.cafeteria?.physical_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-muted-foreground pt-1.5 border-t border-border/40">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Destino (Entrega):</p>
                          <p className="text-[11px] mt-0.5">{order.location?.name} {order.location?.description ? `(${order.location.description})` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 text-muted-foreground pt-1.5 border-t border-border/40">
                        <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Cliente (Estudiante):</p>
                          <p className="text-[11px] mt-0.5 font-semibold text-foreground">{order.student?.full_name || 'Comunidad UIDE'}</p>
                          <p className="text-[10px] mt-0.5 text-muted-foreground">Teléfono: {order.student?.phone || 'No registrado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex justify-between items-center gap-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Ganancia Envío</p>
                        <p className="text-sm font-black text-primary">{formatCurrency(order.delivery_fee)}</p>
                      </div>
                      
                      <Link href={`/rider/delivery/${order.id}`}>
                        <Button size="sm" className="rounded-full shadow-xs text-xs font-semibold gap-1">
                          Verificar OTP
                          <ChevronRight className="w-4 h-4 animate-pulse" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
              No tienes entregas activas asignadas. Reclama un pedido disponible a la derecha.
            </Card>
          )}
        </div>

        {/* Right: Available Packages for Pickup */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-5 h-5 text-primary" />
              Pedidos Listos para Pickup
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {availableOrders.length}
            </span>
          </div>

          {availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="rounded-2xl border-border bg-card shadow-xs hover:border-primary/10 transition-colors">
                  <div className="p-4 border-b border-border/40 flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">Pedido #{String(order.id).slice(0, 8).toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{formatDate(order.created_at)}</span>
                  </div>
                  <CardContent className="p-5 space-y-3 text-xs">
                    <div className="space-y-1.5 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Retirar de: <strong className="text-foreground">{order.cafeteria?.name}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Llevar a: <strong className="text-foreground">{order.location?.name}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/30 flex justify-between items-center gap-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Pago por Envío</p>
                        <p className="text-sm font-black text-primary">{formatCurrency(order.delivery_fee)}</p>
                      </div>

                      <Button
                        onClick={() => handleClaimOrder(order.id)}
                        disabled={!profile?.is_available_for_delivery}
                        size="sm"
                        className="rounded-full shadow-xs text-xs font-semibold"
                      >
                        Reclamar Entrega
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground/30 animate-spin" />
              <p>No hay pedidos listos en este momento. Esperando que las cafeterías preparen órdenes...</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
