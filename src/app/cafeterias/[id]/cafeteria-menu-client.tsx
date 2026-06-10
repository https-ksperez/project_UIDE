'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cafeteria, ProductCategory, Product } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'
import { 
  MapPin, 
  Coffee, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ChevronLeft,
  Search,
  Clock,
  Sparkles,
  Tag
} from 'lucide-react'

interface CafeteriaMenuClientProps {
  cafeteria: Cafeteria
  categories: ProductCategory[]
  products: Product[]
}

export default function CafeteriaMenuClient({
  cafeteria,
  categories,
  products,
}: CafeteriaMenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<number | 'todos'>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { items, addItem, updateQuantity, removeItem, getTotal } = useCartStore()
  const { toggleCart } = useUIStore()

  // Filter products by active category and search query
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'todos' || prod.category_id === activeCategory
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Get count & qty for a specific product in the cart
  const getProductCartQty = (productId: number) => {
    const item = items.find((it) => it.product.id === productId)
    return item ? item.quantity : 0
  }

  // Count total cart items
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleAddProduct = (product: Product) => {
    addItem(product, cafeteria.id, cafeteria.name)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 relative">
      <Navbar />

      {/* Back Button & Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent pt-6 pb-4 px-4 md:px-8 border-b border-border/10">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link href="/cafeterias" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ChevronLeft className="w-4 h-4" />
            Volver a Cafeterías
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  {cafeteria.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] border border-primary/20">
                  Abierto
                </span>
              </div>
              <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
                {cafeteria.description || 'Deliciosas opciones de comida preparadas con amor dentro del campus.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {cafeteria.physical_location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  Entrega en 15 - 25 min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Search Segment */}
      <div className="sticky top-[64px] sm:top-[73px] z-30 w-full glass border-b border-border/40 py-3 px-3 sm:px-4 md:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Categories Tab Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
            <Button
              variant={activeCategory === 'todos' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full shrink-0 h-9 font-semibold text-xs"
              onClick={() => setActiveCategory('todos')}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="rounded-full shrink-0 h-9 font-semibold text-xs"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Inline search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar plato..."
              className="w-full bg-background/50 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-9 pr-4 py-1.5 text-xs outline-hidden transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Menu Display */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-4 md:px-8 py-6 sm:py-10 flex-1">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => {
              const cartQty = getProductCartQty(prod.id)
              return (
                <motion.div
                  key={prod.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                    <div className="h-36 sm:h-44 bg-muted relative flex items-center justify-center text-muted-foreground overflow-hidden">
                      {prod.image_url ? (
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      ) : (
                        <Coffee className="w-10 h-10 text-muted-foreground/30" />
                      )}
                      
                      {/* Promo Tag */}
                      {prod.is_promo && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-black text-[9px] uppercase tracking-wider shadow-md z-10 animate-pulse flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5 fill-current" />
                          Promo
                        </span>
                      )}
                      
                      {/* Price Tag */}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-background/80 dark:bg-card/85 backdrop-blur-md text-foreground font-black text-xs border border-border/40">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-display font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                          {prod.description || 'Deliciosa opción preparada al instante dentro del campus.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Disponible
                        </span>
                        
                        <div className="flex items-center">
                          {cartQty > 0 ? (
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full p-1 shadow-xs animate-in fade-in zoom-in-95 duration-200">
                              <button
                                onClick={() => updateQuantity(prod.id, cartQty - 1)}
                                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-primary shadow-xs hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black text-primary px-1.5 w-4 text-center">
                                {cartQty}
                              </span>
                              <button
                                onClick={() => handleAddProduct(prod)}
                                className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xs hover:bg-primary/95 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddProduct(prod)}
                              size="sm"
                              className="rounded-full shadow-xs text-xs font-bold gap-1 px-3.5 active:scale-95 hover:scale-105 transition-all duration-100"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              Agregar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Coffee className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Menú Vacío</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No encontramos productos disponibles en este momento que coincidan.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Cart checkout bar */}
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1, y: 100 }}
            className="fixed bottom-6 left-0 right-0 z-40 px-4 md:px-8 max-w-2xl mx-auto"
          >
            <div className="glass border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShoppingBag className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">
                    {cartItemsCount} {cartItemsCount === 1 ? 'Producto' : 'Productos'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    De: <strong className="text-foreground">{cafeteria.name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-semibold">Subtotal</p>
                  <p className="text-sm font-black text-primary">{formatCurrency(getTotal())}</p>
                </div>
                
                <Button 
                  onClick={toggleCart}
                  size="sm"
                  className="rounded-full shadow-lg font-bold gap-1 px-4 py-4"
                >
                  Ver Carrito
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
