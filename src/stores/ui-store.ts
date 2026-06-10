import { create } from 'zustand'

interface UIState {
  isMobileNavOpen: boolean
  isCartOpen: boolean
  isSearchOpen: boolean
  toggleMobileNav: () => void
  toggleCart: () => void
  toggleSearch: () => void
  closeAll: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  isCartOpen: false,
  isSearchOpen: false,
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeAll: () =>
    set({
      isMobileNavOpen: false,
      isCartOpen: false,
      isSearchOpen: false,
    }),
}))
