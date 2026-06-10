'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Profile, UserRole, RiderApprovalStatus } from '@/lib/types/database'
import { toast } from 'sonner'
import { Loader2, Users, Shield, ShieldCheck, Check, X, FileText, Search } from 'lucide-react'

interface AdminUsersClientProps {
  initialProfiles: Profile[]
}

export default function AdminUsersClient({ initialProfiles }: AdminUsersClientProps) {
  const supabase = createClient() as any
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter((p) =>
    (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setProfiles(profiles.map((p) => p.id === userId ? { ...p, role: newRole } : p))
      toast.success('Rol de usuario actualizado con éxito.')
    } catch (err: any) {
      console.error('Error updating role:', err)
      toast.error('No se pudo actualizar el rol.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRiderApproval = async (userId: string, newStatus: RiderApprovalStatus) => {
    setUpdatingId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ rider_approval: newStatus })
        .eq('id', userId)

      if (error) throw error

      setProfiles(profiles.map((p) => p.id === userId ? { ...p, rider_approval: newStatus } : p))
      toast.success(`repartidor ${newStatus === 'aprobado' ? 'aprobado' : 'rechazado'} con éxito.`)
    } catch (err: any) {
      console.error('Error approving rider:', err)
      toast.error('No se pudo actualizar el estado de aprobación del repartidor.')
    } finally {
      setUpdatingId(null)
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
            <Link href="/admin/users" className="px-4 py-2 border-b-2 border-primary text-xs font-bold text-primary">
              Usuarios
            </Link>
            <Link href="/admin/cafeterias" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Cafeterías
            </Link>
            <Link href="/admin/locations" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Puntos de Entrega
            </Link>
            <Link href="/admin/stats" className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Estadísticas
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-5xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <div>
              <CardTitle className="text-base font-bold text-foreground">Gestión de Usuarios</CardTitle>
              <CardDescription className="text-xs">Modifica roles o aprueba licencias de conducir para la flota de repartidores.</CardDescription>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full bg-background border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-9 pr-4 py-1.5 text-xs outline-hidden"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredProfiles.length > 0 ? (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 border-b border-border/30 text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                    <tr>
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Rol Actual</th>
                      <th className="p-4">Repartidor?</th>
                      <th className="p-4">Teléfono</th>
                      <th className="p-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredProfiles.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{user.full_name || 'Sin Nombre'}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={updatingId === user.id}
                            className="bg-background border border-input rounded-lg p-1 font-bold text-xs"
                          >
                            <option value="estudiante">Estudiante</option>
                            <option value="repartidor">Repartidor</option>
                            <option value="cafeteria">Cafetería</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {user.role === 'repartidor' ? (
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                user.rider_approval === 'aprobado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                user.rider_approval === 'rechazado' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {user.rider_approval.toUpperCase()}
                              </span>
                              {user.driver_license_url && (
                                <a 
                                  href={user.driver_license_url} 
                                  target="_blank" 
                                  className="block text-[9px] text-primary hover:underline font-bold"
                                >
                                  Licencia
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">{user.phone || 'Sin registrar'}</td>
                        <td className="p-4">
                          {user.role === 'repartidor' && user.rider_approval === 'pendiente' && (
                            <div className="flex gap-1.5">
                              <Button
                                variant="glass"
                                size="sm"
                                className="w-7 h-7 p-0 rounded-full border-rose-500/25 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                onClick={() => handleRiderApproval(user.id, 'rechazado')}
                                disabled={updatingId === user.id}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                className="w-7 h-7 p-0 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                                onClick={() => handleRiderApproval(user.id, 'aprobado')}
                                disabled={updatingId === user.id}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-muted-foreground">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                No hay usuarios que coincidan con la búsqueda.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
