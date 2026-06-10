'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Order } from '@/lib/types/database'
import { formatCurrency, formatDate, formatOrderStatus, getStatusColor } from '@/lib/utils'
import { 
  ShoppingBag, 
  MapPin, 
  ChevronRight, 
  Clock, 
  Loader2, 
  Utensils, 
  Compass, 
  CheckCircle2, 
  Star,
  RefreshCw
} from 'lucide-react'

interface OrdersClientProps {
  studentId: string
}

const supabase = createClient() as any

export default function OrdersClient({ studentId }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, logo_url),
          location:delivery_locations(name),
          items:order_items(
            *,
            product:products(name)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as any[]) || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [studentId, supabase])

  useEffect(() => {
    fetchOrders()

    // Subscribe to real-time changes in orders table for this student
    const channel = supabase
      .channel(`realtime-student-orders-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, fetchOrders, supabase])

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-primary" />
              Mis Pedidos
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Monitorea el progreso de tus compras en tiempo real
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="rounded-full shadow-xs gap-1.5 self-start sm:self-auto font-semibold border-border/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Orders List Container */}
      <main className="max-w-4xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Cargando tus pedidos...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-md hover:border-primary/10 transition-all duration-300">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 bg-muted/20">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-black text-sm text-foreground">
                          Pedido #{String(order.id).slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>{order.cafeteria?.name || 'Cafetería UIDE'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status label color map */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Items sneak peek */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground/80">Detalle:</p>
                      <ul className="space-y-1.5 list-disc list-inside">
                        {order.items?.map((item) => (
                          <li key={item.id}>
                            <strong className="text-foreground">{item.quantity}x</strong> {item.product?.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Delivery & Billing Summary */}
                    <div className="pt-3 border-t border-border/30 flex flex-wrap sm:flex-nowrap justify-between items-end gap-4">
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Punto de entrega: <strong>{order.location?.name || 'Campus UIDE'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Pago: <strong className="capitalize">{order.payment_status === 'verificado' ? 'Verificado' : 'Pendiente de aprobación'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-semibold">Monto Total</p>
                          <p className="text-base font-black text-primary leading-none">{formatCurrency(order.total_amount)}</p>
                        </div>
                        
                        <Link href={`/tracker/${order.id}`}>
                          <Button size="sm" className="rounded-full shadow-xs text-xs font-bold gap-1">
                            Seguir Pedido
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-primary/30 border border-primary/10">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Aún no tienes pedidos</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                ¡Arma tu carrito en la cafetería que más te guste y realiza tu primer pedido hoy mismo!
              </p>
            </div>
            <Link href="/cafeterias">
              <Button size="sm" className="rounded-full shadow-xs font-bold mt-2">
                Explorar Cafeterías
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
