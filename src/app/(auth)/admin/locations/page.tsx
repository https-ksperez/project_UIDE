'use client'

import React, { useState, useEffect } from 'react'
import LinkComponent from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeliveryLocation, LocationStatus } from '@/lib/types/database'
import { toast } from 'sonner'
import { Loader2, Shield, MapPin, Check, X, Plus } from 'lucide-react'

export default function AdminLocationsPage() {
  const supabase = createClient() as any
  
  const [locations, setLocations] = useState<DeliveryLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  
  // Creation States
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .order('status', { ascending: false }) // pending first, then approved/rejected
        .order('name', { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      console.error('Error fetching locations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleUpdateStatus = async (locId: number, nextStatus: LocationStatus) => {
    setUpdatingId(locId)
    try {
      const { error } = await supabase
        .from('delivery_locations')
        .update({ status: nextStatus })
        .eq('id', locId)

      if (error) throw error

      setLocations(locations.map((l) => l.id === locId ? { ...l, status: nextStatus } : l))
      toast.success(`Ubicación ${nextStatus === 'aprobado' ? 'aprobada' : 'rechazada'} con éxito.`)
    } catch (err: any) {
      console.error('Error updating location status:', err)
      toast.error('No se pudo actualizar el estado del punto de encuentro.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre de la ubicación es obligatorio.')
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          status: 'aprobado'
        })
        .select()
        .single()

      if (error) throw error

      setLocations([...locations, data])
      toast.success('¡Punto de entrega oficial creado exitosamente!')
      setName('')
      setDescription('')
    } catch (err: any) {
      console.error('Error creating location:', err)
      toast.error('No se pudo registrar la ubicación.')
    } finally {
      setIsCreating(false)
    }
  }

  // Segmenting
  const pendingLocations = locations.filter((l) => l.status === 'pendiente')
  const approvedLocations = locations.filter((l) => l.status === 'aprobado')

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
            <LinkComponent href="/admin/locations" className="px-4 py-2 border-b-2 border-primary text-xs font-bold text-primary">
              Puntos de Entrega
            </LinkComponent>
            <LinkComponent href="/admin/stats" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Estadísticas
            </LinkComponent>
          </div>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 grid md:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Create Location */}
        <div className="md:col-span-5">
          <Card className="rounded-2xl border-border/80 shadow-xs sticky top-28 glass">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <MapPin className="w-4.5 h-4.5 text-primary" />
                Registrar Punto Oficial
              </CardTitle>
              <CardDescription className="text-[10px]">Crea un nuevo punto de encuentro oficial dentro del campus UIDE.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateLocation} className="space-y-4 text-xs text-muted-foreground">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Nombre de la Ubicación</label>
                  <Input
                    type="text"
                    placeholder="Ej. Entrada Principal del Edificio C"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isCreating}
                    className="text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Detalles / Indicaciones (Opcional)</label>
                  <textarea
                    placeholder="Ej. En las mesas exteriores junto al hall central."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isCreating}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold shadow-md shadow-primary/10 text-xs"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Crear Punto Oficial
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Locations Review List */}
        <div className="md:col-span-7 space-y-6">
          {/* Pending Suggestions Segment */}
          {pendingLocations.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-extrabold text-lg text-amber-600 flex items-center gap-1.5">
                Sugerencias Pendientes
              </h2>
              <div className="space-y-4 text-xs">
                {pendingLocations.map((loc) => (
                  <Card key={loc.id} className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground text-sm leading-none">{loc.name}</h4>
                        <p className="text-muted-foreground text-[10px]">{loc.description || 'Sin detalles'}</p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          variant="glass"
                          size="sm"
                          className="w-7 h-7 p-0 rounded-full border-rose-500/25 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                          onClick={() => handleUpdateStatus(loc.id, 'rechazado')}
                          disabled={updatingId === loc.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="w-7 h-7 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                          onClick={() => handleUpdateStatus(loc.id, 'aprobado')}
                          disabled={updatingId === loc.id}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Approved Points Segment */}
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-1.5">
              Puntos Oficiales Aprobados
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : approvedLocations.length > 0 ? (
              <div className="space-y-4 text-xs">
                {approvedLocations.map((loc) => (
                  <Card key={loc.id} className="rounded-2xl border-border bg-card shadow-xs hover:border-primary/10 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 border border-border/40 shrink-0 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-foreground text-sm leading-none">{loc.name}</h4>
                          <p className="text-muted-foreground text-[10px] line-clamp-1">{loc.description || 'Sin indicaciones'}</p>
                        </div>
                      </div>

                      <Button
                        variant="glass"
                        size="sm"
                        className="rounded-full shrink-0 h-8 text-[10px] border-rose-500/25 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                        onClick={() => handleUpdateStatus(loc.id, 'rechazado')}
                        disabled={updatingId === loc.id}
                      >
                        Eliminar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No hay puntos oficiales aprobados en el campus todavía.
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
