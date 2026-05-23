'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-3">
        
        {/* Logo / Nombre - Orden 1 */}
        <div className="flex items-center gap-2 order-1 shrink-0">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            .ComPonents
          </span>
        </div>

        {/* Avatar - Orden 2 en móvil (arriba a la derecha), Orden 3 en PC (extremo derecho) */}
        <div className="order-2 md:order-3 w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-slate-600">A</span>
        </div>

        {/* Navegación - Orden 3 en móvil (abajo ocupando el 100%), Orden 2 en PC (centro) */}
        <nav className="order-3 md:order-2 w-full md:w-auto flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto hide-scrollbar">
          <Link
            href="/"
            className={`flex-1 md:flex-none text-center whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              pathname === '/' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Inventario
          </Link>
          
          <Link
            href="/ventas"
            className={`flex-1 md:flex-none text-center whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              pathname === '/ventas' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Punto de Venta
          </Link>

          <Link
            href="/reportes"
            className={`flex-1 md:flex-none text-center whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              pathname === '/reportes' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Reportes Financieros
          </Link>
        </nav>

      </div>
    </header>
  );
}