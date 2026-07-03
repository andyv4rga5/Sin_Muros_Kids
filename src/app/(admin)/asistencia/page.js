'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// Importamos la colección de íconos profesionales requeridos según image_4b5f7d.jpg
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  SlidersHorizontal, 
  Download, 
  Calendar,
  CheckCircle2,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AsistenciaPage() {
  const [servicioActivo, setServicioActivo] = useState('primer'); // 'primer' o 'segundo'
  const [filtroGrupo, setFiltroGrupo] = useState('todos'); // 'todos', 'exploradores', 'guerreros'
  
  // Datos simulados estructurados exactamente igual a la interfaz de image_4b5f7d.jpg
  const [asistenciaKids, setAsistenciaKids] = useState([
    { id: 'SMK-2023-01', nombre: 'Mateo Arboleda', grupo: 'Reino', colorGrupo: 'bg-amber-50 text-amber-700 border-amber-200', checkIn: '08:45 AM', avatar: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150' },
    { id: 'SMK-2023-02', nombre: 'Lucas Castro', grupo: 'Semilla', colorGrupo: 'bg-emerald-50 text-emerald-700 border-emerald-200', checkIn: '--:--', avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' },
    { id: 'SMK-2023-03', nombre: 'Sofía García', grupo: 'Fluir', colorGrupo: 'bg-purple-50 text-purple-700 border-purple-200', checkIn: '09:02 AM', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  ]);

  const [lideres, setLideres] = useState([
    { iniciales: 'RP', nombre: 'Ricardo P.', activo: true },
    { iniciales: 'MA', nombre: 'Mariana A.', activo: true },
    { iniciales: 'JV', nombre: 'Jorge V.', activo: false },
  ]);

  return (
    <div className="space-y-6">
      
      {/* HEADER DE CONTROL DE ASISTENCIA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Control de Asistencia</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión administrativa de servicios dominicales</p>
        </div>
        
        {/* Selectores de Servicio y Fecha */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button 
              onClick={() => setServicioActivo('primer')}
              className={`px-4 py-1.5 rounded-lg transition-all ${servicioActivo === 'primer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Primer Servicio
            </button>
            <button 
              onClick={() => setServicioActivo('segundo')}
              className={`px-4 py-1.5 rounded-lg transition-all ${servicioActivo === 'segundo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Segundo Servicio
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>22 Oct, 2023</span>
          </div>
        </div>
      </div>

      {/* RECUADROS DE MÉTRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 leading-none">128</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Total Esperado</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 leading-none">84</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Presentes Hoy</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32">
          <div>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl inline-block">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 leading-none">18</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Líderes Activos</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32">
          <div>
            <span className="p-2 bg-red-50 text-red-600 rounded-xl inline-block">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 leading-none">03</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Alertas Pendientes</p>
          </div>
        </div>
      </div>

      {/* AREA DE CONTENIDO: TABLA + BARRA LATERAL DE LIDERAZGO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LISTADO DE NIÑOS (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Header del listado y filtros */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800">Listado de Niños</h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <button 
                  onClick={() => setFiltroGrupo('exploradores')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filtroGrupo === 'exploradores' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Exploradores
                </button>
                <button 
                  onClick={() => setFiltroGrupo('guerreros')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filtroGrupo === 'guerreros' ? 'bg-purple-50 text-purple-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Guerreros
                </button>
              </div>
            </div>

            {/* Acciones de filtrado y descarga */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabla de registros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50/70">
                  <th className="py-3 px-6">Niño / Identificación</th>
                  <th className="py-3 px-4">Grupo</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-6 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {asistenciaKids.map((kid) => (
                  <tr key={kid.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img 
                        src={kid.avatar} 
                        alt={kid.nombre} 
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{kid.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {kid.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${kid.colorGrupo}`}>
                        {kid.grupo}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-slate-600">
                      {kid.checkIn}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {kid.checkIn !== '--:--' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Presente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          <UserX className="w-3 h-3" /> Ausente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación inferior */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Mostrando 1 - 3 de 128 registros</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">1</button>
              <button className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center">2</button>
              <button className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center">3</button>
              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* SECCIÓN LATERAL DERECHA: LIDERAZGO (Ocupa 1 columna) */}
        <div className="bg-[#111827] text-slate-300 p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">Liderazgo</h2>
            <span className="text-[9px] font-bold bg-slate-800 text-blue-400 px-2 py-0.5 rounded-full">82% Activo</span>
          </div>

          <div className="space-y-2.5">
            {lideres.map((lider, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white ${
                    idx === 0 ? 'bg-amber-600' : idx === 1 ? 'bg-blue-600' : 'bg-slate-600'
                  }`}>
                    {lider.iniciales}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{lider.nombre}</span>
                </div>

                {/* Acciones dinámicas de estado basadas en el mockup */}
                {lider.activo ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <button className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-md text-[10px] font-bold transition-all border border-purple-500/20">
                    <Phone className="w-2.5 h-2.5" /> Llamar
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-white font-bold text-xs rounded-xl transition-all border border-slate-700/50">
            Ver todos los líderes
          </button>
        </div>
      </div>
    </div>
  );
}