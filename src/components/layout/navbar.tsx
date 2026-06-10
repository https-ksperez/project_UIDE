'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { 
  ShoppingBag, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X, 
  ClipboardList,
  ChevronDown
} from 'lucide-react'

const supabase = createClient() as any

export function Navbar() {
  const router = useRouter()
  
  const { profile, session, isLoading, setProfile, setSession, setIsLoading, clearAuth } = useAuthStore()
  const { items } = useCartStore()
  const { isMobileNavOpen, toggleMobileNav, toggleCart, closeAll } = useUIStore()
  
  // Track dropdown open state for desktop
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  // Track total items in cart
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    // Listen for auth state changes
    const fetchSession = async () => {
      setIsLoading(true)
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      setSession(initialSession)
      
      if (initialSession?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', initialSession.user.id)
          .single()
        
        setProfile(userProfile)
      } else {
        clearAuth()
      }
      setIsLoading(false)
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, currentSession: any) => {
      setSession(currentSession)
      if (currentSession?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
        
        setProfile(userProfile)
      } else {
        clearAuth()
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, setIsLoading, clearAuth])

  // Redirect based on role
  useEffect(() => {
    if (!isLoading && profile) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      if (profile.role === 'cafeteria' && !pathname.startsWith('/cafeteria')) {
        router.push('/cafeteria/dashboard')
      }
    }
  }, [profile, isLoading, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearAuth()
    closeAll()
    setIsUserDropdownOpen(false)
    router.push('/')
    router.refresh()
  }

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (!profile) return '/perfil'
    switch (profile.role) {
      case 'admin':
        return '/admin/users'
      case 'cafeteria':
        return '/cafeteria/dashboard'
      case 'repartidor':
        return '/rider/dashboard'
      default:
        return '/orders'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'cafeteria': return 'Cafetería'
      case 'repartidor': return 'Repartidor'
      default: return 'Estudiante'
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-background border-b border-border px-4 md:px-8 py-3.5 flex items-center justify-between transition-all duration-300">
        <Link href="/" className="flex items-center gap-2" onClick={closeAll}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-md">
            U
          </div>
          <span className="font-display font-extrabold text-base md:text-lg tracking-tight text-primary">
            UIDE Delivery
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/cafeterias" className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground hover:text-foreground">
            Cafeterías
          </Link>
          {session && (
            <Link href="/orders" className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground hover:text-foreground">
              Mis Pedidos
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <Button 
            variant="glass" 
            size="icon" 
            className="relative rounded-full h-10 w-10 border-border/60 hover:bg-primary/5 active:scale-95"
            onClick={toggleCart}
          >
            <ShoppingBag className="w-5 h-5 text-foreground" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-xs border border-background">
                {cartItemsCount}
              </span>
            )}
          </Button>

          {/* User Actions */}
          {!isLoading && (
            session ? (
              <div className="relative hidden md:block">
                <Button 
                  variant="outline" 
                  className="h-10 px-3 rounded-full border-border flex items-center gap-2 hover:bg-muted"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
                    {profile?.full_name || 'Mi Perfil'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Dropdown Menu on Click */}
                {isUserDropdownOpen && (
                  <>
                    {/* Invisible overlay to close dropdown on click outside */}
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsUserDropdownOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-card border border-border shadow-lg p-1.5 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-border/40 text-left">
                        <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || 'Comunidad UIDE'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{profile?.role ? getRoleLabel(profile.role) : 'Estudiante'}</p>
                      </div>
                      
                      <Link 
                        href={getDashboardLink()} 
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors mt-1"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        Mi Dashboard
                      </Link>

                      <Link 
                        href="/orders" 
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Mis Pedidos
                      </Link>

                      <button 
                        onClick={handleSignOut} 
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors mt-1 text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:block">
                <Link href="/login">
                  <Button size="sm" className="rounded-full px-5 h-10 font-bold shadow-xs">
                    Ingresar
                  </Button>
                </Link>
              </div>
            )
          )}

          {/* Mobile Navigation Menu Toggle */}
          <Button 
            variant="glass" 
            size="icon" 
            className="md:hidden rounded-full h-10 w-10 border-border/60 active:scale-95"
            onClick={toggleMobileNav}
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAll}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
            />
            {/* Slide-in drawer - Solid Background */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-background border-l border-border shadow-2xl p-6 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between pb-6 border-b border-border/40">
                <span className="font-display font-extrabold text-base tracking-tight text-primary">
                  Menú
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-muted"
                  onClick={closeAll}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-5 py-6 flex-1">
                <Link
                  href="/cafeterias"
                  onClick={closeAll}
                  className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground hover:text-foreground py-2 border-b border-border/20"
                >
                  Cafeterías
                </Link>
                {session && (
                  <Link
                    href="/orders"
                    onClick={closeAll}
                    className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground hover:text-foreground py-2 border-b border-border/20"
                  >
                    Mis Pedidos
                  </Link>
                )}

                <div className="mt-auto pt-6 border-t border-border/40">
                  {!isLoading && (
                    session ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/60 rounded-xl mb-4 border border-border/20">
                          <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || 'Comunidad UIDE'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{profile?.role ? getRoleLabel(profile.role) : 'Estudiante'}</p>
                        </div>
                        <Link
                          href={getDashboardLink()}
                          onClick={closeAll}
                          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5"
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          Mi Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors py-1.5 text-left rounded-xl"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    ) : (
                      <Link href="/login" onClick={closeAll} className="w-full">
                        <Button className="w-full rounded-full font-bold shadow-xs py-5">
                          Iniciar Sesión
                        </Button>
                      </Link>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
