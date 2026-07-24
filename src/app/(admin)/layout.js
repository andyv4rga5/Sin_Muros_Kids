'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    UserCheck,
    BarChart3,
    LogOut,
    Menu,
    X,
    Utensils
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

    useEffect(() => {
        const verificarYSubscribir = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUsuario(session.user);
                await cargarPerfil(session.user.id);
            } else {
                setUsuario(null);
                setPerfil(null);
                setLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                if (currentSession?.user) {
                    setUsuario(currentSession.user);
                    await cargarPerfil(currentSession.user.id);
                } else {
                    setUsuario(null);
                    setPerfil(null);
                    setLoading(false);
                }
            });

            return () => subscription.unsubscribe();
        };

        async function cargarPerfil(userId) {
            try {
                const { data } = await supabase
                    .from('perfilesUsuario')
                    .select('rolid')
                    .eq('id', userId)
                    .single();

                if (data) setPerfil(data);
            } catch (error) {
                console.error("Error cargando perfil:", error);
            } finally {
                setLoading(false);
            }
        }

        verificarYSubscribir();
    }, []);

    // Seguridad y redirecciones forzadas
    useEffect(() => {
        if (!loading) {
            if (!usuario && pathname !== '/hojas-de-vida') {
                router.push('/login');
            } else if (usuario && perfil?.rolid === 6 && pathname !== '/servidores') {
                // Si es Rol 6 y está en cualquier otra URL, redirigir a /servidores
                router.push('/servidores');
            }
        }
    }, [usuario, perfil, loading, pathname, router]);

    useEffect(() => {
        setMenuMovilAbierto(false);
    }, [pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-500 animate-pulse">Cargando interfaz... ⏳</p>
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] w-full flex flex-col justify-center items-center">
                <div className="w-full">
                    {children}
                </div>
            </div>
        );
    }

    const getLinkStyles = (route) => {
        const isActive = pathname === route;
        return isActive
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 transition-all"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all group";
    };

    const getIconStyles = (route) => {
        const isActive = pathname === route;
        return isActive
            ? "w-4 h-4 text-white"
            : "w-4 h-4 text-slate-500 group-hover:text-white transition-colors";
    };

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden flex-col md:flex-row">

            {/* BARRA LATERAL IZQUIERDA (Escritorio) */}
            <aside className="hidden md:flex w-64 bg-[#0F172A] text-slate-400 flex-col justify-between p-4 shrink-0 h-full overflow-y-auto">
                <div>
                    {/* Logo */}
                    <div className="flex flex-col items-center pt-4 pb-2 mb-6 border-b border-slate-800/50">
                        <img
                            src="https://jgeoucfxieahezuayswr.supabase.co/storage/v1/object/public/Logos/Gemini_Generated_Image_c3mpj0c3mpj0c3mp-removebg-preview.png"
                            alt="Logo Sin Muros Kids"
                            className="w-[160px] h-[70px] object-contain"
                        />
                        <div className="text-center mt-3 pb-2">
                            <h2 className="text-white font-bold text-sm tracking-wide leading-none">Sin Muros Kids</h2>
                        </div>
                    </div>

                    {/* Menú Dinámico con validación de Rol 6 */}
                    <nav className="space-y-1">
                        {perfil?.rolid === 6 ? (
                            // Si es rol de refrigerios, solo ve su enlace
                            <a href="/servidores" className={getLinkStyles('/servidores')}>
                                <Utensils className={getIconStyles('/servidores')} />
                                Refrigerios
                            </a>
                        ) : (
                            // Menú para todos los demás roles normales
                            <>
                                {(perfil?.rolid === 1 || perfil?.rolid === 2) && (
                                    <a href="/admin-dashboard" className={getLinkStyles('/admin-dashboard')}>
                                        <LayoutDashboard className={getIconStyles('/admin-dashboard')} />
                                        Dashboard
                                    </a>
                                )}

                                <a href="/hojas-de-vida" className={getLinkStyles('/hojas-de-vida')}>
                                    <Users className={getIconStyles('/hojas-de-vida')} />
                                    Hoja de Vida
                                </a>

                                <a href="/asistencia" className={getLinkStyles('/asistencia')}>
                                    <CalendarCheck className={getIconStyles('/asistencia')} />
                                    Asistencia
                                </a>

                                {perfil?.rolid === 1 && (
                                    <>
                                        <a href="#" className={getLinkStyles('/leaders')}>
                                            <UserCheck className={getIconStyles('/leaders')} />
                                            Líderes
                                        </a>
                                        <a href="#" className={getLinkStyles('/reports')}>
                                            <BarChart3 className={getIconStyles('/reports')} />
                                            Reportes
                                        </a>
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                {/* Cerrar Sesión Escritorio */}
                <div className="space-y-1 border-t border-slate-800 pt-4 mt-auto">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-all group"
                    >
                        <LogOut className="w-4 h-4 text-red-400/70 group-hover:text-red-300 transition-colors" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pb-[72px] md:pb-0">

                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 z-20">
                    <div className="text-slate-800 md:text-slate-400 text-xs font-bold md:font-semibold flex items-center gap-2">
                        <img
                            src="https://jgeoucfxieahezuayswr.supabase.co/storage/v1/object/public/Logos/Gemini_Generated_Image_c3mpj0c3mpj0c3mp-removebg-preview.png"
                            className="w-8 h-8 object-contain md:hidden"
                            alt="Móvil logo"
                        />
                        <span>{perfil?.rolid === 6 ? 'Servicio de Alimentos' : 'Panel Administrativo'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* <button className="text-slate-400 hover:text-slate-600 text-sm">
                            <Bell className="w-4 h-4" />
                        </button> */}
                        <div className="w-8 h-8 rounded-full bg-slate-200 border flex items-center justify-center overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                                {usuario?.email ? usuario.email.slice(0, 2) : 'US'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* MENÚ MÓVIL DESPLEGABLE POSTERIOR */}
                {menuMovilAbierto && (
                    <div className="fixed inset-0 bg-[#0F172A]/90 z-40 md:hidden flex flex-col p-6 pt-24 animate-in fade-in duration-200">
                        <button
                            onClick={() => setMenuMovilAbierto(false)}
                            className="absolute top-5 right-6 text-white p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <nav className="space-y-3 flex-1">
                            {perfil?.rolid === 6 ? (
                                <a href="/servidores" className="flex items-center gap-3 text-white text-base font-semibold py-3 border-b border-slate-800">
                                    <Utensils className="w-5 h-5 text-slate-400" /> Refrigerios
                                </a>
                            ) : (
                                <>
                                    {perfil?.rolid === 1 && (
                                        <>
                                            <a href="/leaders" className="flex items-center gap-3 text-white text-base font-semibold py-3 border-b border-slate-800">
                                                <UserCheck className="w-5 h-5 text-slate-400" /> Líderes
                                            </a>
                                            <a href="/reports" className="flex items-center gap-3 text-white text-base font-semibold py-3 border-b border-slate-800">
                                                <BarChart3 className="w-5 h-5 text-slate-400" /> Reportes
                                            </a>
                                        </>
                                    )}
                                </>
                            )}
                        </nav>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 text-red-400 border border-red-500/30 rounded-xl font-bold bg-red-500/5"
                        >
                            <LogOut className="w-5 h-5" /> Cerrar Sesión
                        </button>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
                    {children}
                </main>

            </div>

            {/* NAV BAR FLOTANTE INFERIOR (Móvil) */}
            <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden z-30 px-4">
                <div className="relative w-full h-full flex items-center justify-around">

                    {/* INDICADOR FLOTANTE (Círculo viajero modificado para Rol 6) */}
                    <div
                        className="absolute -top-4 w-14 h-14 rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/40 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-0"
                        style={{
                            left: perfil?.rolid === 6 
                                ? '25%'
                                : (perfil?.rolid === 1 || perfil?.rolid === 2)
                                    ? (pathname === '/admin-dashboard' ? '12.5%' : pathname === '/asistencia' ? '37.5%' : pathname === '/hojas-de-vida' ? '62.5%' : '-100%')
                                    : (pathname === '/asistencia' ? '16.66%' : pathname === '/hojas-de-vida' ? '50%' : '-100%'),
                            transform: 'translateX(-50%)',
                            display: ['/admin-dashboard', '/asistencia', '/hojas-de-vida', '/servidores'].includes(pathname) ? 'block' : 'none'
                        }}
                    />

                    {perfil?.rolid === 6 ? (
                        /* VISTA INFERIOR MÓVIL EXCLUSIVA PARA ROL 6 */
                        <>
                            <a href="/servidores" className="flex flex-col items-center justify-center w-16 h-full z-10 transition-all duration-200">
                                <Utensils className={`w-5 h-5 transition-all duration-300 ${pathname === '/servidores' ? 'text-white -translate-y-4 scale-110' : 'text-slate-400'}`} />
                                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${pathname === '/servidores' ? 'text-indigo-600 font-bold opacity-100 translate-y-1' : 'text-slate-400'}`}>
                                    Refrigerios
                                </span>
                            </a>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/login';
                                }}
                                className="flex flex-col items-center justify-center w-16 h-full z-10 text-slate-400"
                            >
                                <LogOut className="w-5 h-5 text-red-400" />
                                <span className="text-[10px] mt-1 font-semibold text-red-400">Salir</span>
                            </button>
                        </>
                    ) : (
                        /* VISTA INFERIOR MÓVIL PARA DEMÁS ROLES COMPLETA */
                        <>
                            {(perfil?.rolid === 1 || perfil?.rolid === 2) && (
                                <a href="/admin-dashboard" className="flex flex-col items-center justify-center w-16 h-full z-10 transition-all duration-200">
                                    <LayoutDashboard className={`w-5 h-5 transition-all duration-300 ${pathname === '/admin-dashboard' ? 'text-white -translate-y-4 scale-110' : 'text-slate-400'}`} />
                                    <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${pathname === '/admin-dashboard' ? 'text-indigo-600 font-bold opacity-100 translate-y-1' : 'text-slate-400'}`}>
                                        Inicio
                                    </span>
                                </a>
                            )}

                            <a href="/asistencia" className="flex flex-col items-center justify-center w-16 h-full z-10 transition-all duration-200">
                                <CalendarCheck className={`w-5 h-5 transition-all duration-300 ${pathname === '/asistencia' ? 'text-white -translate-y-4 scale-110' : 'text-slate-400'}`} />
                                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${pathname === '/asistencia' ? 'text-indigo-600 font-bold opacity-100 translate-y-1' : 'text-slate-400'}`}>
                                    Asistencia
                                </span>
                            </a>

                            <a href="/hojas-de-vida" className="flex flex-col items-center justify-center w-16 h-full z-10 transition-all duration-200">
                                <Users className={`w-5 h-5 transition-all duration-300 ${pathname === '/hojas-de-vida' ? 'text-white -translate-y-4 scale-110' : 'text-slate-400'}`} />
                                <span className={`text-[10px] mt-1 font-semibold transition-all duration-300 ${pathname === '/hojas-de-vida' ? 'text-indigo-600 font-bold opacity-100 translate-y-1' : 'text-slate-400'}`}>
                                    Niños
                                </span>
                            </a>

                            <button onClick={() => setMenuMovilAbierto(true)} className="flex flex-col items-center justify-center w-16 h-full z-10 text-slate-400">
                                <Menu className="w-5 h-5" />
                                <span className="text-[10px] mt-1 font-semibold">Más</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}