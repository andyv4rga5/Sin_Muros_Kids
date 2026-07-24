'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Calendar, Loader2, AlertTriangle } from 'lucide-react';

const MAPA_GRUPOS = {
    1: { nombre: 'Puente', estilo: 'bg-blue-50 text-blue-700 border-blue-200' },
    2: { nombre: 'Buscadores', estilo: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    3: { nombre: 'Fluir', estilo: 'bg-purple-50 text-purple-700 border-purple-200' },
    4: { nombre: 'Reino', estilo: 'bg-amber-50 text-amber-700 border-amber-200' },
    5: { nombre: 'Conquistadores', estilo: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function RefrigeriosPage() {
    const [servicioActivo, setServicioActivo] = useState('primer');
    const [loadingDatos, setLoadingDatos] = useState(true);
    const [fechaFormateada, setFechaFormateada] = useState('');

    // Estado para guardar el conteo por grupo ID { 1: 3, 2: 7, ... }
    const [conteosPorGrupo, setConteosPorGrupo] = useState({});
    const [totalAsistentes, setTotalAsistentes] = useState(0);

    // Lista de textos únicos de alergias/restricciones presentes
    const [alergiasDelDia, setAlergiasDelDia] = useState([]);

    const obtenerServicioJornadaId = () => {
        return servicioActivo === 'primer' ? 1 : 2;
    };

    const obtenerFechaHoyLocal = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const fechaHoy = obtenerFechaHoyLocal();

    useEffect(() => {
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        const fechaHoyStr = new Date().toLocaleDateString('es-ES', opciones);
        setFechaFormateada(fechaHoyStr);
    }, []);

    const cargarConteosRefrigerios = async () => {
        try {
            setLoadingDatos(true);
            const servicioId = obtenerServicioJornadaId();

            // Traer solo las asistencias activas del dia para este servicio
            const { data: listaAsistencias, error: errAsistencias } = await supabase
                .from('asistencias')
                .select('menorid, estadoasistencia')
                .eq('fechaasistencia', fechaHoy)
                .eq('serviciojornadaid', servicioId)
                .in('estadoasistencia', ['Presente', 'Retirado']);

            if (errAsistencias) throw errAsistencias;

            if (!listaAsistencias || listaAsistencias.length === 0) {
                setConteosPorGrupo({});
                setTotalAsistentes(0);
                setAlergiasDelDia([]);
                return;
            }

            // Obtener los IDs de los menores que asistieron
            const idsMenoresAsistieron = listaAsistencias.map(a => a.menorid);

            // Consultar grupo y alergias de esos menores
            const { data: menoresDetalles, error: errMenores } = await supabase
                .from('menores')
                .select('grupoid, alergiasorestricciones')
                .in('id', idsMenoresAsistieron);

            if (errMenores) throw errMenores;

            // Procesar datos
            const mapeoConteos = {};
            let total = 0;
            const conjuntoAlergias = new Set(); // Evita textos repetidos idénticos

            const valoresIgnorables = ['no', 'no aplica', 'ninguna', 'ninguno', 'n/a', 'na', ''];

            menoresDetalles.forEach(menor => {
                // Sumar al conteo por grupo
                if (menor.grupoid) {
                    mapeoConteos[menor.grupoid] = (mapeoConteos[menor.grupoid] || 0) + 1;
                    total++;
                }

                // Evaluar la restricción
                const textoOriginal = menor.alergiasorestricciones ? menor.alergiasorestricciones.trim() : '';
                const textoMinuscula = textoOriginal.toLowerCase();

                if (textoOriginal && !valoresIgnorables.includes(textoMinuscula)) {
                    // Guardar el texto original respetando mayúsculas/minúsculas
                    conjuntoAlergias.add(textoOriginal);
                }
            });

            setConteosPorGrupo(mapeoConteos);
            setTotalAsistentes(total);
            setAlergiasDelDia(Array.from(conjuntoAlergias));

        } catch (err) {
            console.error("Error calculando refrigerios:", err.message);
        } finally {
            setLoadingDatos(false);
        }
    };

    useEffect(() => {
        cargarConteosRefrigerios();
    }, [servicioActivo]);

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Distribución de Refrigerios</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Métricas de preparación basadas en la asistencia del día</p>
                </div>

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
                        <span className="capitalize">{fechaFormateada || 'Cargando...'}</span>
                    </div>
                </div>
            </div>

            {/* RECUADRO ANÓNIMO DE ALERTAS ALIMENTARIAS */}
            {!loadingDatos && alergiasDelDia.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2.5 text-red-800 pb-3 mb-3 border-b border-red-200/60">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 animate-pulse" />
                        <div>
                            <h3 className="font-bold text-sm leading-none">Restricciones Alimentarias Detectadas</h3>
                            <p className="text-[11px] text-red-600/80 mt-1">
                                Atención al armar los platos de este servicio. Se registraron las siguientes condiciones:
                            </p>
                        </div>
                    </div>

                    {/* Tags con las alertas específicas encontradas */}
                    <div className="flex flex-wrap gap-2">
                        {alergiasDelDia.map((alergia, indice) => (
                            <div
                                key={indice}
                                className="bg-white border border-red-200 px-3.5 py-2 rounded-xl text-xs font-black text-red-700 shadow-2xs flex items-center gap-1.5 uppercase tracking-wide"
                            >
                                <span className="text-sm">⚠️</span> {alergia}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RECUADRO INFORMATIVO TOTAL GENERAL */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total General de Refrigerios</p>
                    <h2 className="text-4xl font-black mt-1">
                        {loadingDatos ? '...' : totalAsistentes} <span className="text-lg font-normal text-slate-400">refrigerios en total</span>
                    </h2>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* METRICAS POR GRUPO */}
            <div className="relative">
                {loadingDatos ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500 font-medium">Calculando niños asistentes por grupo...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                        {Object.entries(MAPA_GRUPOS).map(([id, info]) => {
                            const cantidad = conteosPorGrupo[id] || 0;

                            return (
                                <div
                                    key={id}
                                    className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between h-28 sm:h-32 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`p-2 rounded-xl border text-xs font-bold ${info.estilo}`}>
                                            {info.nombre}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 leading-none">
                                            {String(cantidad).padStart(2, '0')}
                                        </h3>
                                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">
                                            {cantidad === 1 ? 'Niño asistiendo' : 'Niños asistiendo'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}