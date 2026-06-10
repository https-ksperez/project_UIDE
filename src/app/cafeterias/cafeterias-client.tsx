'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Cafeteria } from '@/lib/types/database'
import { Search, MapPin, Coffee, Utensils, Star, Sparkles, ChevronRight } from 'lucide-react'

interface CafeteriasClientProps {
  initialCafeterias: Cafeteria[]
}

export default function CafeteriasClient({ initialCafeterias }: CafeteriasClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter cafeterias based on search query
  const filteredCafeterias = initialCafeterias.filter((caf) =>
    caf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (caf.description && caf.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    caf.physical_location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as any } },
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-primary/5 via-transparent to-transparent py-8 sm:py-12 px-3 sm:px-4 md:px-8 border-b border-border/20">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gastronomía en el Campus
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-5xl font-black text-foreground tracking-tight"
          >
            Nuestras Cafeterías
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto"
          >
            Explora las opciones de comida disponibles en el campus. Realiza tu pedido y recíbelo en cualquiera de nuestros puntos de encuentro autorizados.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto relative pt-4"
          >
            <Search className="absolute left-3.5 top-7.5 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cafetería, platos, ubicación..."
              className="pl-11 pr-4 py-6 bg-card/65 border-border/80 focus-visible:ring-primary shadow-xs rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 md:px-8 py-8 sm:py-12">
        {filteredCafeterias.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          >
            {filteredCafeterias.map((caf) => (
              <motion.div key={caf.id} variants={cardVariants}>
                <Link href={`/cafeterias/${caf.id}`}>
                  <Card className="group overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-primary/30 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col cursor-pointer">
                    {/* Header Image Solid Color */}
                    <div className="h-36 sm:h-44 bg-primary relative flex items-center justify-center text-white/90">
                      {caf.logo_url ? (
                        <img 
                          src={caf.logo_url} 
                          alt={caf.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Coffee className="w-12 h-12 mx-auto text-white/40 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="font-display font-black text-2xl tracking-widest text-white/40 block">UIDE</span>
                        </div>
                      )}
                      
                      {/* Active Status Badge */}
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[10px] border border-white/20 shadow-xs">
                        Abierto
                      </span>
                    </div>

                    <CardContent className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Cafetería del Campus</span>
                        </div>
                        <h3 className="font-display font-extrabold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {caf.name}
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                          {caf.description || 'Disfruta de una deliciosa variedad de comidas, snacks, bebidas y postres con entrega segura en tu punto favorito.'}
                        </p>
                      </div>

                      <div className="pt-5 mt-5 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[70%]">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{caf.physical_location}</span>
                        </div>
                        <span className="text-xs font-bold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                          Pedir
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">No encontramos cafeterías</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                No encontramos ninguna cafetería activa que coincida con tu búsqueda. Intenta con otros términos.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Restablecer búsqueda
            </Button>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 md:px-8 text-center text-xs text-muted-foreground bg-muted/10 mt-auto">
        <p>© {new Date().getFullYear()} Universidad Internacional del Ecuador. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
