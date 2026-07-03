'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Baby,
  Users,
  HeartPulse,
  Loader2,
  Save,
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';

export default function HojasDeVidaPage() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    menor_nombre: '', menor_apellido: '', menor_conQuienVive: '', menor_conQuienAsiste: '',
    menor_fechaNacimiento: '', menor_sexo: '', menor_documento: '', menor_direccion: '', menor_barrio: '',
    acudiente_nombre: '', acudiente_apellido: '', acudiente_parentesco: '', acudiente_telefono: '', acudiente_correo: '',
    menor_alergias: '', menor_habeasData: false
  });

  useEffect(() => {
    async function cargarGrupos() {
      const { data } = await supabase.from('grupos').select('id, nombre');
      if (data && data.length > 0) {
        setGrupos(data);
        setFormData(p => ({ ...p, menor_sexo: data[0].id }));
      }
    }
    cargarGrupos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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
          alergiasorestricciones: formData.menor_alergias,
          grupoid: parseInt(formData.menor_sexo),
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
      {/* COLUMNA PRINCIPAL DEL FORMULARIO */}
      <div className="flex-1 min-w-0 bg-white md:bg-transparent p-6 md:p-0 rounded-2xl border border-slate-100 md:border-transparent">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Registro de Hoja de Vida</h1>
          <p className="text-xs text-slate-500 mt-1">Complete la información del menor y su acudiente para el proceso de registro a SMK.</p>
        </header>

        {/* Pasos en la parte superior (1, 2, 3) */}
        <div className="flex items-center justify-start gap-8 border-b border-slate-200 pb-4 mb-8 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2 text-blue-600 font-bold border-b-2 border-blue-600 pb-4 -mb-4">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span> Información Personal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span> Acudiente
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span> Salud
          </div>
        </div>

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
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre Completo</label>
                <input type="text" name="menor_nombre" placeholder="Ej. Juan" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Apellido Completo</label>
                <input type="text" name="menor_apellido" placeholder="Ej. Pérez" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">¿Con quién vive?</label>
                <input type="text" name="menor_conQuienVive" placeholder="Ej. Los papás" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">¿Con quién asiste a la iglesia?</label>
                <input type="text" name="menor_conQuienAsiste" placeholder="Ej. Los papás" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Fecha de Nacimiento</label>
                <input type="date" name="menor_fechaNacimiento" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Sexo (Grupo)</label>
                <select name="menor_sexo" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800">
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Documento de Identidad</label>
                <input type="text" name="menor_documento" placeholder="RC / TI" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Dirección de residencia</label>
                <input type="text" name="menor_direccion" placeholder="Ej. Calle 1 # 2-3" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Barrio de residencia</label>
                <input type="text" name="menor_barrio" placeholder="Ej. Barrio Bosquesitos" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 text-slate-800" />
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
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre completo del acudiente</label>
                <input type="text" name="acudiente_nombre" placeholder="Nombre" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Apellido completo del acudiente</label>
                <input type="text" name="acudiente_apellido" placeholder="Apellidos" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Parentesco</label>
                <input type="text" name="acudiente_parentesco" placeholder="Madre, Padre, Abuelo..." onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Teléfono de Contacto</label>
                <input type="tel" name="acudiente_telefono" placeholder="+57 300 000 0000" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Correo Electrónico</label>
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
              Salud y Alergias
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-2">¿El menor padece alguna alergia o condición médica?</label>
              <textarea name="menor_alergias" rows="3" placeholder="Describa aquí cualquier condición relevante..." onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"></textarea>
            </div>
          </div>

          {/* CONSENTIMIENTO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <input type="checkbox" name="menor_habeasData" onChange={handleChange} className="mt-1 rounded border-slate-300 text-blue-600 accent-blue-600" required />
            <div className="text-[11px] text-slate-600 leading-normal w-full">
              <p className="font-bold text-slate-800">Consentimiento Informado</p>
              Acepto el tratamiento de datos personales de acuerdo con la Ley 1581 de 2012 y autorizo el registro fotográfico del menor para uso exclusivo del ministerio.
              <a href="#" className="text-blue-600 flex items-center gap-1 mt-1 hover:underline font-medium">
                Ver Términos y Condiciones Legales <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* BOTONES ACCIÓN */}
          <div className="flex items-center justify-between pt-4">
            <button type="button" className="text-xs font-bold text-slate-500 hover:text-slate-800">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition-all flex items-center gap-2 disabled:opacity-70">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Registrar Menor
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* COLUMNA LATERAL DERECHA (Recomendaciones e Información) */}
      <div className="w-full md:w-72 shrink-0 space-y-4 md:sticky md:top-8">

        {/* Recomendaciones */}
        <div className="bg-[#1E293B] text-slate-300 p-5 rounded-xl space-y-3 shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Info className="w-4 h-4 text-slate-400" />
            Recomendaciones
          </div>
          <ul className="text-[10px] space-y-2 list-disc list-inside text-slate-400 leading-normal">
            <li>Asegúrese de que el número de teléfono sea de WhatsApp para comunicaciones rápidas.</li>
            <li>Adjunte una foto del carné de vacunación si es menor de 5 años.</li>
            <li>Valide que el parentesco esté claramente especificado por seguridad.</li>
          </ul>
        </div>

        {/* Soporte */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            ¿Necesitas ayuda?
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">Contacta al equipo técnico del ministerio SMK.</p>
          <a href="#" className="text-[10px] font-bold text-blue-600 block hover:underline">Abrir ticket de soporte &gt;</a>
        </div>
      </div>
    </div>
  );
}