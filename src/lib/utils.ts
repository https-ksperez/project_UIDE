import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    listo_para_entrega: 'Listo para Entrega',
    en_camino: 'En Camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return statusMap[status] || status
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    preparando: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
    listo_para_entrega: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60',
    en_camino: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60',
    entregado: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    cancelado: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
}

export function getPaymentStatusLabel(status: string): string {
  const paymentMap: Record<string, string> = {
    pendiente: 'Pendiente de Validación',
    verificado: 'Pago Verificado',
    rechazado: 'Pago Rechazado',
  }
  return paymentMap[status] || status
}

export function getPaymentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    verificado: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    rechazado: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
}
