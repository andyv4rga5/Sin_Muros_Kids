'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import {
    Users,
    UserCheck,
    AlertTriangle,
    Calendar,
    Loader2,
    ShieldCheck,
    UserPlus,
    TrendingUp,
    PieChart as PieChartIcon,
    FileSpreadsheet,
    Download,
    UserCheck2,
    X,
    Search,
    PlusCircle
} from 'lucide-react';

// Importaciones para Chart.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MAPA_GRUPOS = {
    1: { nombre: 'Puente', color: '#3b82f6', estilo: 'bg-blue-50 text-blue-700 border-blue-200' },
    2: { nombre: 'Buscadores', color: '#10b981', estilo: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    3: { nombre: 'Fluir', color: '#a855f7', estilo: 'bg-purple-50 text-purple-700 border-purple-200' },
    4: { nombre: 'Reino', color: '#f59e0b', estilo: 'bg-amber-50 text-amber-700 border-amber-200' },
    5: { nombre: 'Conquistadores', color: '#f43f5e', estilo: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function AdminDashboardPage() {
    // Función para obtener 'YYYY-MM-DD' exacta sin desfasamiento UTC
    const formatearFechaISO = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fechaHoyStr = formatearFechaISO(new Date());

    // Hace 30 días exactos para el rango inicial de la gráfica
    const haceUnMes = new Date();
    haceUnMes.setDate(haceUnMes.getDate() - 30);
    const haceUnMesStr = formatearFechaISO(haceUnMes);

    // Estado principal del día seleccionado
    const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoyStr);

    // Estados para el rango de fechas de la GRÁFICA DE TENDENCIA
    const [fechaInicioGrafica, setFechaInicioGrafica] = useState(haceUnMesStr);
    const [fechaFinGrafica, setFechaFinGrafica] = useState(fechaHoyStr);
    const [loadingGrafica, setLoadingGrafica] = useState(false);

    // Estados para el rango de fechas del REPORTE EXCEL
    const [fechaInicioReporte, setFechaInicioReporte] = useState(haceUnMesStr);
    const [fechaFinReporte, setFechaFinReporte] = useState(fechaHoyStr);
    const [exportandoExcel, setExportandoExcel] = useState(false);

    const [loading, setLoading] = useState(true);
    const [servicioActivo, setServicioActivo] = useState('primer');
    const [fechaFormateada, setFechaFormateada] = useState('');

    // Estados de métricas del día
    const [totalMenoresBD, setTotalMenoresBD] = useState(0);
    const [asistentesDia, setAsistentesDia] = useState(0);
    const [ninosNuevosCount, setNinosNuevosCount] = useState(0);
    const [conteosPorGrupo, setConteosPorGrupo] = useState({});
    const [alertasAlergiasCount, setAlertasAlergiasCount] = useState(0);

    // Estado para la gráfica de línea
    const [datosTendencia, setDatosTendencia] = useState({ labels: [], data: [] });

    // --- ESTADOS PARA EL MODAL DE AGREGAR ACUDIENTE ---
    const [modalAcudienteAbierto, setModalAcudienteAbierto] = useState(false);
    const [busquedaMenor, setBusquedaMenor] = useState('');
    const [listaMenoresEncontrados, setListaMenoresEncontrados] = useState([]);
    const [menorSeleccionado, setMenorSeleccionado] = useState(null);

    // Formulario de Acudiente
    const [telefonoAcudiente, setTelefonoAcudiente] = useState('');
    const [nombreAcudiente, setNombreAcudiente] = useState('');
    const [apellidoAcudiente, setApellidoAcudiente] = useState('');
    const [correoAcudiente, setCorreoAcudiente] = useState('');
    const [parentesco, setParentesco] = useState('Padre');
    const [esPrincipal, setEsPrincipal] = useState(true);
    const [acudienteExistenteId, setAcudienteExistenteId] = useState(null);

    const [guardandoAcudiente, setGuardandoAcudiente] = useState(false);
    const [mensajeModal, setMensajeModal] = useState({ tipo: '', texto: '' });

    const obtenerServicioJornadaId = () => (servicioActivo === 'primer' ? 1 : 2);

    // Texto legible del día seleccionado
    useEffect(() => {
        if (!fechaSeleccionada) return;
        const [year, month, day] = fechaSeleccionada.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day);
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        setFechaFormateada(fechaObj.toLocaleDateString('es-ES', opciones));
    }, [fechaSeleccionada]);

    // 1. Cargar datos del día (KPIs y distribución)
    const cargarMetricasDashboard = async () => {
        try {
            setLoading(true);
            const servicioId = obtenerServicioJornadaId();

            // Total general en la BD
            const { count: totalBD, error: errTotalBD } = await supabase
                .from('menores')
                .select('*', { count: 'exact', head: true });

            if (errTotalBD) throw errTotalBD;
            setTotalMenoresBD(totalBD || 0);

            // Niños Nuevos este día
            const isoInicio = `${fechaSeleccionada}T00:00:00.000Z`;
            const isoFin = `${fechaSeleccionada}T23:59:59.999Z`;

            const { count: nuevosCount, error: errNuevos } = await supabase
                .from('menores')
                .select('*', { count: 'exact', head: true })
                .gte('fechacreacion', isoInicio)
                .lte('fechacreacion', isoFin);

            if (!errNuevos) {
                setNinosNuevosCount(nuevosCount || 0);
            }

            // Asistencias del día y servicio activo
            const { data: asistencias, error: errAsistencias } = await supabase
                .from('asistencias')
                .select('menorid, fechaasistencia')
                .eq('fechaasistencia', fechaSeleccionada)
                .eq('serviciojornadaid', servicioId)
                .in('estadoasistencia', ['Presente', 'Retirado']);

            if (errAsistencias) throw errAsistencias;

            if (asistencias && asistencias.length > 0) {
                setAsistentesDia(asistencias.length);

                const idsMenores = Array.from(new Set(asistencias.map(a => a.menorid)));
                const { data: detallesMenores, error: errMenores } = await supabase
                    .from('menores')
                    .select('grupoid, alergiasorestricciones')
                    .in('id', idsMenores);

                if (errMenores) throw errMenores;

                const conteos = {};
                let contadorAlergias = 0;
                const ignorables = ['no', 'no aplica', 'ninguna', 'ninguno', 'n/a', 'na', ''];

                detallesMenores.forEach(m => {
                    if (m.grupoid) conteos[m.grupoid] = (conteos[m.grupoid] || 0) + 1;

                    const alergia = m.alergiasorestricciones ? m.alergiasorestricciones.trim().toLowerCase() : '';
                    if (alergia && !ignorables.includes(alergia)) contadorAlergias++;
                });

                setConteosPorGrupo(conteos);
                setAlertasAlergiasCount(contadorAlergias);
            } else {
                setAsistentesDia(0);
                setConteosPorGrupo({});
                setAlertasAlergiasCount(0);
            }

        } catch (err) {
            console.error('Error cargando métricas de admin:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Cargar datos de la Gráfica de Tendencia
    const cargarTendenciaGrafica = async () => {
        try {
            setLoadingGrafica(true);
            const servicioId = obtenerServicioJornadaId();

            const { data: asistenciasRango, error: errRango } = await supabase
                .from('asistencias')
                .select('fechaasistencia')
                .gte('fechaasistencia', fechaInicioGrafica)
                .lte('fechaasistencia', fechaFinGrafica)
                .eq('serviciojornadaid', servicioId)
                .in('estadoasistencia', ['Presente', 'Retirado']);

            if (errRango) throw errRango;

            if (asistenciasRango && asistenciasRango.length > 0) {
                const agrupado = {};
                asistenciasRango.forEach(a => {
                    agrupado[a.fechaasistencia] = (agrupado[a.fechaasistencia] || 0) + 1;
                });

                const fechasOrdenadas = Object.keys(agrupado).sort();
                const labels = fechasOrdenadas.map(f => {
                    const [y, m, d] = f.split('-');
                    return `${d}/${m}`;
                });
                const dataValues = fechasOrdenadas.map(f => agrupado[f]);

                setDatosTendencia({ labels, data: dataValues });
            } else {
                setDatosTendencia({ labels: ['Sin registros'], data: [0] });
            }
        } catch (err) {
            console.error('Error cargando tendencia:', err.message);
        } finally {
            setLoadingGrafica(false);
        }
    };

    // 3. Generar y descargar reporte en Excel
    const generarReporteExcel = async () => {
        try {
            setExportandoExcel(true);

            const { data: reporteData, error } = await supabase
                .from('asistencias')
                .select(`
                    fechaasistencia,
                    estadoasistencia,
                    serviciojornadaid,
                    menores!menorid (
                        nombrecompleto,
                        apellidocompleto,
                        documentoidentidad,
                        alergiasorestricciones,
                        grupoid
                    )
                `)
                .gte('fechaasistencia', fechaInicioReporte)
                .lte('fechaasistencia', fechaFinReporte)
                .in('estadoasistencia', ['Presente', 'Retirado'])
                .order('fechaasistencia', { ascending: true });

            if (error) throw error;

            if (!reporteData || reporteData.length === 0) {
                alert('No se encontraron registros de asistencia en el rango de fechas seleccionado.');
                return;
            }

            const filasExcel = reporteData.map(item => {
                const menor = item.menores || {};
                const grupoNombre = MAPA_GRUPOS[menor.grupoid]?.nombre || 'Sin Grupo';
                const servicioTexto = item.serviciojornadaid === 1 ? '1º Servicio' : '2º Servicio';

                return {
                    'Fecha Asistencia': item.fechaasistencia,
                    'Servicio': servicioTexto,
                    'Nombres': menor.nombrecompleto || 'N/A',
                    'Apellidos': menor.apellidocompleto || 'N/A',
                    'Documento': menor.documentoidentidad || 'N/A',
                    'Grupo': grupoNombre,
                    'Estado': item.estadoasistencia,
                    'Alergias / Restricciones': menor.alergiasorestricciones || 'Ninguna'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(filasExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

            worksheet['!cols'] = [
                { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
                { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 30 }
            ];

            const nombreArchivo = `Reporte_Asistencias_${fechaInicioReporte}_al_${fechaFinReporte}.xlsx`;
            XLSX.writeFile(workbook, nombreArchivo);

        } catch (err) {
            console.error('Error generando reporte Excel:', err.message);
            alert('Ocurrió un error al intentar exportar el reporte en Excel.');
        } finally {
            setExportandoExcel(false);
        }
    };

    // --- MÉTODOS DEL MODAL PARA VINCULAR ACUDIENTE ---

    // Buscar niño por nombre, apellido o documento
    const buscarMenorPorTexto = async (texto) => {
        setBusquedaMenor(texto);
        if (texto.trim().length < 2) {
            setListaMenoresEncontrados([]);
            return;
        }

        const { data, error } = await supabase
            .from('menores')
            .select('id, nombrecompleto, apellidocompleto, documentoidentidad, grupoid')
            .or(`nombrecompleto.ilike.%${texto}%,apellidocompleto.ilike.%${texto}%,documentoidentidad.ilike.%${texto}%`)
            .limit(5);

        if (!error && data) {
            setListaMenoresEncontrados(data);
        }
    };

    // Verificar si el acudiente existe por teléfono
    const buscarAcudientePorTelefono = async (tel) => {
        setTelefonoAcudiente(tel);
        if (tel.trim().length < 7) {
            setAcudienteExistenteId(null);
            return;
        }

        const { data, error } = await supabase
            .from('acudientes')
            .select('id, nombrecompleto, apellidocompleto, correoelectronico')
            .eq('telefonocontacto', tel.trim())
            .maybeSingle();

        if (data) {
            setAcudienteExistenteId(data.id);
            setNombreAcudiente(data.nombrecompleto);
            setApellidoAcudiente(data.apellidocompleto);
            setCorreoAcudiente(data.correoelectronico || '');
            setMensajeModal({ tipo: 'info', texto: '¡Acudiente encontrado en el sistema! Se vinculará este registro.' });
        } else {
            setAcudienteExistenteId(null);
            setMensajeModal({ tipo: '', texto: '' });
        }
    };

    // Guardar vinculación Menor-Acudiente
    const guardarAsociacionAcudiente = async (e) => {
        e.preventDefault();
        setMensajeModal({ tipo: '', texto: '' });

        if (!menorSeleccionado) {
            setMensajeModal({ tipo: 'error', texto: 'Por favor, selecciona un niño de la lista.' });
            return;
        }

        if (!telefonoAcudiente || !nombreAcudiente || !apellidoAcudiente) {
            setMensajeModal({ tipo: 'error', texto: 'Por favor, completa los campos requeridos del acudiente.' });
            return;
        }

        try {
            setGuardandoAcudiente(true);
            let acudienteIdFinal = acudienteExistenteId;

            // 1. Si no existe, crear el acudiente
            if (!acudienteIdFinal) {
                const { data: nuevoAcudiente, error: errAcudiente } = await supabase
                    .from('acudientes')
                    .insert([{
                        nombrecompleto: nombreAcudiente.trim(),
                        apellidocompleto: apellidoAcudiente.trim(),
                        telefonocontacto: telefonoAcudiente.trim(),
                        correoelectronico: correoAcudiente.trim() || null
                    }])
                    .select('id')
                    .single();

                if (errAcudiente) throw errAcudiente;
                acudienteIdFinal = nuevoAcudiente.id;
            }

            // 2. Si es marcado como principal, desmarcar otros acudientes principales del mismo niño
            if (esPrincipal) {
                await supabase
                    .from('menores_acudientes')
                    .update({ es_principal: false })
                    .eq('menor_id', menorSeleccionado.id);
            }

            // 3. Crear la relación en menores_acudientes
            const { error: errRelacion } = await supabase
                .from('menores_acudientes')
                .insert([{
                    menor_id: menorSeleccionado.id,
                    acudiente_id: acudienteIdFinal,
                    parentesco: parentesco,
                    es_principal: esPrincipal
                }]);

            if (errRelacion) {
                if (errRelacion.code === '23505') { // Llave primaria duplicada
                    throw new Error('Este acudiente ya se encuentra asociado a este menor.');
                }
                throw errRelacion;
            }

            setMensajeModal({ tipo: 'exito', texto: '¡Acudiente asignado exitosamente al niño!' });
            
            // Limpiar formulario tras 1.5 segundos
            setTimeout(() => {
                cerrarModalAcudiente();
            }, 1500);

        } catch (err) {
            console.error('Error al asociar acudiente:', err.message);
            setMensajeModal({ tipo: 'error', texto: err.message || 'Error al guardar la información.' });
        } finally {
            setGuardandoAcudiente(false);
        }
    };

    const cerrarModalAcudiente = () => {
        setModalAcudienteAbierto(false);
        setMenorSeleccionado(null);
        setBusquedaMenor('');
        setListaMenoresEncontrados([]);
        setTelefonoAcudiente('');
        setNombreAcudiente('');
        setApellidoAcudiente('');
        setCorreoAcudiente('');
        setParentesco('Padre');
        setEsPrincipal(true);
        setAcudienteExistenteId(null);
        setMensajeModal({ tipo: '', texto: '' });
    };

    useEffect(() => {
        cargarMetricasDashboard();
    }, [servicioActivo, fechaSeleccionada]);

    useEffect(() => {
        cargarTendenciaGrafica();
    }, [servicioActivo, fechaInicioGrafica, fechaFinGrafica]);

    // Opciones para Chart.js (Línea)
    const lineChartData = {
        labels: datosTendencia.labels,
        datasets: [
            {
                fill: true,
                label: 'Asistencias',
                data: datosTendencia.data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.35,
                pointBackgroundColor: '#2563eb',
                pointRadius: 4,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } },
        },
    };

    const doughnutChartData = {
        labels: Object.values(MAPA_GRUPOS).map(g => g.nombre),
        datasets: [
            {
                data: Object.keys(MAPA_GRUPOS).map(id => conteosPorGrupo[id] || 0),
                backgroundColor: Object.values(MAPA_GRUPOS).map(g => g.color),
                borderWidth: 2,
                borderColor: '#ffffff',
            },
        ],
    };

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        },
    };

    return (
        <div className="space-y-6">

            {/* HEADER GENERAL CON SELECTOR DE FECHA DÍA, SERVICIO Y BOTÓN NUEVO ACUDIENTE */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{fechaFormateada || 'Cargando fecha...'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Botón para Abrir Modal de Asignar Acudiente */}
                    <button
                        onClick={() => setModalAcudienteAbierto(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                        <UserCheck2 className="w-4 h-4" />
                        <span>Asignar Acudiente</span>
                    </button>

                    {/* Selector del Día para el Dashboard */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer"
                        />
                    </div>

                    {/* Selector de Servicio */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                        <button
                            onClick={() => setServicioActivo('primer')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${servicioActivo === 'primer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            1º Servicio
                        </button>
                        <button
                            onClick={() => setServicioActivo('segundo')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${servicioActivo === 'segundo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            2º Servicio
                        </button>
                    </div>
                </div>
            </div>

            {/* TARJETAS KPI (5 CARDS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* KPI: Asistencia */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Asistencia</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : asistentesDia}</h2>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>

                {/* KPI: Niños Nuevos */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Niños Nuevos</p>
                        <h2 className="text-2xl font-black text-emerald-600 mt-1">{loading ? '...' : ninosNuevosCount}</h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">Registrados este día</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <UserPlus className="w-5 h-5" />
                    </div>
                </div>

                {/* KPI: Total Registrados BD */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total BD</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : totalMenoresBD}</h2>
                    </div>
                    <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                {/* KPI: Alertas Alimentarias */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alergias</p>
                        <h2 className={`text-2xl font-black mt-1 ${alertasAlergiasCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {loading ? '...' : alertasAlergiasCount}
                        </h2>
                    </div>
                    <div className={`p-2.5 rounded-xl ${alertasAlergiasCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                {/* KPI: Porcentaje Cobertura */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">% Cobertura</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-1">
                            {loading ? '...' : `${totalMenoresBD > 0 ? Math.round((asistentesDia / totalMenoresBD) * 100) : 0}%`}
                        </h2>
                    </div>
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                </div>

            </div>

            {/* SECCIÓN DE EXPORTACIÓN A EXCEL POR RANGO DE FECHAS */}
            <div className="bg-white border border-slate-100 p-4 px-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">

                {/* Título e Ícono a la Izquierda */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">Exportar Reporte de Asistencia</h2>
                        <span className="hidden md:inline-block text-xs text-slate-400 font-normal">|</span>
                        <p className="hidden md:block text-xs text-slate-500">Selecciona un rango de fechas para descargar el consolidado</p>
                    </div>
                </div>

                {/* Fechas + Botón a la Derecha en la misma fila */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* Input Rango de Fechas */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="date"
                            value={fechaInicioReporte}
                            onChange={(e) => setFechaInicioReporte(e.target.value)}
                            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer p-0 text-xs"
                        />
                        <span className="text-slate-400 font-bold px-0.5">-</span>
                        <input
                            type="date"
                            value={fechaFinReporte}
                            onChange={(e) => setFechaFinReporte(e.target.value)}
                            className="bg-transparent border-none text-slate-700 font-semibold focus:outline-none cursor-pointer p-0 text-xs"
                        />
                    </div>

                    {/* Botón Descargar Excel */}
                    <button
                        onClick={generarReporteExcel}
                        disabled={exportandoExcel}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                        {exportandoExcel ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Exportando...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <span>Descargar Excel</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* SECCIÓN DE ASISTENCIA POR GRUPOS (TARJETAS) */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Asistencia por Grupos</h2>
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

            {/* SECCIÓN DE GRÁFICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Asistencia por Fecha (Tendencia) */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tendencia de Asistencia</h2>
                        </div>

                        {/* SELECTOR DE DOS FECHAS EXCLUSIVO PARA LA GRÁFICA */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] self-start sm:self-auto">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
                            <input
                                type="date"
                                value={fechaInicioGrafica}
                                onChange={(e) => setFechaInicioGrafica(e.target.value)}
                                className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
                            />
                            <span className="text-slate-400 font-bold px-0.5">-</span>
                            <input
                                type="date"
                                value={fechaFinGrafica}
                                onChange={(e) => setFechaFinGrafica(e.target.value)}
                                className="bg-transparent border-none text-slate-700 font-medium focus:outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="h-64 relative">
                        {loadingGrafica ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <Line data={lineChartData} options={lineChartOptions} />
                        )}
                    </div>
                </div>

                {/* Distribución Grupal (Dona) */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Distribución Grupal</h2>
                        </div>
                    </div>

                    <div className="h-64 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                            </div>
                        ) : (
                            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE AGREGAR / ASIGNAR ACUDIENTE */}
            {modalAcudienteAbierto && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        
                        {/* Header Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <UserCheck2 className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900 text-base">Asignar Acudiente a Niño</h3>
                            </div>
                            <button
                                onClick={cerrarModalAcudiente}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={guardarAsociacionAcudiente} className="p-6 space-y-4">

                            {/* Mensajes de Alerta/Info */}
                            {mensajeModal.texto && (
                                <div className={`p-3 rounded-xl text-xs font-medium ${
                                    mensajeModal.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                    mensajeModal.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                    {mensajeModal.texto}
                                </div>
                            )}

                            {/* Pasó 1: Buscar Seleccionar Niño */}
                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    1. Seleccionar Niño *
                                </label>

                                {menorSeleccionado ? (
                                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-xs text-blue-900">
                                        <div>
                                            <p className="font-bold">{menorSeleccionado.nombrecompleto} {menorSeleccionado.apellidocompleto}</p>
                                            <p className="text-[10px] text-blue-700">Doc: {menorSeleccionado.documentoidentidad || 'Sin Documento'}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setMenorSeleccionado(null)}
                                            className="text-blue-600 hover:text-blue-800 font-bold underline text-[11px]"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o documento..."
                                                value={busquedaMenor}
                                                onChange={(e) => buscarMenorPorTexto(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Dropdown Resultados */}
                                        {listaMenoresEncontrados.length > 0 && (
                                            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                                {listaMenoresEncontrados.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            setMenorSeleccionado(m);
                                                            setListaMenoresEncontrados([]);
                                                        }}
                                                        className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-none text-xs"
                                                    >
                                                        <p className="font-bold text-slate-800">{m.nombrecompleto} {m.apellidocompleto}</p>
                                                        <p className="text-[10px] text-slate-400">Doc: {m.documentoidentidad || 'N/A'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <hr className="border-slate-100 my-2" />

                            {/* Pasó 2: Datos Acudiente */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    2. Información del Acudiente
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Teléfono *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="3001234567"
                                            value={telefonoAcudiente}
                                            onChange={(e) => buscarAcudientePorTelefono(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Parentesco *</label>
                                        <select
                                            value={parentesco}
                                            onChange={(e) => setParentesco(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option value="Padre">Padre</option>
                                            <option value="Madre">Madre</option>
                                            <option value="Tío/a">Tío/a</option>
                                            <option value="Abuelo/a">Abuelo/a</option>
                                            <option value="Tutor Legal">Tutor Legal</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Nombres *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nombres"
                                            value={nombreAcudiente}
                                            onChange={(e) => setNombreAcudiente(e.target.value)}
                                            disabled={!!acudienteExistenteId}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:bg-slate-100 text-slate-700"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Apellidos *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Apellidos"
                                            value={apellidoAcudiente}
                                            onChange={(e) => setApellidoAcudiente(e.target.value)}
                                            disabled={!!acudienteExistenteId}
                                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:bg-slate-100 text-slate-700"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Correo Electrónico (Opcional)</label>
                                    <input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        value={correoAcudiente}
                                        onChange={(e) => setCorreoAcudiente(e.target.value)}
                                        disabled={!!acudienteExistenteId}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:bg-slate-100 text-slate-700"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="esPrincipal"
                                        checked={esPrincipal}
                                        onChange={(e) => setEsPrincipal(e.target.checked)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <label htmlFor="esPrincipal" className="text-xs text-slate-700 font-medium cursor-pointer">
                                        Establecer como Acudiente Principal
                                    </label>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={cerrarModalAcudiente}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoAcudiente}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                >
                                    {guardandoAcudiente ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            <span>Guardar Vincular</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}