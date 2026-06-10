'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Order, Review } from '@/lib/types/database'
import { formatCurrency, formatDate, formatOrderStatus } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  ShoppingBag, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Utensils, 
  ChevronLeft, 
  Star, 
  Compass, 
  Bike,
  QrCode,
  ShieldCheck,
  Send,
  MessageSquareCheck,
  AlertCircle
} from 'lucide-react'

interface OrderTrackerClientProps {
  orderId: string
}

const supabase = createClient() as any

export default function OrderTrackerClient({ orderId }: OrderTrackerClientProps) {
  const router = useRouter()
  const { profile, session } = useAuthStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)

  // Review Form state
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Stepper states helper
  const steps = [
    { key: 'pendiente', label: 'Pendiente', desc: 'Validando comprobante de transferencia' },
    { key: 'preparando', label: 'Preparando', desc: 'Cocina preparando tu orden' },
    { key: 'listo_para_entrega', label: 'Listo', desc: 'Orden empaquetada para entrega' },
    { key: 'en_camino', label: 'En Camino', desc: 'Repartidor en trayecto a tu punto' },
    { key: 'entregado', label: 'Entregado', desc: '¡Pedido recibido! Buen provecho' }
  ]

  const getActiveStepIndex = (status: string) => {
    return steps.findIndex((step) => step.key === status)
  }

  const fetchOrderDetails = useCallback(async () => {
    try {
      // Fetch order details
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, logo_url, owner_id),
          location:delivery_locations(name, description),
          items:order_items(
            *,
            product:products(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        throw error
      }
      
      setOrder(data as any)

      // Fetch OTP if status is listo_para_entrega or en_camino
      if (['listo_para_entrega', 'en_camino'].includes(data.status)) {
        const { data: otpRes } = await supabase
          .rpc('get_my_order_otp', { p_order_id: parseInt(orderId, 10) })
        
        if (otpRes && otpRes.success) {
          setOtpCode(otpRes.otp)
        } else {
          console.log('Error fetching OTP from RPC:', otpRes?.error)
        }
      }

      // Fetch review if status is entregado
      if (data.status === 'entregado') {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('order_id', orderId)
          .single()
        
        if (reviewData) {
          setExistingReview(reviewData)
        }
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err)
      toast.error('No se pudo cargar el seguimiento del pedido.')
    } finally {
      setIsLoading(false)
    }
  }, [orderId, supabase])

  useEffect(() => {
    fetchOrderDetails()

    // Subscribe to order changes in real-time
    const channel = supabase
      .channel(`realtime-tracker-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          // Trigger automatic refetch
          fetchOrderDetails()
          toast.info(`El estado de tu pedido ha cambiado a: ${formatOrderStatus(payload.new.status)}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, fetchOrderDetails, supabase])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingReview(true)

    try {
      const studentId = session?.user?.id || profile?.id
      if (!studentId) {
        throw new Error('No se pudo determinar la identidad del estudiante.')
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          order_id: parseInt(orderId, 10),
          student_id: studentId,
          cafeteria_id: order?.cafeteria_id!,
          rating,
          comment: comment.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      setExistingReview(data)
      toast.success('¡Gracias por calificar tu servicio!')
    } catch (err: any) {
      console.error('Error submitting review:', err)
      toast.error(err.message || 'No se pudo guardar la calificación.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando detalles de entrega...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Pedido no encontrado</h3>
          <Link href="/orders">
            <Button size="sm" className="rounded-full shadow-xs">
              Ir a Mis Pedidos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const activeIndex = getActiveStepIndex(order.status)
  const isCanceled = order.status === 'cancelado'

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ChevronLeft className="w-4 h-4" />
            Volver a Pedidos
          </Link>
          <span className="text-xs text-muted-foreground">
            Pedido #{String(order.id).slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Order Progress & Stepper */}
        <div className="md:col-span-7 space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground">
                Estado de tu Pedido
              </CardTitle>
              <CardDescription className="text-xs">
                Recibe notificaciones en tiempo real del progreso de tu orden.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isCanceled ? (
                <div className="flex gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pedido Cancelado</p>
                    <p className="text-rose-500/80 mt-0.5">Esta orden ha sido cancelada por la cafetería o el administrador.</p>
                  </div>
                </div>
              ) : (
                /* Stepper UI */
                <div className="space-y-6 relative pl-6 border-l-2 border-border">
                  {steps.map((step, idx) => {
                    const isCompleted = idx < activeIndex
                    const isActive = idx === activeIndex
                    const isUpcoming = idx > activeIndex

                    return (
                      <div key={step.key} className="relative">
                        {/* Bullet Circle Indicator */}
                        <div className={`absolute -left-[35px] top-0 w-[18px] h-[18px] rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          isActive ? 'bg-primary border-primary scale-110 shadow-xs ring-4 ring-primary/20' : 
                          isCompleted ? 'bg-primary border-primary' : 
                          'bg-background border-border'
                        }`}>
                          {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>

                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-bold transition-colors ${
                            isActive ? 'text-primary text-sm' : 
                            isCompleted ? 'text-foreground/80' : 
                            'text-muted-foreground'
                          }`}>
                            {step.label}
                          </h4>
                          <p className={`text-[10px] leading-relaxed transition-colors ${
                            isActive ? 'text-foreground/80 font-medium' : 
                            'text-muted-foreground'
                          }`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* OTP Code Card with Modal Trigger */}
          {['listo_para_entrega', 'en_camino'].includes(order.status) && otpCode && (
            <Card className="rounded-2xl border-primary/30 shadow-xs bg-primary/5 p-5 text-center flex flex-col items-center">
              <QrCode className="w-8 h-8 text-primary mb-2 animate-pulse" />
              <h4 className="font-bold text-sm text-foreground">Confirmación de Entrega</h4>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                Necesitas entregar un código de seguridad al repartidor para finalizar el pedido.
              </p>
              <Button 
                onClick={() => setIsOtpModalOpen(true)}
                className="mt-4 rounded-full text-xs font-bold gap-1 px-5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                Ver Código OTP
              </Button>
            </Card>
          )}

          {/* Review / Rating Form Panel */}
          <AnimatePresence>
            {order.status === 'entregado' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="rounded-2xl border-border/80 shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      Califica tu Experiencia
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Cuéntanos cómo estuvo tu comida y la velocidad del delivery.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {existingReview ? (
                      /* Display submitted review */
                      <div className="space-y-3 p-4 bg-muted/40 border border-border/50 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= existingReview.rating ? 'fill-amber-500' : 'text-muted/60'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold">Calificado</span>
                        </div>
                        {existingReview.comment && (
                          <p className="text-xs italic text-foreground/80 leading-relaxed">
                            "{existingReview.comment}"
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <MessageSquareCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>¡Gracias! Calificación enviada con éxito</span>
                        </div>
                      </div>
                    ) : (
                      /* Review Submission Form */
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="flex flex-col items-center gap-2.5 py-2">
                          <span className="text-[10px] text-muted-foreground font-semibold">Selecciona Estrellas</span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="text-muted/40 hover:scale-110 active:scale-95 transition-all text-2xl focus:outline-hidden cursor-pointer"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-foreground/80">Comentario (Opcional)</label>
                          <textarea
                            placeholder="Ej. El almuerzo estuvo delicioso y el repartidor llegó súper rápido. ¡10/10!"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                          />
                        </div>

                        <Button
                          type="submit"
                          size="sm"
                          className="w-full font-bold shadow-xs text-xs"
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              Enviar Comentarios
                              <Send className="w-3.5 h-3.5 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Order Summary Card */}
        <div className="md:col-span-5 space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs glass sticky top-28">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <ShoppingBag className="w-4.5 h-4.5 text-primary" />
                Resumen de Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Product items */}
              <div className="px-5 py-4 divide-y divide-border/30 max-h-56 overflow-y-auto no-scrollbar">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 first:pt-0">
                    <div>
                      <p className="text-xs font-bold text-foreground line-clamp-1">{item.product?.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Cant: <strong className="text-foreground">{item.quantity}</strong> × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill totals */}
              <div className="px-5 py-4 bg-muted/40 border-t border-border/40 space-y-3.5">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(order.total_amount - order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Costo de Envío</span>
                    <span className="font-bold text-primary">{formatCurrency(order.delivery_fee)}</span>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex justify-between text-sm">
                    <span className="font-extrabold text-foreground">Total Pagado</span>
                    <span className="font-black text-primary text-base leading-none">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-primary shrink-0" />
                    <span>Cafetería: <strong className="text-foreground">{order.cafeteria?.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>Entrega en: <strong className="text-foreground">{order.location?.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-primary shrink-0" />
                    <span>Fecha: <strong>{formatDate(order.created_at)}</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* OTP Code Modal */}
      <AnimatePresence>
        {isOtpModalOpen && otpCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsOtpModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-card border border-border w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-[4px] bg-primary" />
              
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <QrCode className="w-7 h-7" />
              </div>

              <h3 className="font-display font-black text-lg text-foreground">Código de Seguridad OTP</h3>
              <p className="text-xs text-muted-foreground mt-1.5 px-4 leading-relaxed">
                Muestra este código de 4 dígitos a tu repartidor para certificar la entrega de tu pedido.
              </p>

              <div className="mt-6 inline-block px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-black font-display text-3xl tracking-[0.2em] shadow-lg shadow-primary/20 animate-in zoom-in-95 duration-200">
                {otpCode}
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>UIDE Delivery • Transacción Segura</span>
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full rounded-full font-bold text-xs py-5 border-border/60"
                onClick={() => setIsOtpModalOpen(false)}
              >
                Cerrar Código
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
