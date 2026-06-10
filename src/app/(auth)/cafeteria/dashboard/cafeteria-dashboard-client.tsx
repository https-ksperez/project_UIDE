'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cafeteria, Order } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Utensils, 
  MapPin, 
  Clock, 
  Loader2, 
  Check, 
  X, 
  ClipboardList, 
  Image, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Eye,
  Store,
  DollarSign,
  Settings
} from 'lucide-react'

interface CafeteriaDashboardClientProps {
  cafeteria: Cafeteria
}

const supabase = createClient() as any

export default function CafeteriaDashboardClient({ cafeteria }: CafeteriaDashboardClientProps) {
  
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pendientes' | 'preparando' | 'completados'>('pendientes')
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null)
  const [isLoadingProof, setIsLoadingProof] = useState(false)
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<string | null>(null)

  // Fetch all orders for this cafeteria
  const fetchCafeteriaOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          location:delivery_locations(name),
          student:profiles!student_id(full_name, phone),
          items:order_items(
            *,
            product:products(name)
          )
        `)
        .eq('cafeteria_id', cafeteria.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data as any[] || [])
    } catch (err: any) {
      console.error('Error fetching cafeteria orders:', err)
      toast.error('Error al sincronizar las órdenes.')
    } finally {
      setIsLoading(false)
    }
  }, [cafeteria.id, supabase])

  useEffect(() => {
    fetchCafeteriaOrders()

    // Realtime channel for order status updates or new orders
    const channel = supabase
      .channel(`realtime-cafeteria-${cafeteria.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `cafeteria_id=eq.${cafeteria.id}`,
        },
        (payload: any) => {
          fetchCafeteriaOrders()
          if (payload.eventType === 'INSERT') {
            toast.success('¡Nuevo pedido recibido! Revisa la pestaña de pendientes.')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafeteria.id, fetchCafeteriaOrders, supabase])

  // Filter orders by tab
  const pendingPayments = orders.filter((o) => o.status === 'pendiente' && o.payment_status === 'pendiente')
  const cookingOrders = orders.filter((o) => o.status === 'preparando')
  const completedOrders = orders.filter((o) => ['listo_para_entrega', 'en_camino', 'entregado', 'cancelado'].includes(o.status))

  const handleApprovePayment = async (orderId: string) => {
    setIsUpdatingOrder(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'verificado',
          verified_by_cafeteria: true,
          status: 'preparando'
        })
        .eq('id', orderId)

      if (error) throw error
      toast.success('Pago verificado. La orden pasó a la cocina para preparación.')
      fetchCafeteriaOrders()
    } catch (err: any) {
      console.error('Error verifying payment:', err)
      toast.error('No se pudo verificar el pago.')
    } finally {
      setIsUpdatingOrder(null)
    }
  }

  const handleRejectPayment = async (orderId: string) => {
    setIsUpdatingOrder(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'rechazado',
          status: 'cancelado'
        })
        .eq('id', orderId)

      if (error) throw error
      toast.warning('El pago ha sido rechazado. Pedido cancelado.')
      fetchCafeteriaOrders()
    } catch (err: any) {
      console.error('Error rejecting payment:', err)
      toast.error('No se pudo rechazar el pago.')
    } finally {
      setIsUpdatingOrder(null)
    }
  }

  const handleFinishCooking = async (orderId: string) => {
    setIsUpdatingOrder(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'listo_para_entrega'
        })
        .eq('id', orderId)

      if (error) throw error
      toast.success('¡Orden terminada! Lista para ser entregada por el repartidor.')
      fetchCafeteriaOrders()
    } catch (err: any) {
      console.error('Error finishing cooking:', err)
      toast.error('No se pudo actualizar el estado de la orden.')
    } finally {
      setIsUpdatingOrder(null)
    }
  }

  const handleViewProof = async (path: string) => {
    setIsLoadingProof(true)
    setSelectedProofUrl(null)
    try {
      // Normalizar el path: quitar el prefijo del bucket si viene incluido
      // (ej: "payment-proofs/uuid/file.jpg" → "uuid/file.jpg")
      const normalizedPath = path.startsWith('payment-proofs/')
        ? path.slice('payment-proofs/'.length)
        : path

      // El bucket 'payment-proofs' es privado → usar createSignedUrl (URL temporal 1 hora)
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(normalizedPath, 3600)

      if (error) throw error

      if (data?.signedUrl) {
        setSelectedProofUrl(data.signedUrl)
      } else {
        toast.error('No se pudo generar el enlace del comprobante.')
      }
    } catch (err: any) {
      console.error('Error getting proof URL:', err)
      toast.error('Error al cargar el comprobante: ' + (err.message || 'Intenta de nuevo.'))
    } finally {
      setIsLoadingProof(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Store className="w-7 h-7 text-primary" />
              Gestión de {cafeteria.name}
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Controla pedidos en tiempo real, administra menús y coordina despachos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/cafeteria/menu">
              <Button variant="outline" size="sm" className="rounded-full shadow-xs text-xs font-semibold border-border/60">
                Administrar Inventario
              </Button>
            </Link>
            <Link href="/cafeteria/settings">
              <Button variant="outline" size="sm" className="rounded-full shadow-xs text-xs font-semibold border-border/60 gap-1.5 flex items-center">
                <Settings className="w-3.5 h-3.5" />
                Ajustes de Cafetería
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="sticky top-[73px] z-30 w-full glass border-b border-border/40 py-3.5 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex gap-2">
          <Button
            variant={activeTab === 'pendientes' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full font-bold text-xs"
            onClick={() => setActiveTab('pendientes')}
          >
            Pendientes por Verificar ({pendingPayments.length})
          </Button>
          <Button
            variant={activeTab === 'preparando' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full font-bold text-xs"
            onClick={() => setActiveTab('preparando')}
          >
            En Cocina ({cookingOrders.length})
          </Button>
          <Button
            variant={activeTab === 'completados' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full font-bold text-xs"
            onClick={() => setActiveTab('completados')}
          >
            Historial / Logs ({completedOrders.length})
          </Button>
        </div>
      </div>

      {/* Dashboard Main Grid */}
      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'pendientes' && (
              <motion.div
                key="pendientes-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {pendingPayments.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {pendingPayments.map((order) => (
                      <Card key={order.id} className="rounded-2xl border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="p-4 border-b border-border/40 bg-muted/20 flex justify-between items-center text-xs">
                            <span className="font-bold text-foreground">Pedido #{String(order.id).slice(0, 8).toUpperCase()}</span>
                            <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                          </div>
                          
                          <CardContent className="p-5 space-y-4 text-xs">
                            {/* Student & Dest */}
                            <div className="space-y-2 text-muted-foreground">
                              <p>Cliente: <strong className="text-foreground">{order.student?.full_name || 'Estudiante UIDE'}</strong></p>
                              <p>Teléfono: <strong className="text-foreground">{order.student?.phone || 'No registrado'}</strong></p>
                              <p>Entregar en: <strong className="text-foreground">{order.location?.name}</strong></p>
                            </div>

                            {/* Detalle */}
                            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-1.5">
                              <p className="font-bold text-foreground/80">Detalle del Carrito:</p>
                              <ul className="space-y-1.5 list-disc list-inside">
                                {order.items?.map((it) => (
                                  <li key={it.id}>
                                    <strong className="text-foreground">{it.quantity}x</strong> {it.product?.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </div>

                        {/* Actions & Proof trigger */}
                        <div className="p-5 pt-0 border-t border-border/30 bg-muted/10 flex items-center justify-between gap-4 mt-auto">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Monto Transferido</p>
                            <p className="text-sm font-black text-primary">{formatCurrency(order.total_amount)}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {order.payment_proof_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full shadow-xs text-xs font-semibold gap-1"
                                onClick={() => handleViewProof(order.payment_proof_path!)}
                                disabled={isLoadingProof}
                              >
                                {isLoadingProof ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-primary" />
                                )}
                                Comprobante
                              </Button>
                            )}

                            <Button
                              variant="destructive"
                              size="sm"
                              className="rounded-full shadow-xs text-xs font-bold w-8 h-8 p-0"
                              onClick={() => handleRejectPayment(order.id)}
                              disabled={isUpdatingOrder === order.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              className="rounded-full shadow-xs text-xs font-bold gap-1 px-4.5"
                              onClick={() => handleApprovePayment(order.id)}
                              disabled={isUpdatingOrder === order.id}
                            >
                              {isUpdatingOrder === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Verificar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="rounded-2xl border-dashed border-border/85 p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-primary/45" />
                    <h3 className="font-bold text-foreground text-sm">Todo al día</h3>
                    <p className="max-w-xs mx-auto">No hay transferencias pendientes de verificación. ¡Buen trabajo!</p>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'preparando' && (
              <motion.div
                key="preparando-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {cookingOrders.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {cookingOrders.map((order) => (
                      <Card key={order.id} className="rounded-2xl border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="p-4 border-b border-border/40 bg-muted/20 flex justify-between items-center text-xs">
                            <span className="font-bold text-foreground">Pedido #{String(order.id).slice(0, 8).toUpperCase()}</span>
                            <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                          </div>
                          <CardContent className="p-5 space-y-4 text-xs">
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 space-y-1.5">
                              <p className="font-bold text-primary">Platos a Cocinar:</p>
                              <ul className="space-y-1.5">
                                {order.items?.map((it) => (
                                  <li key={it.id} className="flex justify-between font-semibold text-foreground">
                                    <span>{it.quantity}x {it.product?.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                              <p>Destino: <strong className="text-foreground">{order.location?.name}</strong></p>
                              <p>Cliente: <strong className="text-foreground">{order.student?.full_name}</strong></p>
                            </div>
                          </CardContent>
                        </div>
                        <div className="p-5 pt-0 border-t border-border/30 bg-muted/10 flex items-center justify-between gap-3 mt-auto flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-bold border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                              Pago Aprobado
                            </span>
                            {order.payment_proof_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full shadow-xs text-xs font-semibold gap-1 h-6 px-2.5"
                                onClick={() => handleViewProof(order.payment_proof_path!)}
                                disabled={isLoadingProof}
                                type="button"
                              >
                                {isLoadingProof ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                ) : (
                                  <Eye className="w-3 h-3 text-primary" />
                                )}
                                Ver comprobante
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="rounded-full shadow-xs text-xs font-bold gap-1"
                            onClick={() => handleFinishCooking(order.id)}
                            disabled={isUpdatingOrder === order.id}
                          >
                            {isUpdatingOrder === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Terminado / Despachar
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="rounded-2xl border-dashed border-border/85 p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
                    <Utensils className="w-10 h-10 text-primary/45" />
                    <h3 className="font-bold text-foreground text-sm">Cocina en pausa</h3>
                    <p className="max-w-xs mx-auto">No hay platos pendientes por preparar en este momento.</p>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'completados' && (
              <motion.div
                key="completados-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {completedOrders.length > 0 ? (
                  <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40 border-b border-border/30 text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                          <tr>
                            <th className="p-4">Pedido ID</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Monto</th>
                            <th className="p-4">Estado</th>
                             <th className="p-4">Comprobante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {completedOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-bold text-foreground">#{String(o.id).slice(0, 8).toUpperCase()}</td>
                              <td className="p-4 text-muted-foreground">{formatDate(o.created_at).split(',')[0]}</td>
                              <td className="p-4 font-bold text-foreground">{o.student?.full_name || 'Comunidad UIDE'}</td>
                              <td className="p-4 font-black text-primary">{formatCurrency(o.total_amount)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  o.status === 'entregado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  o.status === 'cancelado' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>
                                  {o.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4">
                                {o.payment_proof_path ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs font-semibold gap-1 h-7 px-2.5"
                                    onClick={() => handleViewProof(o.payment_proof_path!)}
                                    disabled={isLoadingProof}
                                    type="button"
                                  >
                                    {isLoadingProof ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Eye className="w-3 h-3 text-primary" />
                                    )}
                                    Ver
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border-dashed border-border p-12 text-center text-xs text-muted-foreground">
                    No posees registros históricos aún.
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Image Modal Lightbox for verification */}
      <AnimatePresence>
        {(selectedProofUrl || isLoadingProof) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => { if (!isLoadingProof) setSelectedProofUrl(null) }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl p-2 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {isLoadingProof ? (
                /* Skeleton loader mientras se genera la URL firmada */
                <div className="w-full h-72 flex flex-col items-center justify-center gap-3 bg-muted/40 rounded-xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-semibold">Cargando comprobante...</p>
                </div>
              ) : selectedProofUrl ? (
                <img
                  src={selectedProofUrl}
                  alt="Comprobante de transferencia"
                  className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
                  onError={() => {
                    toast.error('No se pudo cargar la imagen. Verifica que el archivo existe.')
                    setSelectedProofUrl(null)
                  }}
                />
              ) : null}
              
              <div className="p-4 flex justify-between items-center bg-card">
                <span className="text-xs text-muted-foreground font-semibold">Verificación de Comprobante UIDE</span>
                <Button
                  variant="glass"
                  size="sm"
                  className="rounded-full px-4 h-9 font-bold text-xs"
                  onClick={() => setSelectedProofUrl(null)}
                  disabled={isLoadingProof}
                >
                  Cerrar Vista
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
