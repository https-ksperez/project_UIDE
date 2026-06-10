'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Order } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Bike, 
  MapPin, 
  Phone, 
  User, 
  Utensils, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react'

interface RiderDeliveryClientProps {
  orderId: string
}

const supabase = createClient() as any

export default function RiderDeliveryClient({ orderId }: RiderDeliveryClientProps) {
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)

  const fetchDeliveryDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cafeteria:cafeterias(name, physical_location),
          location:delivery_locations(name, description),
          student:profiles!student_id(full_name, phone),
          items:order_items(
            *,
            product:products(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data as any)
      
      // If it's already delivered, redirect back to dashboard
      if (data.status === 'entregado') {
        toast.info('Este pedido ya ha sido entregado.')
        router.push('/rider/dashboard')
      }
    } catch (err: any) {
      console.error('Error fetching delivery:', err)
      toast.error('No se pudo cargar la información del envío.')
    } finally {
      setIsLoading(false)
    }
  }, [orderId, supabase, router])

  useEffect(() => {
    fetchDeliveryDetails()
  }, [fetchDeliveryDetails])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otpInput.trim().length !== 6) {
      toast.error('Por favor, ingresa el código OTP completo de 6 dígitos.')
      return
    }

    setIsValidating(true)

    try {
      // Call RPC to verify OTP
      const { data: res, error: rpcError } = await supabase
        .rpc('verify_delivery_otp', {
          p_order_id: parseInt(orderId, 10),
          p_input_otp: otpInput.trim()
        })

      if (rpcError) throw rpcError

      if (res && res.success) {
        toast.success(res.message || '¡OTP Verificado! Entrega registrada con éxito.')
        router.push('/rider/dashboard')
      } else {
        throw new Error(res?.error || 'Código OTP incorrecto.')
      }
    } catch (err: any) {
      console.error('OTP Validation error:', err)
      toast.error(err.message || 'Error al validar el código OTP.')
    } finally {
      setIsValidating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando datos del envío...</p>
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
          <h3 className="text-base font-bold text-foreground">Entrega no encontrada</h3>
          <Link href="/rider/dashboard">
            <Button size="sm" className="rounded-full shadow-xs">
              Volver al Panel
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-8 px-4 md:px-8 border-b border-border/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/rider/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ChevronLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
          <span className="text-xs text-muted-foreground">
            Pedido #{String(order.id).slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 md:px-8 py-10 grid md:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Delivery Details */}
        <div className="md:col-span-7 space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-lg font-bold text-foreground">
                Información de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs text-muted-foreground">
              {/* Pickup & Drop Points */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Punto de Retiro (Cafetería)</h4>
                    <p className="font-extrabold text-foreground text-xs mt-1">{order.cafeteria?.name}</p>
                    <p className="mt-0.5">{order.cafeteria?.physical_location}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/40">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Punto de Entrega (Encuentro)</h4>
                    <p className="font-extrabold text-foreground text-xs mt-1">{order.location?.name}</p>
                    <p className="mt-0.5">{order.location?.description || 'En el punto de encuentro señalado.'}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/40">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Datos del Estudiante (Comprador)</h4>
                    <p className="font-extrabold text-foreground text-xs mt-1">{order.student?.full_name || 'Comunidad UIDE'}</p>
                    
                    <a 
                      href={`tel:${order.student?.phone || ''}`} 
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar: {order.student?.phone || 'No registrado'}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details list */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-sm font-bold text-foreground">Artículos a entregar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 py-4 divide-y divide-border/30 text-xs">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 first:pt-0">
                    <span className="text-muted-foreground"><strong className="text-foreground">{item.quantity}x</strong> {item.product?.name}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: OTP verification panel */}
        <div className="md:col-span-5 space-y-6">
          <Card className="rounded-2xl border-primary/30 shadow-md bg-primary/5 sticky top-28 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-primary animate-pulse" />
            <CardHeader className="pb-2 text-center pt-6">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-2">
                <Bike className="w-5 h-5 animate-bounce" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Confirmar Entrega
              </CardTitle>
              <CardDescription className="text-[10px] max-w-[200px] mx-auto">
                Ingresa el código OTP de 6 dígitos proporcionado por el estudiante para validar y cerrar la orden.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={isValidating}
                    className="text-center font-black tracking-widest text-xl h-12 bg-background border-border/80 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold shadow-md shadow-primary/10 h-11 text-xs"
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Validando OTP...
                    </>
                  ) : (
                    <>
                      Validar y Completar Entrega
                      <ArrowRight className="w-4.5 h-4.5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="flex justify-center items-center gap-1.5 text-[9px] text-muted-foreground text-center pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Cierre de pedido verificado e irreversible</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
