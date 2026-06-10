'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck,
  Coffee
} from 'lucide-react'

export function CartSheet() {
  const router = useRouter()
  const { isCartOpen, toggleCart } = useUIStore()
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getDeliveryFee, getTotal } = useCartStore()
  const { session } = useAuthStore()

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    toggleCart() // Close cart sheet
    if (!session) {
      router.push('/login?next=/checkout')
    } else {
      router.push('/checkout')
    }
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <span className="font-display font-bold text-lg text-foreground">Tu Pedido</span>
                {cartItemsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                    {cartItemsCount} {cartItemsCount === 1 ? 'ítem' : 'ítems'}
                  </span>
                )}
              </div>
              <Button
                variant="glass"
                size="icon"
                className="h-8 w-8 rounded-full border-border/50 cursor-pointer"
                onClick={toggleCart}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {items.length > 0 ? (
                <>
                  <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-primary font-semibold text-center mb-2">
                    Pedido en: <strong className="text-foreground">{Array.from(new Set(items.map(item => item.cafeteria_name))).join(' y ')}</strong>
                  </div>
                  
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="flex gap-4 p-3 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-primary/10 transition-colors"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-primary/5 shrink-0 flex items-center justify-center overflow-hidden border border-border/40">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Coffee className="w-6 h-6 text-muted-foreground/30" />
                          )}
                        </div>

                        {/* Details & Qty */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                              {item.product.name}
                            </h4>
                            <span className="text-xs font-black text-primary shrink-0">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            {/* Qty Controls */}
                            <div className="flex items-center gap-1.5 bg-muted rounded-full p-0.5 border border-border/40 scale-90 origin-left">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black px-1.5 w-3 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Delete Item */}
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Clear Cart link */}
                  <div className="text-right pt-2">
                    <button 
                      onClick={clearCart} 
                      className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 border border-primary/10">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">Tu carrito está vacío</h3>
                    <p className="text-xs text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                      Explora nuestras cafeterías del campus y agrega tus antojos favoritos.
                    </p>
                  </div>
                  <Button size="sm" className="rounded-full shadow-xs text-xs font-bold" onClick={toggleCart}>
                    Ver Cafeterías
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Bill Details */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border/40 bg-muted/40 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Costo de Envío (Tarifa Fija)</span>
                    <span className="font-bold text-primary">{formatCurrency(getDeliveryFee())}</span>
                  </div>
                  <div className="pt-2.5 border-t border-border/40 flex justify-between text-sm">
                    <span className="font-extrabold text-foreground">Total del Pedido</span>
                    <span className="font-black text-primary text-base">{formatCurrency(getTotal())}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    onClick={handleCheckout}
                    className="w-full font-bold shadow-lg shadow-primary/20 h-12"
                  >
                    Confirmar Compra
                    <ArrowRight className="w-4.5 h-4.5 ml-2 animate-pulse" />
                  </Button>
                  
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Pago verificado por transferencia bancaria</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
