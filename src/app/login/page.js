'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
    const router = useRouter();

    // Estados para manejar el formulario de forma reactiva y segura
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Manejador del envio del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Iniciar sesión en la autenticación de Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (authError) throw authError;

            const userUid = authData.user.id;

            // 2. Consultar el rol de este usuario 
            const { data: perfil, error: perfilError } = await supabase
                .from('perfilesUsuario')
                .select('rolid')
                .eq('id', userUid)
                .single();

            if (perfilError || !perfil) {
                throw new Error('No se encontró un perfil o rol asignado a este usuario.');
            }

            if (perfil.rolid === 6) {
                router.push('/servidores');
            } else {
                router.push('/asistencia');
            }
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión. Verifica tus datos.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4 relative overflow-hidden">

            {/* Fondos decorativos geometricos (Brillo sutil) */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl z-10">

                {/* Encabezado del Login */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src="https://jgeoucfxieahezuayswr.supabase.co/storage/v1/object/public/Logos/Gemini_Generated_Image_c3mpj0c3mpj0c3mp-removebg-preview.png"
                            alt="Logo Sin Muros Kids"
                            className="w-[180px] h-[80px] object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Sin Muros Kids</h1>
                    <p className="text-sm text-slate-400 mt-1">Ingresa al panel administrativo de forma segura</p>
                </div>

                {/* Alerta de Error Sanitizada */}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-3 text-sm animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Campo Correo */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@smk.com"
                                className="w-full bg-slate-900/60 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Campo Contrasenia */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-900/60 border border-slate-700 text-white pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Boton de Envio */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
                    >
                        {loading ? 'Validando seguridad...' : 'Iniciar Sesión'}
                    </button>

                </form>

                {/* Pie de pagina informativo */}
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-500">
                        Conexión cifrada de extremo a extremo.
                    </p>
                </div>
            </div>
        </div>
    );
}
