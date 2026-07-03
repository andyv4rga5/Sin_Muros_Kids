'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
    const [usuario, setUsuario] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function validarSesion() {
            // 1. Verificar si hay un usuario autenticado
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUsuario(user);
                // 2. Traer el rol del usuario
                const { data } = await supabase
                    .from('perfilesUsuario')
                    .select('rolid')
                    .eq('id', user.id)
                    .single();

                if (data) setPerfil(data);
            }
            setLoading(false);
        }
        validarSesion();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-500 animate-pulse">Cargando interfaz... ⏳</p>
            </div>
        );
    }

    // CASO A: SI NO ESTÁ LOGUEADO (Padre de familia / Anónimo)
    // Se renderiza la pantalla limpia, sin barras de navegación de ningún tipo.
    if (!usuario) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                {children}
            </div>
        );
    }

    // Función auxiliar para retornar los estilos del link dependiendo de si está activo
    const getLinkStyles = (route) => {
        const isActive = pathname === route;
        return isActive
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 transition-all"
            : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all group";
    };

    // Función auxiliar para cambiar el color del ícono si el link está activo
    const getIconStyles = (route) => {
        const isActive = pathname === route;
        return isActive
            ? "w-4 h-4 text-white"
            : "w-4 h-4 text-slate-500 group-hover:text-white transition-colors";
    };

    // CASO B: SI ESTÁ LOGUEADO (Administrador, Líder, Servidor, etc...)
    // Se muestra la barra lateral adaptando las opciones según su `perfil.rolid`
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* BARRA LATERAL IZQUIERDA COMPARTIDA */}
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

                    {/* Menú de Navegación Dinámico por Rol */}
                    <nav className="space-y-1">
                        {/* Opciones Visibles para Admin (Rol 1) y Coordinador (Rol 2) */}
                        {(perfil?.rolid === 1 || perfil?.rolid === 2) && (
                            <a href="/admin-dashboard" className={getLinkStyles('/admin-dashboard')}>
                                <LayoutDashboard className={getIconStyles('/admin-dashboard')} />
                                Dashboard
                            </a>
                        )}

                        {/* Opción para todos los usuarios logueados */}
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
                                    Lideres
                                </a>
                                <a href="#" className={getLinkStyles('/reports')}>
                                    <BarChart3 className={getIconStyles('/reports')} />
                                    Reportes
                                </a>
                            </>
                        )}
                    </nav>
                </div>

                {/* Links Inferiores */}
                <div className="space-y-1 border-t border-slate-800 pt-4">
                    <button
                        onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-all group"
                    >
                        <LogOut className="w-4 h-4 text-red-400/70 group-hover:text-red-300 transition-colors" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* CONTENIDO DERECHO */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* BARRA SUPERIOR NAV */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                    <div className="w-96 relative">
                        <input
                            type="text"
                            placeholder="Buscar niños..."
                            className="w-full bg-slate-100 border border-transparent rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-slate-300 text-slate-700"
                        />
                        <span className="absolute left-3.5 top-2 text-slate-400 text-xs">🔍</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-600 text-sm">🔔</button>
                        <button className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all">
                            Check-in
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-200 border overflow-hidden">
                            <span className="text-xs p-2 block font-bold text-slate-600 uppercase">
                                {usuario.email.slice(0, 2)}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Renderizado de la Pantalla */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}