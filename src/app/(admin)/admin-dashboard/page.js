'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Ajusta la ruta a tu cliente Supabase
import { 
    Users, 
    UserCheck, 
    AlertTriangle, 
    Calendar, 
    Clock, 
    ArrowRight, 
    Loader2, 
    Utensils, 
    ShieldCheck,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';

const MAPA_GRUPOS = {
    1: { nombre: 'Puente', estilo: 'bg-blue-50 text-blue-700 border-blue-200' },
    2: { nombre: 'Buscadores', estilo: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    3: { nombre: 'Fluir', estilo: 'bg-purple-50 text-purple-700 border-purple-200' },
    4: { nombre: 'Reino', estilo: 'bg-amber-50 text-amber-700 border-amber-200' },
    5: { nombre: 'Conquistadores', estilo: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [servicioActivo, setServicioActivo] = useState('primer');
    const [fechaFormateada, setFechaFormateada] = useState('');

    // Estados de métricas
    const [totalMenoresBD, setTotalMenoresBD] = useState(0);
    const [asistentesHoy, setAsistentesHoy] = useState(0);
    const [conteosPorGrupo, setConteosPorGrupo] = useState({});
    const [alertasAlergiasCount, setAlertasAlergiasCount] = useState(0);

    const obtenerServicioJornadaId = () => (servicioActivo === 'primer' ? 1 : 2);

    const obtenerFechaHoyLocal = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const fechaHoy = obtenerFechaHoyLocal();

    useEffect(() => {
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        setFechaFormateada(new Date().toLocaleDateString('es-ES', opciones));
    }, []);

    const cargarMetricasDashboard = async () => {
        try {
            setLoading(true);
            const servicioId = obtenerServicioJornadaId();

            // 1. Total general de menores registrados en el sistema
            const { count: totalBD, error: errTotalBD } = await supabase
                .from('menores')
                .select('*', { count: 'exact', head: true });

            if (errTotalBD) throw errTotalBD;
            setTotalMenoresBD(totalBD || 0);

            // 2. Asistencias de hoy para el servicio seleccionado
            const { data: asistenciasHoy, error: errAsistencias } = await supabase
                .from('asistencias')
                .select('menorid')
                .eq('fechaasistencia', fechaHoy)
                .eq('serviciojornadaid', servicioId)
                .in('estadoasistencia', ['Presente', 'Retirado']);

            if (errAsistencias) throw errAsistencias;

            if (!asistenciasHoy || asistenciasHoy.length === 0) {
                setAsistentesHoy(0);
                setConteosPorGrupo({});
                setAlertasAlergiasCount(0);
                return;
            }

            setAsistentesHoy(asistenciasHoy.length);

            // 3. Consultar grupos y alergias de los asistentes
            const idsMenores = asistenciasHoy.map(a => a.menorid);
            const { data: detallesMenores, error: errMenores } = await supabase
                .from('menores')
                .select('grupoid, alergiasorestricciones')
                .in('id', idsMenores);

            if (errMenores) throw errMenores;

            const conteos = {};
            let contadorAlergias = 0;
            const ignorables = ['no', 'no aplica', 'ninguna', 'ninguno', 'n/a', 'na', ''];

            detallesMenores.forEach(m => {
                if (m.grupoid) {
                    conteos[m.grupoid] = (conteos[m.grupoid] || 0) + 1;
                }

                const alergia = m.alergiasorestricciones ? m.alergiasorestricciones.trim().toLowerCase() : '';
                if (alergia && !ignorables.includes(alergia)) {
                    contadorAlergias++;
                }
            });

            setConteosPorGrupo(conteos);
            setAlertasAlergiasCount(contadorAlergias);

        } catch (err) {
            console.error('Error cargando métricas de admin:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMetricasDashboard();
    }, [servicioActivo]);

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{fechaFormateada || 'Cargando fecha...'}</p>
                </div>

                {/* SELECTOR DE SERVICIO */}
                <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold self-start sm:self-auto">
                    <button
                        onClick={() => setServicioActivo('primer')}
                        className={`px-4 py-1.5 rounded-lg transition-all ${servicioActivo === 'primer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        1º Servicio
                    </button>
                    <button
                        onClick={() => setServicioActivo('segundo')}
                        className={`px-4 py-1.5 rounded-lg transition-all ${servicioActivo === 'segundo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        2º Servicio
                    </button>
                </div>
            </div>

            {/* TARJETAS KPI DE RESUMEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI: Asistencia Hoy */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Asistencia Hoy</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">
                            {loading ? '...' : asistentesHoy}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1">Niños presentes en este servicio</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI: Total Registrados */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Registrados</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">
                            {loading ? '...' : totalMenoresBD}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1">Base de datos general</p>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI: Alertas de Alergias */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Alertas Alimentarias</p>
                        <h2 className={`text-3xl font-black mt-1 ${alertasAlergiasCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {loading ? '...' : alertasAlergiasCount}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1">Casos especiales hoy</p>
                    </div>
                    <div className={`p-3 rounded-xl ${alertasAlergiasCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI: Porcentaje Asistencia */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">% Cobertura Hoy</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1">
                            {loading ? '...' : `${totalMenoresBD > 0 ? Math.round((asistentesHoy / totalMenoresBD) * 100) : 0}%`}
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1">Respecto al total general</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

            </div>

            {/* SECCIÓN DE ASISTENCIA POR GRUPOS */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Asistencia por Grupos Hoy</h2>
                    <span className="text-xs text-slate-400 font-medium">Servicio Activo</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500">Cargando datos por grupo...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                        {Object.entries(MAPA_GRUPOS).map(([id, info]) => {
                            const cantidad = conteosPorGrupo[id] || 0;
                            return (
                                <div key={id} className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
                                    <span className={`inline-block w-max px-2.5 py-1 rounded-lg border text-[11px] font-bold ${info.estilo}`}>
                                        {info.nombre}
                                    </span>
                                    <div className="mt-3">
                                        <p className="text-2xl font-black text-slate-800">{String(cantidad).padStart(2, '0')}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Asistentes</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MÓDULOS DE ACCESO RÁPIDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <Link 
                    href="/asistencia" 
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-slate-900 text-sm">Control de Asistencia</h3>
                        <p className="text-xs text-slate-500 mt-1">Tomar o actualizar lista de menores presentes del día.</p>
                    </div>
                </Link>

                <Link 
                    href="/refrigerios" 
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-slate-900 text-sm">Módulo de Refrigerios</h3>
                        <p className="text-xs text-slate-500 mt-1">Ver totales para cocina y lista unificada de alergias.</p>
                    </div>
                </Link>

                <Link 
                    href="/menores" 
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold text-slate-900 text-sm">Gestión de Menores</h3>
                        <p className="text-xs text-slate-500 mt-1">Registrar o actualizar información de los niños y sus grupos.</p>
                    </div>
                </Link>

            </div>

        </div>
    );
}