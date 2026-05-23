'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import { getProducts, getCategories, initializeData, processSale, SaleRecord } from '../lib/storage';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category_id: string;
  imageUrl?: string;
  barcode?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function SalesDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Modales
  const [showCheckout, setShowCheckout] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  // --- ESTADOS DEL TOAST ---
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    initializeData();
    setProducts(getProducts());
    setCategories(getCategories());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > 0 && newQuantity <= item.stock) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      })
    );
  };

  // --- LÓGICA DEL ESCÁNER ---
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scannedCode = barcodeInput.trim();
      if (!scannedCode) return;

      const foundProduct = products.find(p => p.barcode === scannedCode || p.id === scannedCode);

      if (foundProduct) {
        if (foundProduct.stock > 0) {
          addToCart(foundProduct);
          setBarcodeInput('');
        } else {
          showToast(`¡El producto "${foundProduct.name}" no tiene stock!`, 'error');
          setBarcodeInput('');
        }
      } else {
        showToast('Código no encontrado en el inventario.', 'error');
        setBarcodeInput('');
      }
    }
  };

  const handleClearClick = () => setShowClearConfirm(true);
  const confirmClearCart = () => { setCart([]); setShowClearConfirm(false); };

  // --- LÓGICA DE COBRO ---
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const change = parseFloat(amountPaid || '0') - cartTotal;
  const isPaymentValid = parseFloat(amountPaid || '0') >= cartTotal;

  const handleConfirmSale = () => {
    if (!isPaymentValid) return;
    const ticket = processSale(cart, parseFloat(amountPaid), cartTotal);
    if (ticket) {
      setLastSale(ticket);
      setCart([]);
      setProducts(getProducts());
      setShowCheckout(false);
      setAmountPaid('');
      showToast('Venta procesada exitosamente', 'success');
    } else {
      showToast('Error: Stock insuficiente para procesar la venta.', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    const hasStock = p.stock > 0;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return hasStock && matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="print:hidden flex flex-col h-screen bg-slate-100 overflow-hidden">
        <Header />
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
          
          {/* --- COLUMNA IZQUIERDA: CATÁLOGO --- */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-2 sm:p-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex flex-col lg:flex-row gap-2 justify-between items-start lg:items-center">
                
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <div className="relative w-full sm:w-48">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Escanear..."
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeScan}
                      className="block w-full pl-8 pr-2 py-1.5 border border-blue-300 rounded text-xs bg-blue-50 placeholder-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="relative w-full sm:w-56">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar pieza..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto w-full lg:w-auto hide-scrollbar pb-1 lg:pb-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-3 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    type="button"
                    className="group flex flex-row h-20 bg-white rounded border border-slate-200 overflow-hidden text-left hover:border-slate-300 hover:shadow-sm transition-all focus:outline-none"
                  >
                    <div className="w-20 h-full bg-slate-100 shrink-0 border-r border-slate-100 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    
                    <div className="p-2 flex flex-col flex-1 justify-between min-w-0">
                      <h3 className="font-semibold text-slate-800 text-[11px] leading-tight line-clamp-2 truncate whitespace-normal">{product.name}</h3>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-sm font-black text-slate-900">
                          ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
                    No se encontraron productos.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- COLUMNA DERECHA: TICKET --- */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Ticket Actual</span>
              {cart.length > 0 && (
                <button onClick={handleClearClick} className="text-[10px] uppercase font-bold text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors">
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-white">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p className="text-xs font-medium">No hay artículos</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cart.map((item) => (
                    <div key={item.id} className="flex flex-col p-2 bg-slate-50 border border-slate-100 rounded">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-800 leading-tight flex-1">{item.name}</span>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center bg-white rounded border border-slate-200 shadow-sm">
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold text-xs">-</button>
                          <span className="text-[11px] font-bold w-4 text-center text-slate-900">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold text-xs">+</button>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          ${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase">Total a pagar</span>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  ${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="w-full bg-slate-900 text-white text-sm font-bold py-2.5 rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cobrar
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* --- TOAST NOTIFICATION --- */}
      <div className="print:hidden">
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl font-bold text-sm ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}>
              {toast.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.message}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALES (CONFIRMAR, COBRO Y TICKET PDF) --- */}
      <div className="print:hidden">
        {showClearConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Vaciar Ticket</h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-600 font-medium">
                  ¿Eliminar todas las piezas del ticket actual? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-100">
                  Cancelar
                </button>
                <button onClick={confirmClearCart} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                  Vaciar
                </button>
              </div>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-900 uppercase">Procesar Pago</h2>
                <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded">
                  <span className="text-xs font-medium uppercase">Total:</span>
                  <span className="text-xl font-black">${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Efectivo recibido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                      className="w-full pl-7 pr-3 py-2 text-base font-bold border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {amountPaid && parseFloat(amountPaid) > 0 && (
                  <div className={`flex justify-between items-center p-3 rounded border ${isPaymentValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`text-xs font-bold uppercase ${isPaymentValid ? 'text-green-700' : 'text-red-700'}`}>
                      {isPaymentValid ? 'Cambio:' : 'Falta:'}
                    </span>
                    <span className={`text-lg font-black ${isPaymentValid ? 'text-green-700' : 'text-red-700'}`}>
                      ${Math.abs(change).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleConfirmSale}
                  disabled={!isPaymentValid}
                  className="w-full py-2.5 bg-slate-900 text-white text-xs uppercase font-bold rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Confirmar Venta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {lastSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:backdrop-blur-none print:static print:p-0">
          <div className="bg-white w-full max-w-xs rounded-lg shadow-2xl flex flex-col max-h-[90vh] print:shadow-none print:max-w-full print:rounded-none">
            
            <div className="p-6 flex-1 overflow-y-auto font-mono text-xs text-slate-800 bg-white">
              <div className="text-center mb-4">
                <h2 className="text-lg font-black uppercase tracking-widest mb-1">.ComPonents</h2>
                <p className="text-[10px] text-slate-500 font-medium">COMPROBANTE DE VENTA</p>
                <p className="text-[10px] text-slate-500 mt-2">TICKET: {lastSale.id}</p>
                <p className="text-[10px] text-slate-500">{new Date(lastSale.created_at).toLocaleString()}</p>
              </div>

              <div className="border-b border-dashed border-slate-400 mb-3"></div>

              <table className="w-full mb-3">
                <thead>
                  <tr className="text-left text-[10px] border-b border-slate-200">
                    <th className="pb-1 font-bold w-8">CANT</th>
                    <th className="pb-1 font-bold">ARTÍCULO</th>
                    <th className="pb-1 text-right font-bold">IMP</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {lastSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-1 font-semibold">{item.quantity}</td>
                      <td className="py-1.5 pr-1 break-words text-[10px] leading-tight">{item.name}</td>
                      <td className="py-1.5 text-right font-semibold">${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-400 pt-3 mb-4">
                <div className="flex justify-between mb-1 font-black text-sm">
                  <span>TOTAL:</span>
                  <span>${lastSale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-1 text-slate-600">
                  <span>Efectivo:</span>
                  <span>${lastSale.amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cambio:</span>
                  <span>${lastSale.change.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 mt-6 font-medium">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-b-lg border-t border-slate-200 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2 rounded hover:bg-slate-100">
                Imprimir
              </button>
              <button onClick={() => setLastSale(null)} className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded hover:bg-slate-800">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}