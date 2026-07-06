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
    Search,
    Bell
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Combinamos la verificación inicial con la escucha en tiempo real
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

            // Escuchar cambios de sesión activos (logout, logins externos)
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

    // SEGURIDAD ADICIONAL: Si un usuario externo/padre intenta escribir una ruta administrativa 
    // en la URL, lo mandamos al login en lugar de mostrarle un children vacío.
    useEffect(() => {
        if (!loading && !usuario && pathname !== '/hojas-de-vida') {
            // Permitimos el acceso anónimo UNICAMENTE a la hoja de vida pública
            router.push('/login');
        }
    }, [usuario, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-500 animate-pulse">Cargando interfaz... ⏳</p>
            </div>
        );
    }

    // =========================================================================
    // CASO A: USUARIO EXTERNO / PADRE DE FAMILIA (Anónimo o no logueado)
    // =========================================================================
    if (!usuario) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] w-full flex flex-col justify-center items-center">
                {/* 
                  Opcional: Si deseas que el padre vea un encabezado institucional muy sutil 
                  sin menú (para que no parezca una página huérfana), puedes descomentar esto:
                  
                  <header className="w-full max-w-5xl px-4 py-4 flex justify-between items-center border-b border-slate-100">
                      <img src="https://jgeoucfxieahezuayswr.supabase.co/storage/v1/object/public/Logos/Gemini_Generated_Image_c3mpj0c3mpj0c3mp-removebg-preview.png" className="h-10 object-contain" alt="SMK Logo" />
                      <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 text-slate-600 rounded">Registro Público</span>
                  </header>
                */}
                <div className="w-full">
                    {children}
                </div>
            </div>
        );
    }

    // =========================================================================
    // CASO B: PERSONAL LOGUEADO (Administradores, Líderes, Servidores)
    // =========================================================================
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
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* BARRA LATERAL IZQUIERDA */}
            <aside className="w-64 bg-[#0F172A] text-slate-400 flex flex-col justify-between p-4 shrink-0">
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

                    {/* Menú Dinámico */}
                    <nav className="space-y-1">
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
                    </nav>
                </div>

                {/* Cerrar Sesión */}
                <div className="space-y-1 border-t border-slate-800 pt-4">
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

            {/* CONTENIDO DE LA APP ADMINISTRATIVA */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* NAV SUPERIOR */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                    <div className="w-96 relative">
                        <input
                            type="text"
                            placeholder="Buscar niños..."
                            className="w-full bg-slate-100 border border-transparent rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-slate-300 text-slate-700"
                        />
                        <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs flex items-center"><Search className="w-3.5 h-3.5"/></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-600 text-sm">
                            <Bell className="w-4 h-4" />
                        </button>
                        <button className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all">
                            Check-in
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-200 border flex items-center justify-center overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">
                                {usuario?.email ? usuario.email.slice(0, 2) : 'US'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Contenedor interno para Servidores */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}