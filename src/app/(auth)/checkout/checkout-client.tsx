'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DeliveryLocation, CafeteriaBankAccount } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { fireSuccessConfetti } from '@/lib/confetti'
import {
  ShoppingBag,
  MapPin,
  UploadCloud,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Building,
  CreditCard,
  Info,
  ImageIcon,
  RefreshCw,
} from 'lucide-react'

const supabase = createClient() as any

interface CheckoutClientProps {
  approvedLocations: DeliveryLocation[]
}

export default function CheckoutClient({ approvedLocations }: CheckoutClientProps) {
  const router = useRouter()

  const { items, getSubtotal, getDeliveryFee, getTotal, clearCart } = useCartStore()
  const { session, isLoading: isAuthLoading } = useAuthStore()

  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [bankAccounts, setBankAccounts] = useState<CafeteriaBankAccount[]>([])
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<Record<number, CafeteriaBankAccount>>({})

  // Un comprobante por cafetería: { [cafId]: File }
  const [proofFiles, setProofFiles] = useState<Record<number, File>>({})
  const [proofPreviews, setProofPreviews] = useState<Record<number, string>>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingBanks, setIsLoadingBanks] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => { setIsHydrated(true) }, [])

  // Unique cafeterias derived from cart
  const uniqueCafs = Array.from(new Set(items.map(item => Number(item.cafeteria_id))))
  const cafeteriaNames = Array.from(new Set(items.map(item => item.cafeteria_name))).join(' y ')
  const uniqueCafsString = uniqueCafs.sort((a, b) => a - b).join(',')

  // ─── Fetch bank accounts (robusto: espera sesión disponible) ───
  useEffect(() => {
    if (isAuthLoading) return          // esperar a que auth termine de cargar
    if (!session) return               // no hay sesión, no fetches

    const cafs = uniqueCafsString ? uniqueCafsString.split(',').map(Number) : []
    if (cafs.length === 0) {
      setBankAccounts([])
      setSelectedBankAccounts({})
      setIsLoadingBanks(false)
      return
    }

    const fetchBanks = async () => {
      setIsLoadingBanks(true)
      try {
        const { data, error } = await supabase
          .from('cafeteria_bank_accounts')
          .select('*')
          .in('cafeteria_id', cafs)

        if (error) throw error

        const accounts = (data || []) as CafeteriaBankAccount[]
        setBankAccounts(accounts)

        // Pre-seleccionar cuenta principal de cada cafetería
        const init: Record<number, CafeteriaBankAccount> = {}
        cafs.forEach(cafId => {
          const cafAccs = accounts.filter(a => Number(a.cafeteria_id) === cafId)
          if (cafAccs.length > 0) {
            init[cafId] = cafAccs.find(a => a.is_primary) ?? cafAccs[0]
          }
        })
        setSelectedBankAccounts(init)
      } catch (err: any) {
        console.error('Error fetching bank accounts:', err)
        toast.error('Error al cargar datos bancarios. Intenta recargar la página.')
      } finally {
        setIsLoadingBanks(false)
      }
    }

    fetchBanks()
  }, [uniqueCafsString, isAuthLoading, session])

  // Redirigir si carrito vacío
  useEffect(() => {
    if (isHydrated && items.length === 0 && !isSubmitting) {
      toast.error('Tu carrito está vacío. Agrega productos para comprar.')
      router.push('/cafeterias')
    }
  }, [isHydrated, items, router, isSubmitting])

  // ─── Manejo de archivo por cafetería ───
  const handleFileChange = (cafId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 5MB.')
      return
    }
    setProofFiles(prev => ({ ...prev, [cafId]: file }))
    const reader = new FileReader()
    reader.onloadend = () => {
      setProofPreviews(prev => ({ ...prev, [cafId]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // ─── Submit ───
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedLocation) {
      toast.error('Por favor, selecciona un punto de encuentro.')
      return
    }

    // Verificar que hay comprobante para CADA cafetería
    const missingProofs = uniqueCafs.filter(cafId => !proofFiles[cafId])
    if (missingProofs.length > 0) {
      const names = missingProofs
        .map(id => items.find(i => Number(i.cafeteria_id) === id)?.cafeteria_name ?? `Cafetería ${id}`)
        .join(', ')
      toast.error(`Falta el comprobante de: ${names}`)
      return
    }

    if (isAuthLoading) {
      toast.error('Cargando sesión, intenta de nuevo en un momento.')
      return
    }

    const studentId = session?.user?.id
    if (!studentId) {
      toast.error('No se encontró sesión activa. Por favor inicia sesión.')
      router.push('/login?next=/checkout')
      return
    }

    setIsSubmitting(true)

    try {
      const placedOrderIds: number[] = []

      // Procesar cada cafetería de forma independiente
      for (const cafId of uniqueCafs) {
        const cafItems = items.filter(item => Number(item.cafeteria_id) === cafId)
        const subtotal = cafItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
        const deliveryFee = 1.00
        const totalAmount = subtotal + deliveryFee

        // 1. Subir comprobante específico de esta cafetería
        const file = proofFiles[cafId]
        const fileExt = file.name.split('.').pop()
        const uniqueId = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36)
        const filePath = `${studentId}/${uniqueId}_proof_caf${cafId}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'image/jpeg',
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          const cafName = cafItems[0]?.cafeteria_name ?? `Cafetería ${cafId}`
          throw new Error(`Error al subir comprobante de ${cafName}: ${uploadError.message}`)
        }

        // 2. Insertar la orden para esta cafetería
        const orderPayload = {
          student_id: studentId,
          cafeteria_id: cafId,
          delivery_location_id: parseInt(selectedLocation),
          status: 'pendiente',
          payment_status: 'pendiente',
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          payment_proof_path: filePath,
          verified_by_cafeteria: false,
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single()

        if (orderError) {
          console.error('Order insert error:', orderError, orderPayload)
          throw new Error(`Error al registrar pedido: ${orderError.message}`)
        }

        const orderId = orderData.id
        placedOrderIds.push(orderId)

        // 3. Insertar items de la orden
        const orderItems = cafItems.map(item => ({
          order_id: orderId,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Order items error:', itemsError)
          throw new Error(`Error al registrar productos del pedido: ${itemsError.message}`)
        }
      }

      toast.success('¡Pedido realizado con éxito! Esperando validación de la cafetería.')
      fireSuccessConfetti()
      clearCart()

      if (placedOrderIds.length === 1) {
        router.push(`/tracker/${placedOrderIds[0]}`)
      } else {
        router.push('/orders')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      toast.error(err.message || 'Error al procesar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isHydrated || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Cargando carrito...</p>
      </div>
    )
  }

  const allProofsUploaded = uniqueCafs.every(cafId => !!proofFiles[cafId])

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={items[0]?.cafeteria_id ? `/cafeterias/${items[0].cafeteria_id}` : '/cafeterias'}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al Menú
          </Link>
          <span className="text-xs text-muted-foreground">
            Pedido en <strong className="text-foreground">{cafeteriaNames}</strong>
          </span>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 grid md:grid-cols-12 gap-8 flex-1">
        {/* ─── Left: Form ─── */}
        <form onSubmit={handleSubmitOrder} className="md:col-span-7 space-y-6">

          {/* Step 1: Punto de entrega */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                1. ¿Dónde lo recibes?
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona uno de los puntos de encuentro aprobados de la UIDE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                required
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden"
              >
                <option value="">Selecciona un punto de entrega...</option>
                {approvedLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.description ? `(${loc.description})` : ''}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Step 2: Transferencia + comprobante POR CAFETERÍA */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <CreditCard className="w-5 h-5 text-primary" />
                2. Transferencia y Comprobante por Cafetería
              </CardTitle>
              <CardDescription className="text-xs">
                Realiza una transferencia separada para cada cafetería y sube la captura correspondiente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingBanks ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-4 bg-muted/50 border border-border/60 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Cargando cuentas bancarias...
                </div>
              ) : uniqueCafs.map((cafId, idx) => {
                const cafAccounts = bankAccounts.filter(a => Number(a.cafeteria_id) === cafId)
                const bankAccount = selectedBankAccounts[cafId]
                const cafItems = items.filter(i => Number(i.cafeteria_id) === cafId)
                const nameOfCaf = cafItems[0]?.cafeteria_name ?? 'Cafetería'
                const subtotal = cafItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
                const total = subtotal + 1.00
                const preview = proofPreviews[cafId]

                return (
                  <motion.div
                    key={cafId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                    className="rounded-2xl border border-border/70 overflow-hidden"
                  >
                    {/* Header cafetería */}
                    <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Building className="w-4 h-4" />
                        {nameOfCaf}
                      </div>
                      <span className="text-xs font-black text-foreground">
                        Transferir: <span className="text-primary">{formatCurrency(total)}</span>
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Selector de banco */}
                      {cafAccounts.length === 0 ? (
                        <div className="text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Esta cafetería no tiene cuentas bancarias registradas. Contacta a soporte.</span>
                        </div>
                      ) : (
                        <>
                          {cafAccounts.length > 1 && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                Selecciona banco destino
                              </label>
                              <select
                                value={bankAccount?.id ?? ''}
                                onChange={e => {
                                  const chosen = cafAccounts.find(a => a.id === Number(e.target.value))
                                  if (chosen) setSelectedBankAccounts(prev => ({ ...prev, [cafId]: chosen }))
                                }}
                                className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary outline-hidden"
                              >
                                {cafAccounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.bank_name} ({acc.account_type}) {acc.is_primary ? '★ Principal' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Datos de la cuenta */}
                          {bankAccount && (
                            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-muted/40 rounded-xl border border-border/30">
                              <div>
                                <p className="text-muted-foreground font-semibold">Banco</p>
                                <p className="font-extrabold text-foreground">{bankAccount.bank_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-semibold">Tipo</p>
                                <p className="font-extrabold text-foreground">{bankAccount.account_type}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground font-semibold">Número de Cuenta</p>
                                <p className="font-black text-foreground text-sm tracking-widest">{bankAccount.account_number}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground font-semibold">Beneficiario</p>
                                <p className="font-extrabold text-foreground">{bankAccount.account_holder_name}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Upload comprobante para ESTA cafetería */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-primary" />
                          Comprobante de transferencia a {nameOfCaf}
                        </label>

                        <div
                          className="relative cursor-pointer"
                          onClick={() => fileInputRefs.current[cafId]?.click()}
                        >
                          <input
                            ref={el => { fileInputRefs.current[cafId] = el }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isSubmitting}
                            onChange={e => handleFileChange(cafId, e)}
                          />

                          {!preview ? (
                            <div className="border-2 border-dashed border-border/70 rounded-xl p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UploadCloud className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">Subir captura</p>
                                <p className="text-[10px] text-muted-foreground">JPEG o PNG, máx. 5MB</p>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-border/60 rounded-xl overflow-hidden relative group">
                              <img src={preview} alt="Comprobante" className="w-full h-40 object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <RefreshCw className="w-4 h-4 text-white" />
                                <p className="text-white text-xs font-semibold">Cambiar imagen</p>
                              </div>
                              <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>

          {/* Botón submit */}
          <Button
            type="submit"
            className="w-full font-bold shadow-lg shadow-primary/20 h-12"
            disabled={isSubmitting || !allProofsUploaded}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Registrando Pedidos...
              </>
            ) : !allProofsUploaded ? (
              <>
                <UploadCloud className="w-5 h-5 mr-2" />
                Sube todos los comprobantes para continuar
              </>
            ) : (
              <>
                Realizar Pedido{uniqueCafs.length > 1 ? 's' : ''} — {formatCurrency(getTotal())}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* ─── Right: Resumen ─── */}
        <div className="md:col-span-5 space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-xs sticky top-28 bg-card text-card-foreground">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto px-5 py-4 divide-y divide-border/30 no-scrollbar">
                {uniqueCafs.map(cafId => {
                  const cafItems = items.filter(i => Number(i.cafeteria_id) === cafId)
                  const name = cafItems[0]?.cafeteria_name ?? 'Cafetería'
                  const subtotal = cafItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
                  const total = subtotal + 1.00

                  return (
                    <div key={cafId} className="py-3 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">{name}</span>
                        <span className="text-[10px] text-muted-foreground">Envío: {formatCurrency(1.00)}</span>
                      </div>
                      <div className="space-y-1.5">
                        {cafItems.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center text-xs">
                            <div>
                              <h4 className="font-bold text-foreground line-clamp-1">{item.product.name}</h4>
                              <p className="text-[10px] text-muted-foreground">
                                {item.quantity} × {formatCurrency(item.product.price)}
                              </p>
                            </div>
                            <span className="font-bold text-foreground">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/10">
                        <span>Parcial (con envío)</span>
                        <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-5 py-4 bg-muted/40 border-t border-border/40 space-y-3.5">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envío ({uniqueCafs.length} {uniqueCafs.length === 1 ? 'cafetería' : 'cafeterías'})</span>
                    <span className="font-bold text-primary">{formatCurrency(getDeliveryFee())}</span>
                  </div>
                  <div className="pt-2.5 border-t border-border/40 flex justify-between text-sm">
                    <span className="font-extrabold text-foreground">Total a pagar</span>
                    <span className="font-black text-primary text-base">{formatCurrency(getTotal())}</span>
                  </div>
                </div>

                {/* Estado de comprobantes */}
                <div className="space-y-1.5">
                  {uniqueCafs.map(cafId => {
                    const name = items.find(i => Number(i.cafeteria_id) === cafId)?.cafeteria_name ?? `Cafetería ${cafId}`
                    const uploaded = !!proofFiles[cafId]
                    return (
                      <div key={cafId} className={`flex items-center gap-2 text-[10px] px-2.5 py-1.5 rounded-lg font-semibold ${uploaded ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                        {uploaded
                          ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          : <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                        }
                        <span>{name}: {uploaded ? 'Comprobante listo ✓' : 'Pendiente comprobante'}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl text-[10px] text-primary items-start">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Cada cafetería validará su comprobante de forma independiente antes de preparar tu pedido.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
