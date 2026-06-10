'use client'

import React, { useState } from 'react'
import LinkComponent from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Cafeteria } from '@/lib/types/database'
import { toast } from 'sonner'
import { Loader2, Shield, Store, ToggleLeft, ToggleRight, Plus, Save, MapPin, Pencil } from 'lucide-react'

interface AdminCafeteriasClientProps {
  initialCafeterias: Cafeteria[]
  cafeteriaOwners: { id: string; full_name: string | null }[]
}

export default function AdminCafeteriasClient({
  initialCafeterias,
  cafeteriaOwners,
}: AdminCafeteriasClientProps) {
  const supabase = createClient() as any
  
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>(initialCafeterias)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  
  // Create Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [selectedOwner, setSelectedOwner] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Edit Form states
  const [editingCafeteriaId, setEditingCafeteriaId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editOwner, setEditOwner] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const handleToggleActive = async (cafId: number, currentStatus: boolean) => {
    setUpdatingId(cafId)
    const nextStatus = !currentStatus

    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({ is_active: nextStatus } as any)
        .eq('id', cafId)

      if (error) throw error

      setCafeterias(cafeterias.map((c) => c.id === cafId ? { ...c, is_active: nextStatus } : c))
      toast.success(nextStatus ? 'Cafetería activada y visible.' : 'Cafetería desactivada con éxito.')
    } catch (err: any) {
      console.error('Error toggling active:', err)
      toast.error('No se pudo modificar el estado de la cafetería.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateCafeteria = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !location.trim() || !selectedOwner) {
      toast.error('Nombre, ubicación y administrador son campos obligatorios.')
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          physical_location: location.trim(),
          owner_id: selectedOwner,
          is_active: true
        } as any)
        .select()
        .single()

      if (error) throw error

      setCafeterias([...cafeterias, data])
      toast.success('¡Cafetería creada e inicializada exitosamente!')
      
      // Clear form
      setName('')
      setDescription('')
      setLocation('')
      setSelectedOwner('')
    } catch (err: any) {
      console.error('Error creating cafeteria:', err)
      toast.error('No se pudo registrar la cafetería.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartEdit = (caf: Cafeteria) => {
    if (editingCafeteriaId === caf.id) {
      setEditingCafeteriaId(null)
      return
    }
    setEditingCafeteriaId(caf.id)
    setEditName(caf.name)
    setEditDescription(caf.description || '')
    setEditLocation(caf.physical_location)
    setEditOwner(caf.owner_id || '')
  }

  const handleUpdateCafeteria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCafeteriaId) return

    if (!editName.trim() || !editLocation.trim() || !editOwner) {
      toast.error('Nombre, ubicación y administrador son campos obligatorios.')
      return
    }

    setIsSavingEdit(true)

    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          physical_location: editLocation.trim(),
          owner_id: editOwner
        } as any)
        .eq('id', editingCafeteriaId)

      if (error) throw error

      setCafeterias(cafeterias.map((c) => 
        c.id === editingCafeteriaId 
          ? { 
              ...c, 
              name: editName.trim(), 
              description: editDescription.trim() || null, 
              physical_location: editLocation.trim(), 
              owner_id: editOwner 
            } 
          : c
      ))
      
      toast.success('¡Cafetería actualizada correctamente!')
      setEditingCafeteriaId(null)
    } catch (err: any) {
      console.error('Error updating cafeteria:', err)
      toast.error('No se pudo actualizar la cafetería.')
    } finally {
      setIsSavingEdit(false)
    }
  }

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
            <LinkComponent href="/admin/cafeterias" className="px-4 py-2 border-b-2 border-primary text-xs font-bold text-primary">
              Cafeterías
            </LinkComponent>
            <LinkComponent href="/admin/locations" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Puntos de Entrega
            </LinkComponent>
            <LinkComponent href="/admin/stats" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Estadísticas
            </LinkComponent>
          </div>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 grid md:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Create Cafeteria Form */}
        <div className="md:col-span-5">
          <Card className="rounded-2xl border-border/80 shadow-xs sticky top-28 glass">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <Store className="w-4.5 h-4.5 text-primary" />
                Registrar Cafetería
              </CardTitle>
              <CardDescription className="text-[10px]">Crea una nueva cafetería en el campus y asígnale un administrador de local.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateCafeteria} className="space-y-4 text-xs text-muted-foreground">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Nombre de la Cafetería</label>
                  <Input
                    type="text"
                    placeholder="Ej. Sports Club UIDE"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isCreating}
                    className="text-foreground"
                  />
                </div>

                {/* Owner */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Administrador Propietario</label>
                  <select
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    required
                    disabled={isCreating}
                    className="w-full bg-background border border-input rounded-xl px-3 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                  >
                    <option value="">Seleccionar propietario...</option>
                    {cafeteriaOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.full_name || 'Comunidad UIDE'} ({owner.id.slice(0, 6)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Ubicación Física</label>
                  <Input
                    type="text"
                    placeholder="Ej. Frente a canchas de tenis"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={isCreating}
                    className="text-foreground"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Descripción (Opcional)</label>
                  <textarea
                    placeholder="Ej. Deliciosas hamburguesas, wraps, ensaladas y batidos."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
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
                      Crear Cafetería
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Cafeterias List */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-1.5">
              <Store className="w-5 h-5 text-primary" />
              Locales Registrados
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {cafeterias.length}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {cafeterias.map((caf) => (
              <Card key={caf.id} className="rounded-2xl border-border bg-card shadow-xs hover:border-primary/10 transition-colors overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border/40 shrink-0 flex items-center justify-center">
                        <Store className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground text-sm leading-none">{caf.name}</h4>
                        <p className="text-muted-foreground text-[10px] line-clamp-1">{caf.description || 'Sin descripción'}</p>
                        <p className="text-[10px] text-primary flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{caf.physical_location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 hover:bg-muted"
                        onClick={() => handleStartEdit(caf)}
                        disabled={updatingId === caf.id}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>

                      <span className={`text-[10px] font-bold ${caf.is_active ? 'text-primary' : 'text-muted-foreground'}`}>
                        {caf.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(caf.id, caf.is_active)}
                        disabled={updatingId === caf.id || editingCafeteriaId === caf.id}
                        className="text-primary hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                      >
                        {caf.is_active ? (
                          <ToggleRight className="w-9 h-9" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  <AnimatePresence>
                    {editingCafeteriaId === caf.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-border/40 space-y-4"
                      >
                        <form onSubmit={handleUpdateCafeteria} className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="font-bold text-foreground/80">Nombre</label>
                              <Input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                                className="h-9 text-xs text-foreground"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="font-bold text-foreground/80">Administrador</label>
                              <select
                                value={editOwner}
                                onChange={(e) => setEditOwner(e.target.value)}
                                required
                                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground h-9"
                              >
                                <option value="">Seleccionar propietario...</option>
                                {cafeteriaOwners.map((owner) => (
                                  <option key={owner.id} value={owner.id}>
                                    {owner.full_name || 'Comunidad UIDE'} ({owner.id.slice(0, 6)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-foreground/80">Ubicación Física</label>
                            <Input
                              type="text"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              required
                              className="h-9 text-xs text-foreground"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold text-foreground/80">Descripción</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl px-4 h-9 font-semibold text-xs"
                              onClick={() => setEditingCafeteriaId(null)}
                              disabled={isSavingEdit}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              className="rounded-xl px-4 h-9 font-bold text-xs"
                              disabled={isSavingEdit}
                            >
                              {isSavingEdit ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5 mr-1.5" />
                                  Guardar Cambios
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
