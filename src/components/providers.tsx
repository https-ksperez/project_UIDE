'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { CartSheet } from '@/components/cart/cart-sheet'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <CartSheet />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        theme="light"
        toastOptions={{
          style: {
            borderRadius: '12px',
          },
        }}
      />
    </NextThemesProvider>
  )
}

