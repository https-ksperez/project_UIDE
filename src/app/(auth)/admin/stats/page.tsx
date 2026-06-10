'use client'

import React, { useState, useEffect } from 'react'
import LinkComponent from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  Shield, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Bike, 
  MapPin, 
  Utensils, 
  Loader2,
  CheckCircle2,
  Store
} from 'lucide-react'

export default function AdminStatsPage() {
  const supabase = createClient() as any
  
  const [stats, setStats] = useState({
    totalOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalRevenue: 0,
    totalDeliveriesRevenue: 0,
    activeRidersCount: 0,
    activeCafeteriasCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Fetch total orders
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        // 2. Fetch delivered orders
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('total_amount, delivery_fee')
          .eq('status', 'entregado')

        // 3. Fetch active riders
        const { count: activeRiders } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'repartidor')
          .eq('is_available_for_delivery', true)

        // 4. Fetch active cafeterias
        const { count: activeCafeterias } = await supabase
          .from('cafeterias')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const totalOrdersCount = totalOrders || 0
        const deliveredOrdersCount = deliveredOrders?.length || 0
        const totalRevenue = (deliveredOrders as any[])?.reduce((sum, o) => sum + (o.total_amount - o.delivery_fee), 0) || 0
        const totalDeliveriesRevenue = (deliveredOrders as any[])?.reduce((sum, o) => sum + o.delivery_fee, 0) || 0

        setStats({
          totalOrdersCount,
          deliveredOrdersCount,
          totalRevenue,
          totalDeliveriesRevenue,
          activeRidersCount: activeRiders || 0,
          activeCafeteriasCount: activeCafeterias || 0
        })
      } catch (err) {
        console.error('Error fetching admin stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      {/* Admin Nav Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              Consola de Administración
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Control total del ecosistema de delivery de la UIDE
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 border-b border-border/40 pb-1.5 overflow-x-auto no-scrollbar">
            <LinkComponent href="/admin/users" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Usuarios
            </LinkComponent>
            <LinkComponent href="/admin/cafeterias" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Cafeterías
            </LinkComponent>
            <LinkComponent href="/admin/locations" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Puntos de Entrega
            </LinkComponent>
            <LinkComponent href="/admin/stats" className="px-4 py-2 border-b-2 border-primary text-xs font-bold text-primary">
              Estadísticas
            </LinkComponent>
          </div>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Cargando métricas...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Revenue */}
              <Card className="rounded-2xl border-border bg-card shadow-xs">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Ventas Totales</span>
                  <DollarSign className="w-4.5 h-4.5 text-primary" />
                </CardHeader>
                <CardContent className="pt-1">
                  <h3 className="text-2xl font-black text-foreground">{formatCurrency(stats.totalRevenue)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Ingresos acumulados en cafeterías</p>
                </CardContent>
              </Card>

              {/* Volume */}
              <Card className="rounded-2xl border-border bg-card shadow-xs">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Órdenes</span>
                  <ShoppingBag className="w-4.5 h-4.5 text-primary" />
                </CardHeader>
                <CardContent className="pt-1">
                  <h3 className="text-2xl font-black text-foreground">{stats.totalOrdersCount}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">{stats.deliveredOrdersCount} órdenes completadas exitosamente</p>
                </CardContent>
              </Card>

              {/* Delivery earnings */}
              <Card className="rounded-2xl border-border bg-card shadow-xs">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Fondos Envío</span>
                  <Bike className="w-4.5 h-4.5 text-primary" />
                </CardHeader>
                <CardContent className="pt-1">
                  <h3 className="text-2xl font-black text-primary">{formatCurrency(stats.totalDeliveriesRevenue)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Total recaudado por tarifa de envío ($1.00)</p>
                </CardContent>
              </Card>

              {/* Flota */}
              <Card className="rounded-2xl border-border bg-card shadow-xs">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Repartidores</span>
                  <Bike className="w-4.5 h-4.5 text-primary" />
                </CardHeader>
                <CardContent className="pt-1">
                  <h3 className="text-2xl font-black text-foreground">{stats.activeRidersCount}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">repartidores activos en turno el día de hoy</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Analytics charts block placeholders */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Cafeterias summary */}
              <Card className="rounded-2xl border-border bg-card shadow-xs">
                <CardHeader className="border-b border-border/30 pb-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <Store className="w-4.5 h-4.5 text-primary" />
                    Resumen del Ecosistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-xs">
                  <div className="flex justify-between items-center py-2.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">Cafeterías Registradas</span>
                    <span className="font-extrabold text-foreground">{stats.activeCafeteriasCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">Promedio Ventas por Orden</span>
                    <span className="font-extrabold text-foreground">
                      {stats.deliveredOrdersCount > 0 ? formatCurrency(stats.totalRevenue / stats.deliveredOrdersCount) : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-muted-foreground font-semibold">Tasa de Efectividad Entrega</span>
                    <span className="font-extrabold text-primary">
                      {stats.totalOrdersCount > 0 ? `${((stats.deliveredOrdersCount / stats.totalOrdersCount) * 100).toFixed(1)}%` : '100%'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Info panel */}
              <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs p-6 flex flex-col justify-center space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-foreground">Optimización del Campus</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Las estadísticas reflejan transacciones e ingresos reales validados por las transferencias. Un mayor número de repartidores en turno disminuye el tiempo de entrega promedio a menos de 15 minutos en horas pico.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
