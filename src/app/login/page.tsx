'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Mail, 
  Lock, 
  User, 
  CreditCard, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Register state fields
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cedula, setCedula] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [allowedDomains, setAllowedDomains] = useState<string[]>([
    'uide.edu.ec',
    'epn.edu.ec',
    'outlook.com'
  ])
  
  const supabase = createClient() as any

  useEffect(() => {
    const fetchAllowedDomains = async () => {
      try {
        const { data, error: domainErr } = await supabase
          .from('allowed_email_domains')
          .select('domain')
        
        if (!domainErr && data && data.length > 0) {
          const domainsList = data.map((d: any) => d.domain.trim().toLowerCase())
          setAllowedDomains(Array.from(new Set(domainsList)))
        }
      } catch (err) {
        console.error('Error fetching allowed domains:', err)
      }
    }
    fetchAllowedDomains()
  }, [supabase])

  const validateEmail = (emailStr: string): boolean => {
    const domain = emailStr.trim().split('@').pop()?.toLowerCase()
    if (!domain) return false
    return allowedDomains.includes(domain)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!email || !password) {
      setError('Por favor, completa todos los campos.')
      setIsLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError(`Acceso restringido. Debes utilizar un correo institucional o autorizado (ej: ${allowedDomains.join(', ')}).`)
      setIsLoading(false)
      return
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authErr) {
        setError(authErr.message === 'Invalid login credentials' 
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
          : authErr.message
        )
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Fetch user's profile to inspect role for smart redirection
      const userId = authData.user?.id
      let role = 'estudiante'
      if (userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
        
        if (profileData?.role) {
          role = profileData.role
        }
      }
      
      // Determine redirection based on role
      let redirectPath = '/cafeterias'
      if (role === 'cafeteria') {
        redirectPath = '/cafeteria/dashboard'
      } else if (role === 'repartidor' || role === 'rider') {
        redirectPath = '/rider/dashboard'
      } else if (role === 'admin') {
        redirectPath = '/admin/stats'
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        if (next) redirectPath = next
        
        setTimeout(() => {
          window.location.href = redirectPath
        }, 1000)
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al iniciar sesión.')
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validations
    if (!fullName || !email || !password || !confirmPassword || !cedula || !phone) {
      setError('Por favor, completa todos los campos de registro.')
      setIsLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError(`Debes utilizar un correo institucional o autorizado (ej: ${allowedDomains.join(', ')}).`)
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setIsLoading(false)
      return
    }

    if (!/^\d{10}$/.test(cedula)) {
      setError('El número de cédula debe tener exactamente 10 dígitos numéricos.')
      setIsLoading(false)
      return
    }

    if (!/^09\d{8}$/.test(phone)) {
      setError('El número celular debe tener 10 dígitos y empezar con 09.')
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones.')
      setIsLoading(false)
      return
    }

    try {
      // 1. Sign up user
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          }
        }
      })

      if (signUpErr) {
        setError(signUpErr.message)
        setIsLoading(false)
        return
      }

      const user = signUpData.user
      if (!user) {
        setError('No se pudo crear el usuario. Por favor intenta de nuevo.')
        setIsLoading(false)
        return
      }

      // 2. Update profile with cell phone and cedula
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ 
          phone: phone.trim(), 
          cedula: cedula.trim(),
          full_name: fullName.trim()
        })
        .eq('id', user.id)

      if (profileErr) {
        console.error('Error updating profile metadata:', profileErr)
      }

      // 3. Insert terms acceptance record
      const { error: termsErr } = await supabase
        .from('terms_acceptance')
        .insert({
          user_id: user.id,
          accepted_terms_version: '1.0'
        })

      if (termsErr) {
        console.error('Error inserting terms acceptance:', termsErr)
      }

      setSuccess(true)
      
      // Auto-redirect to cafeterias or next parameter
      let redirectPath = '/cafeterias'
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        if (next) redirectPath = next
        
        setTimeout(() => {
          window.location.href = redirectPath
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar el usuario.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background blobs in crimson red brand color */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg mx-auto mb-3">
            U
          </div>
          <h2 className="font-display text-2xl font-black text-foreground">UIDE Campus Delivery</h2>
          <p className="text-xs text-muted-foreground mt-1">Acceso seguro para estudiantes y personal del campus</p>
        </div>

        <Card className="border border-border bg-card shadow-2xl rounded-3xl overflow-hidden">
          {/* Tab Selector */}
          <div className="flex bg-muted/30 p-1.5 border-b border-border/20">
            <button
              onClick={() => {
                setActiveTab('login')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-2xl transition-all ${
                activeTab === 'login' 
                  ? 'bg-card text-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setActiveTab('register')
                setError(null)
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-2xl transition-all ${
                activeTab === 'register' 
                  ? 'bg-card text-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registrarse
            </button>
          </div>

          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {activeTab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta institucional'}
            </CardTitle>
            <CardDescription className="text-xs">
              {activeTab === 'login' 
                ? 'Ingresa tus credenciales para ordenar comida'
                : 'Regístrate usando tu correo institucional de la UIDE o EPN'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-primary mx-auto">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">¡Ingreso Exitoso!</h3>
                  <p className="text-xs text-muted-foreground">Redireccionando al portal de entregas...</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
                
                {/* Registration fields */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Nombre Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Juan Pérez"
                          className="pl-9 text-xs rounded-xl py-5"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Cédula */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Cédula de Identidad</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="1712345678"
                          maxLength={10}
                          className="pl-9 text-xs rounded-xl py-5"
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                    </div>

                    {/* Celular */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Teléfono Celular</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="0987654321"
                          maxLength={10}
                          className="pl-9 text-xs rounded-xl py-5"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Correo Institucional</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="usuario@uide.edu.ec"
                      className="pl-9 text-xs rounded-xl py-5"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 text-xs rounded-xl py-5"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password (register only) */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Confirmar Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 text-xs rounded-xl py-5"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* T&C check (register only) */}
                {activeTab === 'register' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 pt-2"
                  >
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                      required
                    />
                    <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none">
                      Acepto los <span className="text-primary font-semibold hover:underline">términos y condiciones</span> de uso de la plataforma.
                    </label>
                  </motion.div>
                )}

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full rounded-full py-5 text-xs font-black shadow-lg shadow-primary/10 mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : activeTab === 'login' ? (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          {activeTab === 'login' && !success && (
            <CardFooter className="pt-0 pb-6 justify-center">
              <p className="text-[11px] text-muted-foreground text-center">
                ¿No tienes una cuenta?{' '}
                <button 
                  onClick={() => setActiveTab('register')} 
                  className="text-primary font-bold hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
