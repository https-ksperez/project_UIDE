'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Save, Building, CreditCard, User, AlertCircle, Image as ImageIcon, MapPin, Upload, Settings, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CafeteriaBankAccount } from '@/lib/types/database'

const supabase = createClient() as any

export default function CafeteriaSettingsPage() {
  const { session } = useAuthStore()

  const [cafeteriaId, setCafeteriaId] = useState<number | null>(null)
  
  // Cafeteria Profile State
  const [cafeteriaName, setCafeteriaName] = useState('')
  const [cafeteriaDescription, setCafeteriaDescription] = useState('')
  const [cafeteriaLocation, setCafeteriaLocation] = useState('')
  const [cafeteriaLogoUrl, setCafeteriaLogoUrl] = useState('')

  // Bank details List State
  const [bankAccounts, setBankAccounts] = useState<CafeteriaBankAccount[]>([])
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [editingBankAccount, setEditingBankAccount] = useState<CafeteriaBankAccount | null>(null)
  const [deletingBankId, setDeletingBankId] = useState<number | null>(null)

  // Bank details Form State (for modal)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState('ahorros')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const fetchCafeteriaAndBankDetails = async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }
    try {
      // 1. Fetch cafeteria owned by this user
      const { data: cafData, error: cafErr } = await supabase
        .from('cafeterias')
        .select('id, name, description, physical_location, logo_url')
        .eq('owner_id', session.user.id)
        .single()

      if (cafErr || !cafData) throw cafErr || new Error('No se encontró tu cafetería.')
      setCafeteriaId(cafData.id)
      setCafeteriaName(cafData.name || '')
      setCafeteriaDescription(cafData.description || '')
      setCafeteriaLocation(cafData.physical_location || '')
      setCafeteriaLogoUrl(cafData.logo_url || '')

      // 2. Fetch existing bank accounts
      const { data: bankData, error: bankErr } = await supabase
        .from('cafeteria_bank_accounts')
        .select('*')
        .eq('cafeteria_id', cafData.id)
        .order('is_primary', { ascending: false }) // Primary account first

      if (bankErr) throw bankErr
      setBankAccounts(bankData || [])
    } catch (err: any) {
      console.error('Error fetching details:', err)
      toast.error('Error al cargar la información de la cafetería.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCafeteriaAndBankDetails()
  }, [session])

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen de logotipo no debe superar los 2MB.')
      return
    }

    setIsUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${cafeteriaId || 'caf'}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('cafeteria-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('cafeteria-assets')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        setCafeteriaLogoUrl(data.publicUrl)
        toast.success('¡Logotipo subido con éxito!')
      }
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      toast.error('No se pudo subir la imagen.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cafeteriaId) return
    if (!cafeteriaName.trim()) {
      toast.error('El nombre de la cafetería es obligatorio.')
      return
    }

    setIsSavingProfile(true)

    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({
          name: cafeteriaName.trim(),
          description: cafeteriaDescription.trim(),
          physical_location: cafeteriaLocation.trim(),
          logo_url: cafeteriaLogoUrl.trim() || null,
        })
        .eq('id', cafeteriaId)

      if (error) throw error
      toast.success('¡Perfil de la cafetería guardado con éxito!')
    } catch (err: any) {
      console.error('Error saving cafeteria profile:', err)
      toast.error('No se pudo guardar el perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleOpenAddBankModal = () => {
    setEditingBankAccount(null)
    setBankName('')
    setAccountNumber('')
    setAccountType('ahorros')
    setAccountHolderName('')
    setIsPrimary(bankAccounts.length === 0)
    setIsBankModalOpen(true)
  }

  const handleOpenEditBankModal = (account: CafeteriaBankAccount) => {
    setEditingBankAccount(account)
    setBankName(account.bank_name)
    setAccountNumber(account.account_number)
    setAccountType(account.account_type)
    setAccountHolderName(account.account_holder_name)
    setIsPrimary(account.is_primary)
    setIsBankModalOpen(true)
  }

  const handleSetPrimaryAccount = async (accountId: number) => {
    if (!cafeteriaId) return
    try {
      // 1. Reset all to false
      const { error: resetErr } = await supabase
        .from('cafeteria_bank_accounts')
        .update({ is_primary: false })
        .eq('cafeteria_id', cafeteriaId)
      if (resetErr) throw resetErr

      // 2. Set this one to true
      const { error: setErr } = await supabase
        .from('cafeteria_bank_accounts')
        .update({ is_primary: true })
        .eq('id', accountId)
      if (setErr) throw setErr

      toast.success('Cuenta configurada como principal.')
      fetchCafeteriaAndBankDetails()
    } catch (err) {
      console.error('Error setting primary bank account:', err)
      toast.error('No se pudo establecer la cuenta como principal.')
    }
  }

  const handleDeleteBankAccount = async (accountId: number, isAccPrimary: boolean) => {
    if (isAccPrimary && bankAccounts.length > 1) {
      toast.error('Debes establecer otra cuenta como principal antes de eliminar esta.')
      return
    }
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta bancaria?')) return

    setDeletingBankId(accountId)
    try {
      const { error } = await supabase
        .from('cafeteria_bank_accounts')
        .delete()
        .eq('id', accountId)
      if (error) throw error
      toast.success('Cuenta bancaria eliminada.')
      fetchCafeteriaAndBankDetails()
    } catch (err) {
      console.error('Error deleting bank account:', err)
      toast.error('No se pudo eliminar la cuenta bancaria.')
    } finally {
      setDeletingBankId(null)
    }
  }

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cafeteriaId) return
    if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      toast.error('Todos los campos bancarios son obligatorios.')
      return
    }

    setIsSavingBank(true)
    try {
      // If this is the first account, it must be primary
      const shouldBePrimary = isPrimary || bankAccounts.length === 0

      if (shouldBePrimary) {
        // Reset all others to false
        await supabase
          .from('cafeteria_bank_accounts')
          .update({ is_primary: false })
          .eq('cafeteria_id', cafeteriaId)
      }

      if (editingBankAccount) {
        const { error } = await supabase
          .from('cafeteria_bank_accounts')
          .update({
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            account_type: accountType,
            account_holder_name: accountHolderName.trim(),
            is_primary: shouldBePrimary
          })
          .eq('id', editingBankAccount.id)
        if (error) throw error
        toast.success('Cuenta bancaria actualizada con éxito.')
      } else {
        const { error } = await supabase
          .from('cafeteria_bank_accounts')
          .insert({
            cafeteria_id: cafeteriaId,
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            account_type: accountType,
            account_holder_name: accountHolderName.trim(),
            is_primary: shouldBePrimary
          })
        if (error) throw error
        toast.success('Cuenta bancaria agregada con éxito.')
      }

      setIsBankModalOpen(false)
      fetchCafeteriaAndBankDetails()
    } catch (err: any) {
      console.error('Error saving bank account:', err)
      toast.error('No se pudo guardar la cuenta bancaria.')
    } finally {
      setIsSavingBank(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Settings className="w-7 h-7 text-primary" />
              Configuración de Cafetería
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Edita tu información pública, horarios de atención, logo oficial y datos de cobro
            </p>
          </div>
          <Link href="/cafeteria/dashboard">
            <Button variant="outline" size="sm" className="rounded-full shadow-xs gap-1 font-semibold border-border/60">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 md:px-8 py-10 flex-1 space-y-8">
        {isLoading ? (
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardContent className="flex flex-col items-center justify-center py-20 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Cargando datos de la cafetería...</span>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Card 1: Cafeteria Profile Settings */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-border/30">
                <CardTitle className="text-base font-bold text-foreground">Perfil Público</CardTitle>
                <CardDescription className="text-xs">
                  Esta información se mostrará a los estudiantes en el listado y detalle de la cafetería.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5 text-xs text-muted-foreground">
                    
                    {/* Cafeteria Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-primary" />
                        Nombre Comercial
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej. Pabellón D Express"
                        value={cafeteriaName}
                        onChange={(e) => setCafeteriaName(e.target.value)}
                        required
                        disabled={isSavingProfile}
                        className="text-foreground"
                      />
                    </div>

                    {/* Physical Location */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        Ubicación Física en Campus
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej. Pabellón D, Planta Baja junto a Admisiones"
                        value={cafeteriaLocation}
                        onChange={(e) => setCafeteriaLocation(e.target.value)}
                        required
                        disabled={isSavingProfile}
                        className="text-foreground"
                      />
                    </div>

                    {/* Description & Hours */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" />
                        Descripción y Horarios
                      </label>
                      <textarea
                        placeholder="Describe tu especialidad y tus horarios de atención (ej. Almuerzos diarios, sánduches y batidos. Abierto de Lunes a Viernes de 07:00 a 18:00)"
                        value={cafeteriaDescription}
                        onChange={(e) => setCafeteriaDescription(e.target.value)}
                        rows={3}
                        disabled={isSavingProfile}
                        className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                      />
                    </div>

                    {/* Logo/Image Upload & URL */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        Logotipo / Imagen de Cafetería
                      </label>
                      
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Logo Preview */}
                        <div className="w-20 h-20 rounded-2xl bg-muted border border-border/40 shrink-0 flex items-center justify-center overflow-hidden">
                          {cafeteriaLogoUrl ? (
                            <img src={cafeteriaLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-7 h-7 text-muted-foreground/30" />
                          )}
                        </div>

                         {/* File Upload Input */}
                         <div className="flex-1 w-full space-y-2 flex flex-col justify-center">
                           <label className="shrink-0 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 hover:bg-muted text-xs font-bold cursor-pointer transition-colors active:scale-95 w-full sm:w-auto self-start">
                             {isUploadingLogo ? (
                               <Loader2 className="w-4 h-4 animate-spin text-primary" />
                             ) : (
                               <Upload className="w-4 h-4 text-primary" />
                             )}
                             {cafeteriaLogoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                             <input
                               type="file"
                               accept="image/*"
                               onChange={handleUploadLogo}
                               disabled={isUploadingLogo || isSavingProfile}
                               className="hidden"
                             />
                           </label>
                           <span className="text-[10px] text-muted-foreground">
                             Formatos soportados: PNG, JPG, WEBP. Límite de tamaño: 2MB.
                           </span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto font-bold shadow-md shadow-primary/10 gap-1.5 px-6"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Perfil
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Card 2: Bank Settings */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Cuentas de Cobro (Detalles de Transferencia)</CardTitle>
                  <CardDescription className="text-xs">
                    Los estudiantes verán la cuenta marcada como Principal durante el checkout para transferir su pago.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenAddBankModal}
                  className="rounded-full gap-1.5 font-bold text-xs self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Cuenta
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {bankAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {bankAccounts.map((acc) => (
                      <div key={acc.id} className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-primary shrink-0" />
                              {acc.bank_name}
                            </span>
                            {acc.is_primary && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black border border-primary/20 uppercase tracking-wider">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                              Tipo: <strong className="text-foreground capitalize">{acc.account_type}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                              Número: <strong className="text-foreground">{acc.account_number}</strong>
                            </span>
                            <span className="flex items-center gap-1 sm:col-span-2">
                              <User className="w-3.5 h-3.5 text-primary shrink-0" />
                              Titular: <strong className="text-foreground">{acc.account_holder_name}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {!acc.is_primary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetPrimaryAccount(acc.id)}
                              className="rounded-full text-[10px] font-bold border-border/60 hover:bg-muted py-1 px-3 h-7"
                            >
                              Hacer Principal
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenEditBankModal(acc)}
                            className="h-8 w-8 rounded-full border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Editar cuenta"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deletingBankId === acc.id}
                            onClick={() => handleDeleteBankAccount(acc.id, acc.is_primary)}
                            className="h-8 w-8 rounded-full text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                            title="Eliminar cuenta"
                          >
                            {deletingBankId === acc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-3 text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs">No tienes cuentas bancarias registradas. Agrega una cuenta para empezar a recibir transferencias.</p>
                  </div>
                )}

                <div className="flex gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-700 items-start">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    Por favor, asegúrate de ingresar los datos correctos en tus cuentas. Si el número o banco es erróneo, los estudiantes no podrán concretar sus transferencias y tus pedidos no podrán procesarse.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modal Cuentas Bancarias */}
      <AnimatePresence>
        {isBankModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsBankModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-border/40 mb-4">
                <h3 className="font-display font-black text-base text-foreground flex items-center gap-1.5">
                  <Building className="w-5 h-5 text-primary" />
                  {editingBankAccount ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground"
                  onClick={() => setIsBankModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSaveBankAccount} className="space-y-4 text-xs">
                
                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Nombre del Banco</label>
                  <Input
                    type="text"
                    placeholder="Ej. Banco Pichincha"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    disabled={isSavingBank}
                    className="text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Account Type */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground/80">Tipo de Cuenta</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      required
                      disabled={isSavingBank}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                    >
                      <option value="ahorros">Ahorros</option>
                      <option value="corriente">Corriente</option>
                    </select>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground/80">Número de Cuenta</label>
                    <Input
                      type="text"
                      placeholder="Ej. 2200384729"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      disabled={isSavingBank}
                      className="text-foreground text-xs"
                    />
                  </div>
                </div>

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Titular de la Cuenta (Beneficiario)</label>
                  <Input
                    type="text"
                    placeholder="Ej. Cafetería Pabellón D S.A."
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    required
                    disabled={isSavingBank}
                    className="text-foreground text-xs"
                  />
                </div>

                {/* Primary switch */}
                {(!editingBankAccount || !editingBankAccount.is_primary) && bankAccounts.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      disabled={isSavingBank}
                      className="w-4 h-4 rounded-sm border-input text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <span className="font-bold text-foreground/80">Establecer como cuenta Principal</span>
                  </label>
                )}

                {/* Buttons */}
                <div className="pt-4 flex gap-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-full font-bold border-border/60 text-xs py-5"
                    onClick={() => setIsBankModalOpen(false)}
                    disabled={isSavingBank}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-full font-bold text-xs py-5"
                    disabled={isSavingBank}
                  >
                    {isSavingBank ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {editingBankAccount ? 'Guardar Cambios' : 'Agregar Cuenta'}
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
