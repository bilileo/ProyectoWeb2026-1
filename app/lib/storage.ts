'use client';

// Tipos
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category_id: string;
  category_name?: string;
  created_at: string;
  imageUrl?: string;// base64 encoded image
  barcode?: string; 
}

export interface Category {
  id: string;
  name: string;
}

// Productos
export function getProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  const products = localStorage.getItem('products');
  return products ? JSON.parse(products) : [];
}

export function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };
  products.push(newProduct);
  localStorage.setItem('products', JSON.stringify(products));
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates };
  localStorage.setItem('products', JSON.stringify(products));
  return products[index];
}

export function deleteProduct(id: string) {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem('products', JSON.stringify(filtered));
  return true;
}

// Categorías
export function getCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  const categories = localStorage.getItem('categories');
  return categories ? JSON.parse(categories) : getDefaultCategories();
}

function getDefaultCategories(): Category[] {
  const defaults = [
    { id: '1', name: 'Procesadores' },
    { id: '2', name: 'Tarjetas Gráficas' },
    { id: '3', name: 'Memoria RAM' },
    { id: '4', name: 'SSD/HDD' },
    { id: '5', name: 'Motherboards' },
    { id: '6', name: 'Fuentes de Poder' },
    { id: '7', name: 'Enfriamiento' },
    { id: '8', name: 'Periféricos' },
  ];
  localStorage.setItem('categories', JSON.stringify(defaults));
  return defaults;
}

export function addCategory(name: string) {
  const categories = getCategories();
  const newCategory: Category = {
    id: Date.now().toString(),
    name,
  };
  categories.push(newCategory);
  localStorage.setItem('categories', JSON.stringify(categories));
  return newCategory;
}

// Exportar todo
export function clearAllData() {
  localStorage.removeItem('products');
  localStorage.removeItem('categories');
}

export function initializeData() {
  getCategories(); // Inicializa categorías por defecto
}

// --- AGREGAR AL FINAL DE lib/storage.ts ---

export interface SaleRecord {
  id: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  amountPaid: number;
  change: number;
  created_at: string;
}

export function getSales(): SaleRecord[] {
  if (typeof window === 'undefined') return [];
  const sales = localStorage.getItem('sales');
  return sales ? JSON.parse(sales) : [];
}

// Reemplaza tu antigua función processSale por esta:
export function processSale(cartItems: { id: string; name: string; price: number; quantity: number }[], amountPaid: number, total: number) {
  if (typeof window === 'undefined') return null;
  
  const products = getProducts();
  let isValidSale = true;
  
  // 1. Descontar Stock
  const updatedProducts = products.map(product => {
    const cartItem = cartItems.find(item => item.id === product.id);
    if (cartItem) {
      const newStock = product.stock - cartItem.quantity;
      if (newStock < 0) isValidSale = false;
      return { ...product, stock: Math.max(0, newStock) };
    }
    return product;
  });

  if (!isValidSale) return null; // Falla si no hay stock

  // 2. Guardar el nuevo stock
  localStorage.setItem('products', JSON.stringify(updatedProducts));

  // 3. Crear el registro de la venta
  const sales = getSales();
  const newSale: SaleRecord = {
    id: `TKT-${Date.now().toString().slice(-6)}`, // Genera un ID estilo TKT-123456
    items: cartItems,
    total,
    amountPaid,
    change: amountPaid - total,
    created_at: new Date().toISOString(),
  };

  sales.push(newSale);
  localStorage.setItem('sales', JSON.stringify(sales));

  return newSale; // Retornamos el ticket para mostrarlo
}

