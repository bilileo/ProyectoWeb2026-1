'use client';

import { useState } from 'react';
import { updateProduct, deleteProduct, getCategories } from '@/app/lib/storage';
import { validateProductForm } from '@/app/lib/validators';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category_id: string;
  barcode?: string; 
  categories?: {
    name: string;
  };
  imageUrl?: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ProductCard({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(product.imageUrl || null);
  const [editImageMode, setEditImageMode] = useState<'file' | 'url'>('file');
  const [editImageUrlError, setEditImageUrlError] = useState<string | null>(null);

  function isImageUrl(url: string) {
    return new Promise<boolean>((resolve) => {
      try {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      } catch (e) {
        resolve(false);
      }
    });
  }
  const categories = getCategories();

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      category_id: formData.get('category_id') as string,
      barcode: formData.get('barcode') as string, 
      description: formData.get('description') as string,
      imageUrl: editImagePreview || undefined,
    };

    // Validar
    const validationErrors = validateProductForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Si el modo es URL y hay una URL, verificar que realmente cargue como imagen
    if (editImageMode === 'url' && editImagePreview) {
      setEditImageUrlError(null);
      const ok = await isImageUrl(editImagePreview);
      if (!ok) {
        setEditImageUrlError('La URL no es válida o no apunta a una imagen');
        setLoading(false);
        return;
      }
    }

    try {
      updateProduct(product.id, formValues);
      setSuccessMessage('✓ Producto actualizado');
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMessage('');
        onUpdate();
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      deleteProduct(product.id);
      onUpdate();
    } catch (error) {
      setErrors({ submit: 'Error al eliminar' });
      setLoading(false);
    }
  }

  // Vista de edición
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-fadeIn">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nombre</label>
              <input
                type="text"
                name="name"
                maxLength={100}
                defaultValue={product.name}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Precio</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  defaultValue={product.price}
                  className={`w-full pl-7 pr-3 py-2 text-sm rounded-lg border transition-all ${
                    errors.price ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Stock</label>
              <input
                type="number"
                name="stock"
                min="0"
                defaultValue={product.stock}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                  errors.stock ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Categoría</label>
              <select
                name="category_id"
                defaultValue={product.category_id}
                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                  errors.category_id ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white`}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>}
            </div>
          </div>

          {/* Código de Barras */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Cód. Barras / SKU</label>
            <input
              type="text"
              name="barcode"
              defaultValue={product.barcode || ''}
              placeholder="Escanea o escribe el código"
              className="w-full px-3 py-2 text-sm rounded-lg border transition-all border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Descripción</label>
            <textarea
              name="description"
              maxLength={500}
              rows={2}
              defaultValue={product.description}
              className={`w-full px-3 py-2 text-sm rounded-lg border transition-all resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            ></textarea>
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Imagen</label>

            {/* archivo o URL */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setEditImageMode('file')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  editImageMode === 'file' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Subir archivo
              </button>
              <button
                type="button"
                onClick={() => setEditImageMode('url')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  editImageMode === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Desde URL
              </button>
            </div>

            {/* Vista previa */}
            {editImagePreview && (
              <div className="mb-2 relative">
                <img src={editImagePreview} alt="Preview" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setEditImagePreview(null)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input */}
            {editImageMode === 'file' && (
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setEditImagePreview(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-2 file:px-2 file:py-1 file:rounded file:bg-blue-50 file:text-blue-600 file:text-xs file:font-medium file:cursor-pointer hover:file:bg-blue-100"
              />
            )}

            {editImageMode === 'url' && (
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                defaultValue={product.imageUrl || ''}
                onChange={(e) => {
                  const url = e.currentTarget.value.trim();
                  setEditImagePreview(url || null);
                  setEditImageUrlError(null);
                }}
              />
            )}
          </div>

          {successMessage && (
            <div className="p-2.5 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs text-green-700">{successMessage}</p>
            </div>
          )}

          {editImageUrlError && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 mt-2">
              <p className="text-xs text-red-700">{editImageUrlError}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium py-2 rounded-lg transition-all"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium py-2 rounded-lg transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Vista normal
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Imagen */}
      {product.imageUrl && (
        <div className="w-full h-40 bg-slate-100 overflow-hidden shrink-0">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      {/* Contenido */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-1" title={product.name}>{product.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">{product.categories?.name || 'Sin categoría'}</p>
              {product.barcode && (
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded border border-slate-100" title="Código de barras">
                  {product.barcode}
                </span>
              )}
            </div>
          </div>
          {product.stock < 5 && (
            <div className="ml-2 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium shrink-0">
              Bajo stock
            </div>
          )}
        </div>

        {/* Descripción */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{product.description}</p>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-auto">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Precio</p>
            <p className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">Stock</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {product.stock > 0 ? `${product.stock} uni.` : 'Agotado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full animate-fadeIn">
            <div className="p-5 border-b border-red-100">
              <p className="text-sm font-semibold text-slate-900">Eliminar producto</p>
              <p className="text-xs text-slate-500 mt-1">Esta acción no se puede deshacer</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600">
                ¿Estás seguro de que deseas eliminar <span className="font-semibold">"{product.name}"</span>?
              </p>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-medium py-2.5 rounded-lg transition-all"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-900 text-sm font-medium py-2.5 rounded-lg transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}