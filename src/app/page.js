'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Users, CheckSquare, AlertTriangle, UserPlus, 
  FileText, Bell, HelpCircle, Calendar, Settings, ShieldAlert
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, 
  BarElement, Title, Tooltip, Legend
} from 'chart.js';

// Registrar componentes necesarios para Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  
  // Datos de prueba basados en grafica de "Tendencia de Asistencia"
  const dataGrafica = {
    labels: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'],
    datasets: [
      {
        label: 'Kids 1-5',
        data: [45, 30, 52, 38, 25, 70, 185], // El domingo refleja el pico de 185 asistencias
        backgroundColor: '#1e56b8',
        borderRadius: 6,
      },
      {
        label: 'Pre-Teens',
        data: [20, 15, 25, 18, 12, 40, 95],
        backgroundColor: '#c084fc',
        borderRadius: 6,
      }
    ],
  };

  const opcionesGrafica = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
    },
    scales: {
      y: { grid: { display: false }, border: { display: false } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* MENU LATERAL IZQUIERDO (Sidebar) */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col justify-between p-6 shadow-xl">
        <div>
          <div className="mb-10 px-2">
            <h1 className="text-xl font-bold tracking-wide">Sin Muros Kids</h1>
            <p className="text-xs text-slate-400 tracking-wider">MINISTRY MANAGEMENT</p>
          </div>
          
          <nav className="space-y-2">
            <button className="flex items-center space-x-3 w-full p-3 bg-violet-600 rounded-xl font-medium text-left shadow-lg shadow-violet-600/30">
              <Users className="w-5 h-5" /> <span>Dashboard</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-xl text-left transition">
              <Users className="w-5 h-5" /> <span>Kids</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-xl text-left transition">
              <CheckSquare className="w-5 h-5" /> <span>Attendance</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 text-slate-400 hover:bg-slate-800 rounded-xl text-left transition">
              <FileText className="w-5 h-5" /> <span>Reports</span>
            </button>
          </nav>
        </div>
        
        <div className="pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-400">
          <button className="flex items-center space-x-3 w-full p-2.5 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <Settings className="w-4 h-4" /> <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* AREA DE CONTENIDO */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* ENCABEZADO SUPERIOR */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-72">
            <input 
              type="text" 
              placeholder="Search Kids or documents..." 
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div className="flex items-center space-x-6">
            <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
            <HelpCircle className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
            <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition">
              Check-in rápido
            </button>
            <div className="flex items-center space-x-3 border-l pl-6 border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold">Admin SMK</p>
                <p className="text-xs text-slate-400">Coordinador General</p>
              </div>
              <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                A
              </div>
            </div>
          </div>
        </header>

        {/* TITULO */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Control</h2>
            <p className="text-sm text-slate-500">Resumen administrativo de hoy</p>
          </div>
          <button className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm transition text-slate-600">
            <Calendar className="w-4 h-4" /> <span>Últimos 30 días</span>
          </button>
        </div>

        {/* INDICADORES (TARJETAS SUPERIORES) */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2">Niños Activos</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight">412</span>
              <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-md">+12%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2">Líderes Totales</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight">58</span>
              <span className="text-xs font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">Estable</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2">Asistencia Promedio</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight">89%</span>
              <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-md">+4%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500 border-t border-b border-r border-slate-100 relative overflow-hidden">
            <p className="text-sm font-medium text-red-600 mb-2 flex items-center space-x-1">
              <ShieldAlert className="w-4 h-4" /> <span>Alertas Pendientes</span>
            </p>
            <p className="text-3xl font-bold text-red-600 tracking-tight">03</p>
            <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </div>
        </section>

        {/* GRAFICA Y ACCIONES RAPIDAS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Tendencia de Asistencia</h3>
            <div className="h-60">
              <Bar data={dataGrafica} options={opcionesGrafica} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <button className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all text-left border border-slate-100 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CheckSquare className="w-5 h-5" /></div>
                  <span className="font-semibold text-sm text-slate-700">Tomar Asistencia</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
              </button>
              
              <button className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all text-left border border-slate-100 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><UserPlus className="w-5 h-5" /></div>
                  <span className="font-semibold text-sm text-slate-700">Registrar Nuevo Niño</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</span>
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}