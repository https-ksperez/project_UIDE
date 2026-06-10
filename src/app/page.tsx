import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  MapPin, 
  ShoppingBag, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Utensils, 
  ChevronRight,
  TrendingUp
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch active cafeterias to showcase
  const { data: cafeterias } = await supabase
    .from('cafeterias')
    .select('*')
    .eq('is_active', true)
    .limit(3)

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
            U
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-primary">
            UIDE Campus Delivery
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/cafeterias">
              <Button size="sm" className="shadow-xs font-semibold">
                Ver Cafeterías
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/cafeterias" className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground mr-2">
                Menú Público
              </Link>
              <Link href="/login">
                <Button size="sm" className="font-semibold shadow-xs">
                  Iniciar Sesión
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-8 py-16 md:py-24 max-w-5xl mx-auto space-y-8 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          ¡El delivery oficial de la UIDE!
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-none text-foreground max-w-4xl">
          Tus platos favoritos del campus,{' '}
          <span className="text-primary">
            entregados donde estés.
          </span>
        </h1>
        
        <p className="text-muted-foreground text-base md:text-xl max-w-2xl leading-relaxed">
          Diseñado exclusivamente para la comunidad UIDE. Pide comida de las cafeterías del campus y recíbela directamente en tu facultad o punto de encuentro favorito sin interrumpir tus clases.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md pt-4">
          <Link href="/cafeterias" className="flex-1">
            <Button size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20">
              Pedir Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          {!user && (
            <Link href="/login" className="flex-1">
              <Button size="lg" variant="outline" className="w-full text-base font-semibold">
                Acceso Institucional
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-3xl pt-12">
          <div className="p-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xl md:text-2xl font-bold font-display text-foreground">{'< 20 min'}</span>
            <span className="text-xs text-muted-foreground">Entrega Promedio</span>
          </div>
          <div className="p-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-2">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xl md:text-2xl font-bold font-display text-foreground">10+</span>
            <span className="text-xs text-muted-foreground">Puntos de Entrega</span>
          </div>
          <div className="p-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xs flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl md:text-2xl font-bold font-display text-foreground">$1.00</span>
            <span className="text-xs text-muted-foreground">Tarifa Fija de Envío</span>
          </div>
        </div>
      </section>

      {/* Sneak Peek Cafeterias Section */}
      <section className="bg-muted/30 border-y border-border/40 py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
                <Utensils className="w-6 h-6 text-primary" />
                Explora las cafeterías del campus
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                La mejor comida lista para ser entregada en tus manos
              </p>
            </div>
            <Link href="/cafeterias" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Ver todas las cafeterías
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {cafeterias && cafeterias.length > 0 ? (
              cafeterias.map((caf: any) => (
                <div key={caf.id} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="h-40 bg-primary relative flex items-center justify-center text-white/90">
                    {caf.logo_url ? (
                      <img src={caf.logo_url} alt={caf.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <span className="font-display font-black text-2xl tracking-widest text-white/50 block">UIDE</span>
                        <span className="text-xs text-white/70 font-semibold">{caf.name}</span>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500 text-red-50 font-bold text-[10px]">
                      Abierto
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {caf.name}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {caf.description || 'Deliciosas opciones gastronómicas dentro del campus UIDE.'}
                    </p>
                    <div className="pt-2 border-t border-border/40 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{caf.physical_location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback cards if database is empty
              ['Sports Club UIDE', 'Pabellón D Express', 'Food Hall Central'].map((name, i) => (
                <div key={i} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="h-36 bg-primary relative flex items-center justify-center text-white/90">
                    <span className="font-display font-black text-2xl tracking-widest text-white/30">UIDE</span>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] border border-white/20">
                      Abierto
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Disfruta de almuerzos, snacks, y bebidas calientes con entrega instantánea.
                    </p>
                    <div className="pt-2 border-t border-border/40 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Área de Cafeterías</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-5xl mx-auto py-16 md:py-24 px-4 md:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            ¿Cómo funciona UIDE Campus Delivery?
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            El proceso es extremadamente sencillo y optimizado para el campus
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-4 p-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm">
              1
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Elige tu Cafetería</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Inicia sesión con tu correo UIDE, explora los menús de las cafeterías autorizadas y arma tu carrito.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm">
              2
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Registra Pago y Destino</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Selecciona tu punto de entrega oficial, sube tu comprobante de transferencia y realiza el pedido.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shadow-sm">
              3
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Sigue tu Entrega</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Monitorea el estado de tu orden en tiempo real y recíbela de manos de tu repartidor usando un código OTP seguro.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 px-4 md:px-8 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="max-w-5xl mx-auto space-y-3">
          <p>© {new Date().getFullYear()} Universidad Internacional del Ecuador. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="hover:text-primary transition-colors">Términos y Condiciones</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-primary transition-colors">Políticas de Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
