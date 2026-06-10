'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Product, ProductCategory } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Loader2, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight, 
  Coffee, 
  Plus, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Tag, 
  Check 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient() as any

export default function CafeteriaMenuInventoryPage() {
  const { session } = useAuthStore()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [cafeteriaId, setCafeteriaId] = useState<number | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isTogglingId, setIsTogglingId] = useState<number | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null)

  // Form & Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [isPromo, setIsPromo] = useState(false)

  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const fetchMenu = async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }
    try {
      // 1. Fetch cafeteria
      const { data: cafData, error: cafErr } = await supabase
        .from('cafeterias')
        .select('id')
        .eq('owner_id', session.user.id)
        .single()

      if (cafErr || !cafData) throw cafErr || new Error('No se encontró tu cafetería.')
      setCafeteriaId(cafData.id)

      // 2. Fetch products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('cafeteria_id', cafData.id)
        .order('name', { ascending: true })

      if (prodErr) throw prodErr
      setProducts(prodData || [])

      // 3. Fetch categories for selector
      const { data: catData } = await supabase
        .from('product_categories')
        .select('*')
        .eq('cafeteria_id', cafData.id)
        .order('sort_order', { ascending: true })

      setCategories(catData || [])
    } catch (err: any) {
      console.error('Error fetching inventory:', err)
      toast.error(err.message || 'Error al cargar el inventario.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [session])

  const handleToggleAvailability = async (productId: number, currentStatus: boolean) => {
    setIsTogglingId(productId)
    const nextStatus = !currentStatus

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: nextStatus })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map((p) => p.id === productId ? { ...p, is_available: nextStatus } : p))
      toast.success(nextStatus ? 'Producto disponible en el menú.' : 'Producto marcado como agotado.')
    } catch (err: any) {
      console.error('Error toggling availability:', err)
      toast.error('No se pudo actualizar el estado de disponibilidad.')
    } finally {
      setIsTogglingId(null)
    }
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setName('')
    setPrice('')
    setDescription('')
    setImageUrl('')
    setCategoryId(categories.length > 0 ? categories[0].id : null)
    setIsAvailable(true)
    setIsPromo(false)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod)
    setName(prod.name)
    setPrice(String(prod.price))
    setDescription(prod.description || '')
    setImageUrl(prod.image_url || '')
    setCategoryId(prod.category_id)
    setIsAvailable(prod.is_available)
    setIsPromo(prod.is_promo)
    setIsFormModalOpen(true)
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      toast.error('La imagen de plato no debe superar los 3MB.')
      return
    }

    setIsUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${cafeteriaId || 'prod'}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        setImageUrl(data.publicUrl)
        toast.success('¡Imagen del plato subida con éxito!')
      }
    } catch (err: any) {
      console.error('Error uploading product image:', err)
      toast.error('No se pudo subir la imagen del plato.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cafeteriaId) return
    if (!name.trim() || !price.trim()) {
      toast.error('Nombre y precio son campos requeridos.')
      return
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('El precio debe ser un número válido mayor o igual a 0.')
      return
    }

    setIsSavingProduct(true)

    try {
      const productPayload = {
        cafeteria_id: cafeteriaId,
        category_id: categoryId ? Number(categoryId) : null,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        image_url: imageUrl.trim() || null,
        is_available: isAvailable,
        is_promo: isPromo,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('¡Plato actualizado con éxito!')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productPayload)

        if (error) throw error
        toast.success('¡Plato agregado al menú con éxito!')
      }

      setIsFormModalOpen(false)
      fetchMenu()
    } catch (err: any) {
      console.error('Error saving product:', err)
      toast.error('No se pudo guardar el plato.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este plato de tu menú?')) return

    setDeletingProductId(productId)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      toast.success('¡Plato eliminado del menú!')
      fetchMenu()
    } catch (err: any) {
      console.error('Error deleting product:', err)
      toast.error('No se pudo eliminar el plato.')
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Navbar />

      <div className="bg-gradient-to-b from-primary/5 to-transparent py-10 px-4 md:px-8 border-b border-border/15">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Coffee className="w-7 h-7 text-primary" />
              Inventario de Menú
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Agrega platos, edita precios, marca promociones y desactiva stock al instante
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

      <main className="max-w-4xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Listado de Platos</CardTitle>
              <CardDescription className="text-xs">
                Gestiona tus productos activos. Marca "Promo" para destacar ofertas a los estudiantes.
              </CardDescription>
            </div>
            
            <div className="flex gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMenu}
                className="rounded-full gap-1 font-semibold border-border/60 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar
              </Button>
              <Button
                size="sm"
                onClick={handleOpenAddModal}
                className="rounded-full gap-1.5 font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Plato
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Cargando inventario...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="divide-y divide-border/30 text-xs">
                {products.map((prod) => (
                  <div key={prod.id} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Product thumb */}
                      <div className="w-12 h-12 rounded-xl bg-primary/5 border border-border/40 shrink-0 flex items-center justify-center overflow-hidden relative">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Coffee className="w-5 h-5 text-muted-foreground/30" />
                        )}
                        {prod.is_promo && (
                          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
                        )}
                      </div>
                      
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-foreground text-sm truncate">{prod.name}</h4>
                          {prod.is_promo && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black border border-primary/20 flex items-center gap-0.5 uppercase tracking-wider">
                              <Tag className="w-2.5 h-2.5" />
                              Promo
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-1 text-xs">{prod.description || 'Sin descripción'}</p>
                        <p className="font-black text-primary text-xs">{formatCurrency(prod.price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Availability button toggler */}
                      <div className="flex items-center gap-1.5 hidden sm:flex">
                        <span className={`text-[10px] font-bold ${prod.is_available ? 'text-primary' : 'text-muted-foreground'}`}>
                          {prod.is_available ? 'Disponible' : 'Agotado'}
                        </span>
                        <button
                          onClick={() => handleToggleAvailability(prod.id, prod.is_available)}
                          disabled={isTogglingId === prod.id}
                          className="text-primary hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                        >
                          {prod.is_available ? (
                            <ToggleRight className="w-9 h-9" />
                          ) : (
                            <ToggleLeft className="w-9 h-9 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      {/* Action buttons (Edit & Delete) */}
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEditModal(prod)}
                          className="h-8 w-8 rounded-full border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Editar plato"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteProduct(prod.id)}
                          disabled={deletingProductId === prod.id}
                          className="h-8 w-8 rounded-full text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                          title="Eliminar plato"
                        >
                          {deletingProductId === prod.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-3 text-muted-foreground">
                <Coffee className="w-8 h-8 mx-auto text-muted-foreground/30" />
                <p>No tienes platos cargados en tu menú.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Insert / Edit Product Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsFormModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-border/40 mb-4">
                <h3 className="font-display font-black text-base text-foreground flex items-center gap-1.5">
                  <Coffee className="w-5 h-5 text-primary" />
                  {editingProduct ? 'Editar Plato del Menú' : 'Agregar Nuevo Plato'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Nombre del Plato / Producto</label>
                  <Input
                    type="text"
                    placeholder="Ej. Hamburguesa UIDE Doble Carne"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSavingProduct}
                    className="text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Product Price */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground/80">Precio ($ USD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 3.50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      disabled={isSavingProduct}
                      className="text-foreground text-xs"
                    />
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground/80">Categoría</label>
                    <select
                      value={categoryId || ''}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      disabled={isSavingProduct}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground/80">Descripción / Ingredientes</label>
                  <textarea
                    placeholder="Ingresa los ingredientes o detalles del plato..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    disabled={isSavingProduct}
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden text-foreground"
                  />
                </div>

                 {/* Image Uploader */}
                 <div className="space-y-1.5">
                   <label className="font-bold text-foreground/80 flex items-center gap-1">
                     <ImageIcon className="w-3.5 h-3.5 text-primary" />
                     Imagen del Plato
                   </label>
                   <div className="flex gap-4 items-center">
                     {/* Preview Thumbnail */}
                     <div className="w-14 h-14 rounded-xl bg-muted border border-border/40 shrink-0 flex items-center justify-center overflow-hidden">
                       {imageUrl ? (
                         <img src={imageUrl} alt="Plato preview" className="w-full h-full object-cover" />
                       ) : (
                         <Coffee className="w-5 h-5 text-muted-foreground/30" />
                       )}
                     </div>
                     {/* File Upload Button */}
                     <div className="flex-1">
                       <label className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 hover:bg-muted font-bold cursor-pointer transition-colors active:scale-95 text-xs text-foreground">
                         {isUploadingImage ? (
                           <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                         ) : (
                           <Upload className="w-3.5 h-3.5 text-primary" />
                         )}
                         {imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                         <input
                           type="file"
                           accept="image/*"
                           onChange={handleUploadImage}
                           disabled={isUploadingImage || isSavingProduct}
                           className="hidden"
                         />
                       </label>
                       <p className="text-[10px] text-muted-foreground mt-1">
                         Formatos soportados: JPEG, PNG, WEBP. Límite de tamaño: 3MB.
                       </p>
                     </div>
                   </div>
                 </div>

                {/* Checkboxes / Switches */}
                <div className="pt-2 grid grid-cols-2 gap-4">
                  {/* Availability */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      disabled={isSavingProduct}
                      className="w-4 h-4 rounded-sm border-input text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <span className="font-bold text-foreground/80">Disponible para Venta</span>
                  </label>

                  {/* Promo Flag */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPromo}
                      onChange={(e) => setIsPromo(e.target.checked)}
                      disabled={isSavingProduct}
                      className="w-4 h-4 rounded-sm border-input text-primary focus:ring-primary focus:ring-offset-background"
                    />
                    <span className="font-bold text-foreground/80 flex items-center gap-1 text-primary">
                      <Tag className="w-3.5 h-3.5" />
                      Destacar en Promoción
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex gap-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-full font-bold border-border/60 text-xs py-5"
                    onClick={() => setIsFormModalOpen(false)}
                    disabled={isSavingProduct}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-full font-bold text-xs py-5"
                    disabled={isSavingProduct}
                  >
                    {isSavingProduct ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin mr-1.5" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {editingProduct ? 'Guardar Cambios' : 'Agregar Plato'}
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
