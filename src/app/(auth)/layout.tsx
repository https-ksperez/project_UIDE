import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check if profile exists, if not, Supabase triggers or hooks will make it.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {children}
    </div>
  )
}
