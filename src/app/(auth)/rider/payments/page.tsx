'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiderPayment } from '@/lib/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, DollarSign, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

export default function RiderPaymentsPage() {
  const supabase = createClient() as any
  const { session } = useAuthStore()
  
  const [payments, setPayments] = useState<RiderPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      if (!session?.user?.id) return
      try {
        const { data, error } = await supabase
          .from('rider_payments')
          .select('*')
          .eq('rider_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPayments(data || [])
      } catch (err) {
        console.error('Error fetching payments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [session, supabase])

  // Aggregate sums
  const totalEarned = payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0)
  const pendingEarned = payments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-primary" />
              Mis Ganancias
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Registro histórico de tus pagos y entregas acumuladas por semana
            </p>
          </div>
          <Link href="/rider/dashboard">
            <Button variant="outline" size="sm" className="rounded-full shadow-xs gap-1 font-semibold border-border/60">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 md:px-8 py-10 grid md:grid-cols-12 gap-8 flex-1">
        {/* Earnings Stats Cards */}
        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-2xl border-emerald-500/10 bg-emerald-500/5 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-muted-foreground font-semibold">Total Cobrado</CardDescription>
              <CardTitle className="text-3xl font-black text-primary leading-none">
                {formatCurrency(totalEarned)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Transferido exitosamente a tu cuenta</span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-500/10 bg-amber-500/5 shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-muted-foreground font-semibold">Pendiente de Liquidar</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-600 leading-none">
                {formatCurrency(pendingEarned)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Se procesa en la liquidación semanal</span>
            </CardContent>
          </Card>
        </div>

        {/* Payments History Table */}
        <div className="md:col-span-8">
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-base font-bold text-foreground">Historial de Liquidaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Cargando reporte...</span>
                </div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 border-b border-border/30 text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      <tr>
                        <th className="p-4">Semana</th>
                        <th className="p-4">Monto</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Pagado El</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            {formatDate(pay.week_start).split(',')[0]} - {formatDate(pay.week_end).split(',')[0]}
                          </td>
                          <td className="p-4 font-black text-primary text-sm">{formatCurrency(pay.amount)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              pay.paid 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}>
                              {pay.paid ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {pay.paid_at ? formatDate(pay.paid_at) : 'En espera'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
                  <DollarSign className="w-8 h-8 mx-auto text-muted-foreground/30" />
                  <p>Aún no posees liquidaciones de reparto registradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
