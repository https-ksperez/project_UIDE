'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Loader2, 
  Save, 
  FileText,
  BadgeAlert
} from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient() as any
  const { profile, session, setProfile } = useAuthStore()
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form fields
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName.trim()) {
      toast.error('El nombre no puede estar vacío.')
      return
    }

    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null
        })
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('¡Perfil actualizado con éxito!')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      toast.error('No se pudo guardar la información.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-primary" />
            Mi Perfil
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Administra tus datos personales y verifica tus credenciales institucionales
          </p>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        <Card className="rounded-2xl border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-black">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {profile?.full_name || 'Comunidad UIDE'}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  Cuenta Activa • Rol: {profile?.role ? profile.role.toUpperCase() : 'ESTUDIANTE'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full name */}
                <div className="space-y-2">
                  <label htmlFor="full-name" className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    Nombre Completo
                  </label>
                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    required
                    disabled={isSaving}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary" />
                    Teléfono Celular
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 0998877665"
                    disabled={isSaving}
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    Correo Institucional
                  </label>
                  <Input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="bg-muted text-muted-foreground border-border/40 select-none"
                  />
                </div>

                {/* Cedula (Readonly) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Cédula / Pasaporte
                  </label>
                  <Input
                    type="text"
                    value={profile?.cedula || 'No registrada'}
                    disabled
                    className="bg-muted text-muted-foreground border-border/40 select-none"
                  />
                </div>
              </div>

              {/* Info Domain Box */}
              <div className="flex gap-3 p-4 bg-muted/40 border border-border/60 rounded-xl text-xs text-muted-foreground leading-relaxed">
                <BadgeAlert className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                <p>
                  Tu dirección de correo electrónico institucional y tu cédula son de solo lectura porque están vinculados a tu registro oficial de admisión en la base de datos de la UIDE. Si necesitas cambiarlos, por favor escribe al soporte técnico del campus.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto font-bold shadow-md shadow-primary/10 gap-1.5 px-6"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
