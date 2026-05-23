'use client';

import { useState, useRef } from 'react';
import { createProduct } from '@/app/lib/storage';
import { validateProductForm } from '@/app/lib/validators';

interface Category {
  id: string;
  name: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ProductForm({
  categories,
  onProductCreated,
}: {
  categories: Category[];
  onProductCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Usamos un Ref para controlar el formulario de forma segura
  const formRef = useRef<HTMLFormElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file');

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setImageUrlError(null);

    const formData = new FormData(e.currentTarget);
    const formValues = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      category_id: formData.get('category_id') as string,
      barcode: formData.get('barcode') as string, // NUEVO CAMPO
      description: formData.get('description') as string,
      imageUrl: imagePreview || undefined,
    };

    // Validar formulario
    const validationErrors = validateProductForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validación de URL de imagen
    if (imageMode === 'url' && imagePreview) {
      const ok = await isImageUrl(imagePreview);
      if (!ok) {
        setImageUrlError('La URL no es válida o no apunta a una imagen');
        return;
      }
    }

    setLoading(true);

    try {
      createProduct(formValues);
      setSuccessMessage('✓ Producto creado exitosamente');
      
      setTimeout(() => {
        // Uso seguro del ref para resetear el formulario
        formRef.current?.reset();
        setImagePreview(null);
        setSuccessMessage('');
        setIsOpen(false);
        onProductCreated();
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Error al crear el producto' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity flex items-center justify-center p-4"
          onClick={() => !loading && setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Crear Producto</h2>
                <p className="text-xs text-slate-500 font-medium">Agrega un nuevo artículo al catálogo</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  maxLength={100}
                  placeholder="Ej: GPU RTX 4090"
                  className={`w-full px-3 py-2 rounded-md border text-sm transition-all ${
                    errors.name ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                  } focus:outline-none`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Precio</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                      className={`w-full pl-7 pr-3 py-2 rounded-md border text-sm transition-all ${
                        errors.price ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-slate-900'
                      } focus:outline-none`}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-red-600 mt-1 font-medium">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Stock Inicial</label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    placeholder="0"
                    onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-all ${
                      errors.stock ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-slate-900'
                    } focus:outline-none`}
                  />
                  {errors.stock && <p className="text-xs text-red-600 mt-1 font-medium">{errors.stock}</p>}
                </div>
              </div>

              {/* Categoría y Código de Barras */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Categoría</label>
                  <select
                    name="category_id"
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-all ${
                      errors.category_id ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-slate-900'
                    } focus:outline-none bg-white`}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-xs text-red-600 mt-1 font-medium">{errors.category_id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 uppercase mb-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    Cód. Barras / SKU
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    placeholder="Escanea o escribe..."
                    className="w-full px-3 py-2 rounded-md border border-blue-300 bg-blue-50 text-sm focus:outline-none focus:border-blue-600 font-mono font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Opcional para el escáner del Punto de Venta</p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Descripción</label>
                <textarea
                  name="description"
                  maxLength={500}
                  rows={2}
                  placeholder="Especificaciones técnicas..."
                  className={`w-full px-3 py-2 rounded-md border text-sm transition-all resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:border-slate-900'
                  } focus:outline-none`}
                ></textarea>
                {errors.description && <p className="text-xs text-red-600 mt-1 font-medium">{errors.description}</p>}
              </div>

              {/* Imagen */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Fotografía (Opcional)</label>
                
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('file')}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      imageMode === 'file' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-600'
                    }`}
                  >
                    Subir archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      imageMode === 'url' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-600'
                    }`}
                  >
                    Vincular URL
                  </button>
                </div>

                {imagePreview && (
                  <div className="mb-3 relative w-32 h-32 rounded-md border border-slate-300 overflow-hidden bg-white">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-md"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {imageMode === 'file' && (
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setImagePreview(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-slate-200 file:text-slate-700 file:font-bold hover:file:bg-slate-300 cursor-pointer"
                  />
                )}

                {imageMode === 'url' && (
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    onChange={(e) => {
                      const url = e.currentTarget.value.trim();
                      setImagePreview(url || null);
                      setImageUrlError(null);
                    }}
                    className="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                  />
                )}
                {imageUrlError && <p className="text-xs text-red-600 mt-2 font-medium">{imageUrlError}</p>}
              </div>

              {/* Mensajes de feedback */}
              {errors.submit && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-xs font-bold text-red-700">{errors.submit}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200">
                  <p className="text-xs font-bold text-green-700">{successMessage}</p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-bold py-2.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-slate-900 text-white text-sm font-bold py-2.5 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? 'Procesando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}