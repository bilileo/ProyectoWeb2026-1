'use client';

import { useEffect, useState } from 'react';
import ProductForm from './components/ProductForm';
import ProductCard from './components/ProductCard';
import Header from './components/Header';
import { getProducts, getCategories, initializeData } from './lib/storage';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category_id: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    initializeData();
    setProducts(getProducts());
    setCategories(getCategories());
    setMounted(true);
  }, []);

  const handleProductCreated = () => {
    setProducts(getProducts());
  };

  if (!mounted) {
    return null;
  }

  // Cálculos para los stats
  const productCount = products?.length || 0;
  const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) || 0;
  const lowStockCount = products?.filter((p) => p.stock < 5).length || 0;

  // Mapeamos los productos para incluir el nombre de la categoría
  const productsWithCategory = products.map((p) => ({
    ...p,
    categories: { name: categories.find((c) => c.id === p.category_id)?.name || 'Sin categoría' },
  }));

  // Filtramos la lista según la búsqueda y la categoría seleccionada
  const filteredProducts = productsWithCategory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory; // Aquí no validamos el stock porque es el inventario
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Productos</p>
              <p className="text-3xl font-bold text-slate-900">{productCount}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Stock Total</p>
              <p className="text-3xl font-bold text-slate-900">{totalStock}</p>
            </div>
            <div className={`rounded-lg border p-4 shadow-sm ${lowStockCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'bg-white border-slate-200'}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Bajo Stock</p>
              <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {lowStockCount}
              </p>
            </div>
          </div>

          {/* Inventario */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">Inventario</h2>
              <p className="text-sm text-slate-500 mt-1">Administra tus productos</p>
            </div>

            <ProductForm categories={categories} onProductCreated={handleProductCreated} />

            {/* Filtros */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-6 mt-8">
              <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                
                {/* Buscador */}
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar componente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                {/* Categorías */}
                <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto hide-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as any}
                    onUpdate={handleProductCreated}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-lg bg-slate-100 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  {products.length === 0 ? 'Sin productos' : 'No hay coincidencias'}
                </h3>
                <p className="text-sm text-slate-500">
                  {products.length === 0 
                    ? 'Crea tu primer producto para comenzar' 
                    : 'Intenta buscar con otras palabras o cambia la categoría'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}