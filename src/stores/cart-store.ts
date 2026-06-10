import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem } from '@/lib/types/database'
import { toast } from 'sonner'

interface CartState {
  items: CartItem[]
  cafeteriaId: number | null
  cafeteriaName: string | null
  
  // Actions
  addItem: (product: Product, cafeteriaId: number, cafeteriaName: string) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  
  // Computed / Getter methods
  getSubtotal: () => number
  getDeliveryFee: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cafeteriaId: null,
      cafeteriaName: null,

      addItem: (product, cafeteriaId, cafeteriaName) => {
        let currentItems = [...get().items]
        
        // Find unique cafeterias in the cart
        const uniqueCafs = Array.from(new Set(currentItems.map(item => item.cafeteria_id)))

        // Limit to maximum 2 unique cafeterias
        if (uniqueCafs.length >= 2 && !uniqueCafs.includes(cafeteriaId)) {
          toast.error('Solo puedes ordenar de un máximo de 2 cafeterías al mismo tiempo.')
          return
        }

        const existingItemIndex = currentItems.findIndex(
          (item) => item.product.id === product.id
        )

        if (existingItemIndex > -1) {
          // Increment quantity
          currentItems[existingItemIndex].quantity += 1
        } else {
          // Add new item
          currentItems.push({
            product,
            quantity: 1,
            cafeteria_id: cafeteriaId,
            cafeteria_name: cafeteriaName,
          })
        }

        const newUniqueCafs = Array.from(new Set(currentItems.map(item => item.cafeteria_id)))

        set({
          items: currentItems,
          cafeteriaId: newUniqueCafs[0] || null,
          cafeteriaName: currentItems[0]?.cafeteria_name || null,
        })
      },

      removeItem: (productId) => {
        const currentItems = get().items.filter(
          (item) => item.product.id !== productId
        )

        if (currentItems.length === 0) {
          set({
            items: [],
            cafeteriaId: null,
            cafeteriaName: null,
          })
        } else {
          const newUniqueCafs = Array.from(new Set(currentItems.map(item => item.cafeteria_id)))
          set({ 
            items: currentItems,
            cafeteriaId: newUniqueCafs[0] || null,
            cafeteriaName: currentItems[0]?.cafeteria_name || null,
          })
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const currentItems = get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )

        const newUniqueCafs = Array.from(new Set(currentItems.map(item => item.cafeteria_id)))
        set({ 
          items: currentItems,
          cafeteriaId: newUniqueCafs[0] || null,
          cafeteriaName: currentItems[0]?.cafeteria_name || null,
        })
      },

      clearCart: () => {
        set({
          items: [],
          cafeteriaId: null,
          cafeteriaName: null,
        })
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      getDeliveryFee: () => {
        const uniqueCafs = Array.from(new Set(get().items.map(item => item.cafeteria_id)))
        return uniqueCafs.length * 1.00
      },

      getTotal: () => {
        return get().getSubtotal() + get().getDeliveryFee()
      },
    }),
    {
      name: 'uide-cart',
    }
  )
)
