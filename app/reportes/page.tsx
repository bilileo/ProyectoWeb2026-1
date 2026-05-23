'use client';

import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getSales, SaleRecord } from '../lib/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductStats {
  id: string;
  name: string;
  quantitySold: number;
  revenueGenerated: number;
}

export default function ReportsDashboard() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setSales(getSales());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- CÁLCULOS FINANCIEROS (KPIs) ---
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTickets = sales.length;
  const averageTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
  
  const totalItemsSold = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // --- ANÁLISIS DE PRODUCTOS ---
  const productPerformance: Record<string, ProductStats> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productPerformance[item.id]) {
        productPerformance[item.id] = { id: item.id, name: item.name, quantitySold: 0, revenueGenerated: 0 };
      }
      productPerformance[item.id].quantitySold += item.quantity;
      productPerformance[item.id].revenueGenerated += (item.price * item.quantity);
    });
  });

  const topProducts = Object.values(productPerformance)
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    .slice(0, 5);

  // --- OPTIMIZACIÓN UI: Solo mostramos los últimos 100 en pantalla ---
  const reversedSales = [...sales].reverse();
  const displayedSales = reversedSales.slice(0, 100);

  // --- GENERACIÓN DEL PDF MASIVO ---
  const generatePDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('es-MX');

      // 1. Cabecera del Documento
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('.ComPonents - Reporte Financiero', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 14, 30);
      doc.text(`Total de registros procesados: ${totalTickets}`, 14, 35);

      // 2. Resumen de KPIs (Tabla pequeña)
      autoTable(doc, {
        startY: 45,
        head: [['Ingresos Brutos', 'Ticket Promedio', 'Ventas Totales', 'Piezas Movidas']],
        body: [[
          `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          `$${averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          totalTickets.toString(),
          totalItemsSold.toString()
        ]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
      });

      // 3. Libro Mayor (Procesa TODOS los miles de registros, paginando automáticamente)
      // Mapeamos los datos para que sean legibles en el PDF
      const tableData = reversedSales.map(sale => {
        // Juntamos todos los items en un solo string con saltos de línea
        const itemsString = sale.items.map(i => `${i.quantity}x ${i.name}`).join('\n');
        
        return [
          sale.id,
          new Date(sale.created_at).toLocaleDateString('es-MX'),
          itemsString,
          `$${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Ticket', 'Fecha', 'Artículos (Desglose)', 'Total']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [71, 85, 105] }, // slate-600
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30, halign: 'right' }
        },
        margin: { top: 15 },
        didDrawPage: function (data) {
          // Usamos data.pageNumber que viene nativo y seguro en jspdf-autotable
          const str = 'Página ' + data.pageNumber;
          doc.setFontSize(8);
          const pageSize = doc.internal.pageSize;
          // Manejo seguro para versiones nuevas y viejas de jsPDF
          const pageHeight = typeof pageSize.getHeight === 'function' 
            ? pageSize.getHeight() 
            : pageSize.height;
          
          doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
      });

      // Guardar archivo
      doc.save(`.ComPonents_Reporte_${dateStr.replace(/\//g, '-')}.pdf`);
      setIsExporting(false);
    }, 100); // Pequeño timeout para permitir que el botón cambie a estado de "Cargando"
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* Cabecera con Botón de Exportación */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inteligencia Financiera</h1>
            <p className="text-slate-500 mt-1">Análisis de rendimiento, flujo de caja y movimientos de inventario.</p>
          </div>
          
          <button
            onClick={generatePDF}
            disabled={isExporting || sales.length === 0}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Exportar Reporte Maestro
              </>
            )}
          </button>
        </div>

        {/* --- TARJETAS DE KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingresos Brutos</h3>
            <p className="text-3xl font-black text-green-600">
              ${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ticket Promedio</h3>
            <p className="text-3xl font-black text-slate-900">
              ${averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Gasto promedio por cliente</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ventas Concretadas</h3>
            <p className="text-3xl font-black text-slate-900">{totalTickets}</p>
            <p className="text-xs text-slate-400 mt-1">Tickets generados</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rotación de Piezas</h3>
            <p className="text-3xl font-black text-blue-600">{totalItemsSold}</p>
            <p className="text-xs text-slate-400 mt-1">Unidades totales vendidas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- TOP PRODUCTOS --- */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              Productos Estrella
            </h2>
            
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay datos suficientes.</p>
            ) : (
              <div className="space-y-5">
                {topProducts.map((prod, index) => {
                  const maxRevenue = topProducts[0].revenueGenerated;
                  const percentage = Math.max((prod.revenueGenerated / maxRevenue) * 100, 5);

                  return (
                    <div key={prod.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-700 truncate pr-2">{index + 1}. {prod.name}</span>
                        <span className="font-bold text-slate-900">${prod.revenueGenerated.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>{prod.quantitySold} unidades movidas</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-slate-900 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- LIBRO MAYOR (INTERFAZ OPTIMIZADA) --- */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Libro Mayor de Transacciones</h2>
                <p className="text-xs text-slate-500 mt-1">Mostrando los últimos 100 movimientos en pantalla.</p>
              </div>
              {sales.length > 100 && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  + {sales.length - 100} ocultos (Visibles en PDF)
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Fecha / Ticket</th>
                    <th className="p-4">Desglose de Artículos</th>
                    <th className="p-4 text-right">Efectivo</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">No hay transacciones registradas aún.</td>
                    </tr>
                  ) : (
                    displayedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 align-top">
                          <p className="font-bold text-slate-900">{sale.id}</p>
                          <p className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(sale.created_at).toLocaleDateString('es-MX', { 
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </td>
                        <td className="p-4 align-top max-w-xs">
                          <ul className="text-xs text-slate-600 space-y-1">
                            {sale.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between gap-4">
                                <span className="truncate">{item.quantity}x {item.name}</span>
                                <span className="text-slate-400">${(item.price * item.quantity).toLocaleString('es-MX')}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top text-right text-slate-500 font-medium">
                          ${sale.amountPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 align-top text-right font-black text-slate-900">
                          ${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}