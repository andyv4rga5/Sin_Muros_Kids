'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Baby,
  Users,
  HeartPulse,
  Loader2,
  Save,
  UserCheck,
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';

export default function HojasDeVidaPage() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    menor_nombre: '', menor_apellido: '', menor_conQuienVive: '', menor_conQuienAsiste: '',
    menor_fechaNacimiento: '', menor_sexo: '', menor_documento: '', menor_direccion: '', menor_barrio: '',
    acudiente_nombre: '', acudiente_apellido: '', acudiente_parentesco: '', acudiente_telefono: '', acudiente_correo: '',
    menor_alergias: '', menor_habeasData: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Teléfono (Solo dígitos)
    if (name === 'acudiente_telefono') {
      const soloDigitos = value.replace(/\D/g, '');
      setFormData(p => ({ ...p, [name]: soloDigitos }));
      return;
    }

    // Documento (Solo Alfanumérico)
    if (name === 'menor_documento') {
      const alfanumerico = value.replace(/[^a-zA-Z0-9]/g, '');
      setFormData(p => ({ ...p, [name]: alfanumerico }));
      return;
    }

    // Nombres, Apellidos, Parentesco y Barrio (Solo letras y espacios)
    if (['menor_nombre', 'menor_apellido', 'acudiente_nombre', 'acudiente_apellido', 'acudiente_parentesco', 'menor_barrio', 'menor_conQuienVive', 'menor_conQuienAsiste'].includes(name)) {
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
      setFormData(p => ({ ...p, [name]: soloLetras }));
      return;
    }

    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    setLoading(true);
    try {
      // Saneamiento de cadenas final pre-inserción
      const limpiarTexto = (str) => str ? str.trim().replace(/\s+/g, ' ') : null;

      //Calcular la edad basada en el año de nacimiento
      const anioNacimiento = new Date(formData.menor_fechaNacimiento).getFullYear();
      const anioActual = new Date().getFullYear(); // 2026
      const edadMinisterial = anioActual - anioNacimiento;

      //Determinar el grupoid
      let grupoCalculadoId = 1; 

      if (edadMinisterial >= 3 && edadMinisterial <= 4) {
        grupoCalculadoId = 1; // Puente
      } else if (edadMinisterial >= 5 && edadMinisterial <= 6) {
        grupoCalculadoId = 2; // Buscadores
      } else if (edadMinisterial >= 7 && edadMinisterial <= 8) {
        grupoCalculadoId = 3; // Fluir
      } else if (edadMinisterial >= 9 && edadMinisterial <= 10) {
        grupoCalculadoId = 4; // Reino
      } else if (edadMinisterial >= 11) {
        grupoCalculadoId = 5; // Conquistadores
      }

      // Insertar al Acudiente primero
      const { data: acudiente, error: errA } = await supabase.from('acudientes').insert([
        {
          nombrecompleto: formData.acudiente_nombre,
          apellidocompleto: formData.acudiente_apellido,
          parentesco: formData.acudiente_parentesco,
          telefonocontacto: formData.acudiente_telefono,
          correoelectronico: formData.acudiente_correo || null
        }
      ]).select('id').single();

      if (errA) throw errA;

      const { error: errM } = await supabase.from('menores').insert([
        {
          nombrecompleto: formData.menor_nombre,
          apellidocompleto: formData.menor_apellido,
          documentoidentidad: formData.menor_documento || null,
          fechanacimiento: formData.menor_fechaNacimiento,
          conquienvive: formData.menor_conQuienVive,
          conquienasisteiglesia: formData.menor_conQuienAsiste,
          direccionresidencia: formData.menor_direccion,
          barrioresidencia: formData.menor_barrio,
          alergiasorestricciones: formData.menor_alergias || 'Ninguna',
          sexo: formData.menor_sexo,
          grupoid: grupoCalculadoId,
          acudienteprincipalid: acudiente.id,
          consentimientoinformadoley1581datos: formData.menor_habeasData
        }
      ]);

      if (errM) throw errM;
      alert('¡Menor registrado con éxito! 🎉');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start px-4 md:px-0 py-6">
      <div className="flex-1 min-w-0 bg-white md:bg-transparent p-6 md:p-0 rounded-2xl border border-slate-100 md:border-transparent">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Registro de Hoja de Vida</h1>
          <p className="text-xs text-slate-500 mt-1">Complete la información del menor y su acudiente para el proceso de registro a SMK.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BLOQUE A: DATOS DEL MENOR */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Baby className="w-4 h-4" />
              </span>
              Datos del Menor
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre Completo *</label>
                <input type="text" name="menor_nombre" value={formData.menor_nombre} placeholder="Ej. Juan" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Apellido Completo *</label>
                <input type="text" name="menor_apellido" value={formData.menor_apellido} placeholder="Ej. Pérez" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">¿Con quién vive? *</label>
                <input type="text" name="menor_conQuienVive" value={formData.menor_conQuienVive} placeholder="Ej. Los papás" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">¿Con quién asiste a la iglesia? *</label>
                <input type="text" name="menor_conQuienAsiste" value={formData.menor_conQuienAsiste} placeholder="Ej. Los papás" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Fecha de Nacimiento *</label>
                <input type="date" name="menor_fechaNacimiento" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Sexo *</label>
                <select name="menor_sexo" value={formData.menor_sexo} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800" required>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Documento de Identidad *</label>
                <input type="text" name="menor_documento" value={formData.menor_documento} placeholder="Solo números y letras" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Dirección de residencia *</label>
                <input type="text" name="menor_direccion" placeholder="Ej. Calle 1 # 2-3" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Barrio de residencia *</label>
                <input type="text" name="menor_barrio" value={formData.menor_barrio} placeholder="Ej. Barrio Bosquesitos" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
            </div>
          </div>

          {/* BLOQUE B: INFORMACIÓN DEL ACUDIENTE */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
              Información del Acudiente
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre completo del acudiente *</label>
                <input type="text" name="acudiente_nombre" value={formData.acudiente_nombre} placeholder="Nombre" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Apellido completo del acudiente *</label>
                <input type="text" name="acudiente_apellido" value={formData.acudiente_apellido} placeholder="Apellidos" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Parentesco *</label>
                <input type="text" name="acudiente_parentesco" value={formData.acudiente_parentesco} placeholder="Madre, Padre, Abuelo..." onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Teléfono de Contacto *</label>
                <input type="text" name="acudiente_telefono" placeholder="Solo números" value={formData.acudiente_telefono} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Correo Electrónico (Opcional)</label>
                <input type="email" name="acudiente_correo" placeholder="acudiente@ejemplo.com" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" />
              </div>
            </div>
          </div>

          {/* BLOQUE C: SALUD Y ALERGIAS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="p-1.5 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </span>
              Salud y Alergias (Opcional)
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-2">¿El menor padece alguna alergia o condición médica?</label>
              <textarea name="menor_alergias" rows="3" placeholder="Describa aquí si aplica..." onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"></textarea>
            </div>
          </div>

          {/* DOBLE SECCIÓN DE CONSENTIMIENTOS BASADO EN image_f8e62f.png */}
          <div className="space-y-4 pt-2">
            {/* 1. Consentimiento Informado */}
            <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
              <input type="checkbox" name="menor_habeasData" checked={formData.menor_habeasData} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600" required />
              <div className="text-xs text-slate-600 leading-normal w-full">
                <p className="font-bold text-[#0F172A] text-sm mb-0.5">Consentimiento Informado</p>
                <p className="text-[#1E3A8A] text-[11px]">Autorizo el tratamiento de datos personales para fines internos del ministerio Sin Muros Kids.</p>
                <button type="button" className="text-blue-600 text-[11px] font-semibold underline mt-1 block">Leer términos y condiciones</button>
              </div>
            </div>

            {/* 2. Consentimiento Media */}
            <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
              <input type="checkbox" name="menor_mediaData" checked={formData.menor_mediaData} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600" required />
              <div className="text-xs text-slate-600 leading-normal w-full">
                <p className="font-bold text-[#0F172A] text-sm mb-0.5">Consentimiento Sin Muros Media</p>
                <p className="text-[#1E3A8A] text-[11px]">Autorizo la toma de fotografías para fines internos del ministerio Sin Muros Kids.</p>
                <button type="button" className="text-blue-600 text-[11px] font-semibold underline mt-1 block">Leer términos y condiciones</button>
              </div>
            </div>
          </div>

          {/* BOTONES ACCIÓN IDÉNTICOS A LA IMAGEN image_f8e62f.png */}
          <div className="flex items-center gap-4 pt-4">
            <button type="button" className="flex-1 sm:flex-none bg-[#E2E8F0] hover:bg-slate-300 text-slate-800 font-bold text-xs px-8 py-3 rounded-xl transition-all text-center">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#0252C9] to-[#633BE2] hover:opacity-90 text-white font-bold text-xs px-10 py-3 rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <span>Registrar</span>
                  <UserCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* COLUMNA LATERAL DERECHA RECOMENDACIONES */}
      <div className="w-full md:w-72 shrink-0 space-y-4 md:sticky md:top-8">
        <div className="bg-[#1E293B] text-slate-300 p-5 rounded-xl space-y-3 shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Info className="w-4 h-4 text-slate-400" />
            Recomendaciones
          </div>
          <ul className="text-[10px] space-y-2 list-disc list-inside text-slate-400 leading-normal">
            <li>Asegúrese de que el número de teléfono sea de WhatsApp para comunicaciones rápidas.</li>
            <li>Todos los campos marcados con (*) son estrictamente obligatorios por seguridad.</li>
            <li>Valide que el parentesco esté claramente especificado antes de finalizar.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}