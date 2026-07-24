'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  LogIn,
  LogOut,
} from 'lucide-react';

const MAPA_GRUPOS = {
  1: { nombre: 'Puente', estilo: 'bg-blue-50 text-blue-700 border-blue-200' },
  2: { nombre: 'Buscadores', estilo: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  3: { nombre: 'Fluir', estilo: 'bg-purple-50 text-purple-700 border-purple-200' },
  4: { nombre: 'Reino', estilo: 'bg-amber-50 text-amber-700 border-amber-200' },
  5: { nombre: 'Conquistadores', estilo: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const AVATAR_DEFECTO = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

export default function AsistenciaPage() {
  const [servicioActivo, setServicioActivo] = useState('primer');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [buscarTexto, setBuscarTexto] = useState('');
  const [filtroAsistencia, setFiltroAsistencia] = useState('ausentes'); // 'ausentes' | 'presentes'

  // Estados de datos
  const [menores, setMenores] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [totalMenores, setTotalMenores] = useState(0);
  const [usuarioId, setUsuarioId] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [fechaFormateada, setFechaFormateada] = useState('');

  // Estado para controlar qué desplegable de acudientes está abierto en la tabla
  const [dropdownAbiertoId, setDropdownAbiertoId] = useState(null);

  const [lideres, setLideres] = useState([
    { iniciales: 'RP', nombre: 'Ricardo P.', activo: true },
    { iniciales: 'MA', nombre: 'Mariana A.', activo: true },
    { iniciales: 'JV', nombre: 'Jorge V.', activo: false },
  ]);

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

  // Cargar el usuario autenticado
  useEffect(() => {
    async function obtenerUsuario() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioId(session.user.id);
      }
    }
    obtenerUsuario();
  }, []);

  useEffect(() => {
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    // Esto formatea la fecha actual 
    const fechaHoyStr = new Date().toLocaleDateString('es-ES', opciones);
    setFechaFormateada(fechaHoyStr);
  }, []);

  // Cargar menores, asistencias del día y acudientes asociados
  const cargarDatosAsistencia = async () => {
    try {
      setLoadingDatos(true);
      const servicioId = obtenerServicioJornadaId();

      // Consultar menores
      const { data: listaMenores, error: errMenores, count } = await supabase
        .from('menores')
        .select('*', { count: 'exact' })
        .order('nombrecompleto', { ascending: true });

      if (errMenores) throw errMenores;

      // Consultar asistencias del día
      const { data: listaAsistencias, error: errAsistencias } = await supabase
        .from('asistencias')
        .select('*')
        .eq('fechaasistencia', fechaHoy)
        .eq('serviciojornadaid', servicioId);

      if (errAsistencias) throw errAsistencias;

      // Consultar la tabla intermedia de acudientes para saber quiénes están autorizados por cada menor
      const { data: relacionesAcudientes, error: errRelaciones } = await supabase
        .from('menores_acudientes')
        .select(`
          menor_id,
          parentesco,
          es_principal,
          acudientes (
            id,
            nombrecompleto,
            apellidocompleto,
            telefonocontacto
          )
        `);

      if (errRelaciones) throw errRelaciones;

      // Mapear y cruzar toda la información
      const menoresMapeados = listaMenores.map(menor => {
        const registroAsistencia = listaAsistencias.find(asist => asist.menorid === menor.id);

        // Filtrar acudientes autorizados para este menor
        const acudientesAutorizados = relacionesAcudientes
          .filter(rel => rel.menor_id === menor.id)
          .map(rel => ({
            id: rel.acudientes.id,
            nombre: `${rel.acudientes.nombrecompleto} ${rel.acudientes.apellidocompleto}`,
            telefono: rel.acudientes.telefonocontacto,
            parentesco: rel.parentesco,
            esPrincipal: rel.es_principal
          }))
          .sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));

        return {
          ...menor,
          asistenciaId: registroAsistencia ? registroAsistencia.id : null,
          checkIn: registroAsistencia
            ? new Date(registroAsistencia.horaentrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--',
          horaSalidaReal: registroAsistencia?.horasalida || null,
          entregadoA: registroAsistencia?.entregadoanombrepersona || null,
          estadoAsistenciaReal: registroAsistencia ? registroAsistencia.estadoasistencia : 'Ausente',
          acudientes: acudientesAutorizados
        };
      });

      setMenores(menoresMapeados);
      setTotalMenores(count || 0);
    } catch (err) {
      console.error("Error cargando la lista de asistencia y acudientes:", err.message);
    } finally {
      setLoadingDatos(false);
    }
  };

  useEffect(() => {
    cargarDatosAsistencia();
    setDropdownAbiertoId(null);
  }, [servicioActivo]);

  // Registrar Entrada (Check-In)
  const handleCheckIn = async (menorId) => {
    if (!usuarioId) {
      alert("Error: No se pudo identificar al usuario activo. Por favor inicia sesión.");
      return;
    }

    try {
      setProcesandoId(menorId);
      const servicioId = obtenerServicioJornadaId();

      const { error } = await supabase
        .from('asistencias')
        .insert({
          menorid: menorId,
          serviciojornadaid: servicioId,
          fechaasistencia: fechaHoy,
          registradoporusuarioid: usuarioId,
          estadoasistencia: 'Presente'
        });

      if (error) throw error;
      await cargarDatosAsistencia();
    } catch (err) {
      alert(`Error al registrar entrada: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  // Registrar Salida (Check-Out) con Acudiente Seleccionado
  const handleCheckOut = async (asistenciaId, menorId, nombreAcudiente) => {
    try {
      setProcesandoId(menorId);
      setDropdownAbiertoId(null); // Cerrar dropdown

      const { error } = await supabase
        .from('asistencias')
        .update({
          horasalida: new Date().toISOString(),
          entregadoanombrepersona: nombreAcudiente,
          estadoasistencia: 'Retirado'
        })
        .eq('id', asistenciaId);

      if (error) throw error;
      await cargarDatosAsistencia();
    } catch (err) {
      alert(`Error al registrar salida: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  // Filtrado de datos en el cliente
  const menoresFiltrados = menores.filter((kid) => {
    const cumpleGrupo = filtroGrupo === 'todos' || String(kid.grupoid) === filtroGrupo;

    const texto = buscarTexto.toLowerCase();
    const cumpleBusqueda =
      buscarTexto === '' ||
      (kid.nombrecompleto && kid.nombrecompleto.toLowerCase().includes(texto)) ||
      (kid.apellidocompleto && kid.apellidocompleto.toLowerCase().includes(texto)) ||
      (kid.documentoidentidad && kid.documentoidentidad.toLowerCase().includes(texto));

    const cumpleAsistencia = filtroAsistencia === 'ausentes'
      ? kid.checkIn === '--:--'
      : kid.checkIn !== '--:--';

    return cumpleGrupo && cumpleBusqueda && cumpleAsistencia;
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Control de Asistencia</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión administrativa de servicios dominicales</p>
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
            <span className="capitalize">{fechaFormateada || 'Cargando fecha...'}</span>
          </div>
        </div>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Esperado */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between h-28 sm:h-32 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
              {loadingDatos ? '...' : totalMenores}
            </h3>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Total Esperado</p>
          </div>
        </div>

        {/* Presentes Hoy */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between h-28 sm:h-32">
          <div className="flex items-center justify-between">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
              {loadingDatos ? '...' : menores.filter(m => m.checkIn !== '--:--').length}
            </h3>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Presentes Hoy</p>
          </div>
        </div>

        {/* Líderes Activos */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between h-28 sm:h-32">
          <div>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl inline-block">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">18</h3>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Líderes Activos</p>
          </div>
        </div>

        {/* Alertas Pendientes */}
        <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between h-28 sm:h-32">
          <div>
            <span className="p-2 bg-red-50 text-red-600 rounded-xl inline-block">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">03</h3>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1.5">Alertas Pendientes</p>
          </div>
        </div>
      </div>

      {/* FILTROS Y BUSQUEDA */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:flex-1 flex flex-col sm:flex-row gap-3">

          <div className="relative flex-1">
            <input
              type="text"
              value={buscarTexto}
              onChange={(e) => setBuscarTexto(e.target.value)}
              placeholder="Buscar por nombre o identificación..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-400 text-slate-700 transition-all"
            />
            <span className="absolute left-3.5 top-3 text-slate-400 text-xs flex items-center">
              <Search className="w-4 h-4" />
            </span>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold shrink-0 border border-slate-200/50">
            <button
              onClick={() => setFiltroAsistencia('ausentes')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${filtroAsistencia === 'ausentes'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Check-In
            </button>
            <button
              onClick={() => setFiltroAsistencia('presentes')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${filtroAsistencia === 'presentes'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Check-Out
            </button>
          </div>

        </div>

        <p className="text-[11px] text-slate-400 font-medium shrink-0">
          Filtrados: <strong>{menoresFiltrados.length}</strong> de {totalMenores}
        </p>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LISTADO DE NIÑOS */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 mr-2">Listado de Niños</h2>
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setFiltroGrupo('todos')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filtroGrupo === 'todos' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Todos
                </button>
                {Object.entries(MAPA_GRUPOS).map(([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setFiltroGrupo(id)}
                    className={`px-2.5 py-1 rounded-md border transition-all ${filtroGrupo === id ? 'bg-slate-900 border-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 border-slate-200'}`}
                  >
                    {info.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div> */}
          </div>

          <div className="overflow-x-auto min-h-[200px] relative">
            {loadingDatos ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500 font-medium">Cargando menores de la congregación...</span>
              </div>
            ) : (
              // TABLA DE NIÑOS
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50/70">
                    <th className="py-3 px-6">Niño / Identificación</th>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-6 text-right">Acción / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {menoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-slate-400 font-medium">
                        No se encontraron menores en este filtro.
                      </td>
                    </tr>
                  ) : (
                    menoresFiltrados.map((kid) => {
                      const grupoInfo = MAPA_GRUPOS[kid.grupoid] || { nombre: 'Sin grupo', estilo: 'bg-slate-50 text-slate-600 border-slate-200' };
                      const estaPresente = kid.checkIn !== '--:--';
                      const yaSalió = kid.horaSalidaReal !== null;
                      const esDropdownAbierto = dropdownAbiertoId === kid.id;

                      return (
                        <tr key={kid.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4 px-6 flex items-center gap-4">
                            <img
                              src={kid.urlfotoperfil || AVATAR_DEFECTO}
                              alt={`${kid.nombrecompleto} ${kid.apellidocompleto}`}
                              className="w-24 h-24 rounded-full object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                              onError={(e) => {
                                e.target.src = AVATAR_DEFECTO;
                              }}
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                {kid.nombrecompleto} {kid.apellidocompleto}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                Documento: {kid.documentoidentidad || 'Sin registro'}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${grupoInfo.estilo}`}>
                              {grupoInfo.nombre}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono font-medium text-slate-600">
                            {kid.checkIn}
                          </td>
                          <td className="py-4 px-6 text-right relative">
                            {procesandoId === kid.id ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                Procesando...
                              </span>
                            ) : yaSalió ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                                  <UserX className="w-3 h-3" /> Retirado
                                </span>
                                <p className="text-[9px] text-slate-400 font-medium mt-1">
                                  Entregado a: <strong className="text-slate-600">{kid.entregadoA}</strong>
                                </p>
                              </div>
                            ) : estaPresente ? (
                              /* INTERFAZ DE CHECK-OUT CON SELECTOR DE ACUDIENTES */
                              <div className="inline-block text-left">
                                <button
                                  onClick={() => setDropdownAbiertoId(esDropdownAbierto ? null : kid.id)}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/10" />
                                  Dar Salida (Check-Out)
                                </button>

                                {/* Dropdown flotante con los acudientes autorizados */}
                                {esDropdownAbierto && (
                                  <div className="absolute right-6 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                                    <div className="bg-slate-50 px-3 py-2 text-left">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entregar a Autorizado:</p>
                                    </div>

                                    {kid.acudientes && kid.acudientes.length > 0 ? (
                                      kid.acudientes.map((acudiente) => (
                                        <button
                                          key={acudiente.id}
                                          onClick={() => handleCheckOut(kid.asistenciaId, kid.id, acudiente.nombre)}
                                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex flex-col transition-colors group/item"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span className="font-bold text-slate-800 text-[11px] group-hover/item:text-blue-600">
                                              {acudiente.nombre}
                                            </span>
                                            {acudiente.esPrincipal && (
                                              <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-bold uppercase border border-amber-100">
                                                Principal
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-medium">
                                            <span className="capitalize">{acudiente.parentesco}</span>
                                            <span>•</span>
                                            <span className="font-mono">{acudiente.telefono}</span>
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-3 text-center text-slate-400">
                                        <p className="text-[10px] font-medium">No hay acudientes registrados.</p>
                                        <button
                                          onClick={() => {
                                            const manual = prompt("Escriba el nombre del adulto responsable de forma manual:");
                                            if (manual) handleCheckOut(kid.asistenciaId, kid.id, manual);
                                          }}
                                          className="text-[10px] text-blue-600 underline font-bold mt-1 inline-block"
                                        >
                                          Registrar manual
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* BOTÓN DE CHECK-IN */
                              <button
                                onClick={() => handleCheckIn(kid.id)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border px-3 py-1.5 rounded-lg transition-all"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Ausente (Check-In)
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">
              Mostrando {loadingDatos ? '...' : `1 - ${menoresFiltrados.length}`} de {totalMenores} registros
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">1</button>
              <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* LIDERAZGO LATERAL */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white ${idx === 0 ? 'bg-amber-600' : idx === 1 ? 'bg-blue-600' : 'bg-slate-600'
                    }`}>
                    {lider.iniciales}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{lider.nombre}</span>
                </div>

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