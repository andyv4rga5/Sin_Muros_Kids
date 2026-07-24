'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Baby,
  Users,
  HeartPulse,
  Loader2,
  UserCheck,
  Info,
  UserPlus,
  Trash2
} from 'lucide-react';

export default function HojasDeVidaPage() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    menor_nombre: '', menor_apellido: '', menor_conQuienVive: '', menor_conQuienAsiste: '',
    menor_fechaNacimiento: '', menor_sexo: 'femenino', menor_documento: '', menor_direccion: '', menor_barrio: '',
    menor_alergias: '', menor_eps: '', menor_habeasData: false, menor_mediaData: false,
    acudientes: [
      { nombre: '', apellido: '', parentesco: '', telefono: '', correo: '' }
    ]
  });

  // Manejador para datos del menor y checkboxes generales
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'menor_documento') {
      const alfanumerico = value.replace(/[^a-zA-Z0-9]/g, '');
      setFormData(p => ({ ...p, [name]: alfanumerico }));
      return;
    }

    if (['menor_nombre', 'menor_apellido', 'menor_barrio', 'menor_conQuienVive', 'menor_conQuienAsiste', 'menor_eps'].includes(name)) {
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
      setFormData(p => ({ ...p, [name]: soloLetras }));
      return;
    }

    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAcudienteChange = (index, e) => {
    const { name, value } = e.target;
    const listaActualizada = [...formData.acudientes];

    if (name === 'telefono') {
      listaActualizada[index][name] = value.replace(/\D/g, '');
    } else if (['nombre', 'apellido', 'parentesco'].includes(name)) {
      listaActualizada[index][name] = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
    } else {
      listaActualizada[index][name] = value;
    }

    setFormData(p => ({ ...p, acudientes: listaActualizada }));
  };

  const agregarAcudiente = () => {
    setFormData(p => ({
      ...p,
      acudientes: [...p.acudientes, { nombre: '', apellido: '', parentesco: '', telefono: '', correo: '' }]
    }));
  };

  const eliminarAcudiente = (index) => {
    if (index === 0) return; // No permitir borrar el principal
    const filtrados = formData.acudientes.filter((_, i) => i !== index);
    setFormData(p => ({ ...p, acudientes: filtrados }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const limpiarTexto = (str) => str ? str.trim().replace(/\s+/g, ' ') : null;

      // Calcular la edad basada en el año de nacimiento
      const anioNacimiento = new Date(formData.menor_fechaNacimiento).getFullYear();
      const anioActual = new Date().getFullYear();
      const edadMinisterial = anioActual - anioNacimiento;

      // Determinar el grupoid
      let grupoCalculadoId = 1;
      if (edadMinisterial >= 3 && edadMinisterial <= 4) {
        grupoCalculadoId = 1;
      } else if (edadMinisterial >= 5 && edadMinisterial <= 6) {
        grupoCalculadoId = 2;
      } else if (edadMinisterial >= 7 && edadMinisterial <= 8) {
        grupoCalculadoId = 3;
      } else if (edadMinisterial >= 9 && edadMinisterial <= 10) {
        grupoCalculadoId = 4;
      } else if (edadMinisterial >= 11) {
        grupoCalculadoId = 5;
      }

      // --- PROCESAR ACUDIENTES PREVINIENDO DUPLICADOS EXCLUSIVOS ---
      const acudientesProcesados = [];
      const llavesVistas = new Set();

      formData.acudientes.forEach((ac) => {
        const tel = ac.telefono.trim();
        const nombreYApellido = `${limpiarTexto(ac.nombre)}${limpiarTexto(ac.apellido)}`.toLowerCase();

        if (!tel) return; // Ignorar vacíos

        const claveUnica = `${nombreYApellido}_${tel}`;

        if (!llavesVistas.has(claveUnica)) {
          llavesVistas.add(claveUnica);
          acudientesProcesados.push({ ...ac });
        }
      });

      if (acudientesProcesados.length === 0) {
        throw new Error("Debe ingresar al menos un acudiente válido con teléfono.");
      }

      const idsAcudientesVinculados = [];
      const telefonosEnEsteEnvio = new Set();

      for (let i = 0; i < acudientesProcesados.length; i++) {
        const ac = acudientesProcesados[i];
        let telContacto = ac.telefono.trim();

        if (telefonosEnEsteEnvio.has(telContacto)) {
          telContacto = `(57)${telContacto}`;
        }
        telefonosEnEsteEnvio.add(telContacto);

        const { data: acudienteExistente, error: errSearch } = await supabase
          .from('acudientes')
          .select('id')
          .eq('telefonocontacto', telContacto)
          .maybeSingle();

        if (errSearch) throw errSearch;

        let acudienteId;

        if (acudienteExistente) {
          acudienteId = acudienteExistente.id;
        } else {
          const { data: nuevoAcudiente, error: errInsertAc } = await supabase
            .from('acudientes')
            .insert({
              nombrecompleto: limpiarTexto(ac.nombre),
              apellidocompleto: limpiarTexto(ac.apellido),
              telefonocontacto: telContacto,
              correoelectronico: ac.correo ? limpiarTexto(ac.correo) : null
            })
            .select('id')
            .single();

          if (errInsertAc) throw errInsertAc;
          acudienteId = nuevoAcudiente.id;
        }

        idsAcudientesVinculados.push({
          acudiente_id: acudienteId,
          parentesco: ac.parentesco || 'Familiar',
          es_principal: i === 0
        });
      }

      const { data: menorInsertado, error: errM } = await supabase
        .from('menores')
        .insert({
          nombrecompleto: limpiarTexto(formData.menor_nombre),
          apellidocompleto: limpiarTexto(formData.menor_apellido),
          documentoidentidad: formData.menor_documento || null,
          fechanacimiento: formData.menor_fechaNacimiento,
          conquienvive: limpiarTexto(formData.menor_conQuienVive),
          conquienasisteiglesia: limpiarTexto(formData.menor_conQuienAsiste),
          direccionresidencia: limpiarTexto(formData.menor_direccion),
          barrioresidencia: limpiarTexto(formData.menor_barrio),
          alergiasorestricciones: formData.menor_alergias || 'Ninguna',
          epsseguromedico: formData.menor_eps || null,
          sexo: formData.menor_sexo,
          grupoid: grupoCalculadoId,
          consentimientoinformadoley1581datos: formData.menor_habeasData,
          consentimientoregistrofotografico: formData.menor_mediaData
        })
        .select('id')
        .single();

      if (errM) throw errM;

      const relacionesAInsertar = idsAcudientesVinculados.map(rel => ({
        menor_id: menorInsertado.id,
        acudiente_id: rel.acudiente_id,
        parentesco: rel.parentesco,
        es_principal: rel.es_principal
      }));

      const { error: errRel } = await supabase
        .from('menores_acudientes')
        .insert(relacionesAInsertar);

      if (errRel) throw errRel;

      alert('¡Menor y acudiente(s) registrados y vinculados con éxito! 🎉');

      setFormData({
        menor_nombre: '', menor_apellido: '', menor_conQuienVive: '', menor_conQuienAsiste: '',
        menor_fechaNacimiento: '', menor_sexo: 'femenino', menor_documento: '', menor_direccion: '', menor_barrio: '',
        menor_alergias: '', menor_eps: '', menor_habeasData: false, menor_mediaData: false,
        acudientes: [{ nombre: '', apellido: '', parentesco: '', telefono: '', correo: '' }]
      });

    } catch (err) {
      alert(`Error en el registro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start px-4 md:px-0 py-6">
      <div className="flex-1 min-w-0 bg-white md:bg-transparent p-6 md:p-0 rounded-2xl border border-slate-100 md:border-transparent">

        {/* HEADER CON LOGO INTEGRADO */}
        <header className="mb-8 flex items-center gap-5 border-b border-slate-100 pb-6">
          <img
            src="https://jgeoucfxieahezuayswr.supabase.co/storage/v1/object/public/Logos/Gemini_Generated_Image_c3mpj0c3mpj0c3mp-removebg-preview.png"
            alt="Logo Sin Muros Kids"
            className="w-[100px] h-[50px] object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Registro de Hoja de Vida</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-normal">Complete la información del menor y su acudiente para el proceso de registro al ministerio Sin Muros Kids.</p>
          </div>
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
                <input type="date" name="menor_fechaNacimiento" value={formData.menor_fechaNacimiento} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
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
                <input type="text" name="menor_direccion" value={formData.menor_direccion} placeholder="Ej. Calle 1 # 2-3" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Barrio de residencia *</label>
                <input type="text" name="menor_barrio" value={formData.menor_barrio} placeholder="Ej. Barrio Bosquesitos" onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
              </div>
            </div>
          </div>

          {/* BLOQUE B: INFORMACIÓN DEL ACUDIENTE */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 text-sm font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
                Información del Acudiente
              </div>

              <button
                type="button"
                onClick={agregarAcudiente}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Agregar acudiente</span>
              </button>
            </div>
            {formData.acudientes.map((acudiente, index) => (
              <div key={index} className={`p-4 rounded-xl border space-y-4 relative ${index === 0 ? 'border-slate-200 bg-slate-50/40' : 'border-purple-100 bg-purple-50/10'}`}>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {index === 0 ? 'Acudiente Principal *' : `Acudiente Adicional #${index + 1}`}
                  </span>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => eliminarAcudiente(index)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px] font-medium transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Nombre completo *</label>
                    <input type="text" name="nombre" value={acudiente.nombre} placeholder="Nombre" onChange={(e) => handleAcudienteChange(index, e)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Apellido completo *</label>
                    <input type="text" name="apellido" value={acudiente.apellido} placeholder="Apellidos" onChange={(e) => handleAcudienteChange(index, e)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Parentesco *</label>
                    <input type="text" name="parentesco" value={acudiente.parentesco} placeholder="Madre, Padre, Abuelo..." onChange={(e) => handleAcudienteChange(index, e)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Teléfono de Contacto *</label>
                    <input type="text" name="telefono" placeholder="Solo números" value={acudiente.telefono} onChange={(e) => handleAcudienteChange(index, e)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Correo Electrónico (Opcional)</label>
                    <input type="email" name="correo" value={acudiente.correo} placeholder="acudiente@ejemplo.com" onChange={(e) => handleAcudienteChange(index, e)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BLOQUE C: SALUD Y ALERGIAS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="p-1.5 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </span>
              Salud y Alergias (Opcional)
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">EPS / Seguro Médico</label>
                <input
                  type="text"
                  name="menor_eps"
                  value={formData.menor_eps}
                  placeholder="Ej. Sura, Sanitas, Nueva EPS..."
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">¿El menor padece alguna alergia o condición médica?</label>
                <textarea
                  name="menor_alergias"
                  value={formData.menor_alergias}
                  rows="3"
                  placeholder="Describa aquí si aplica..."
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                ></textarea>
              </div>
            </div>
          </div>

          {/* TEXTOS LEGALES Y DE PRIVACIDAD */}
          <div className="space-y-4 pt-2">
            <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
              <input type="checkbox" name="menor_habeasData" checked={formData.menor_habeasData} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600" />
              <div className="text-xs text-slate-600 leading-normal w-full">
                <p className="font-bold text-[#0F172A] text-sm mb-0.5">Consentimiento Informado</p>
                <p className="text-[#1E3A8A] text-[11px]">Autorizo el tratamiento de datos personales para fines internos del ministerio Sin Muros Kids.</p>
                <button type="button" className="text-blue-600 text-[11px] font-semibold underline mt-1 block">Leer términos y condiciones</button>
              </div>
            </div>

            <div className="bg-[#EFF6FF] p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
              <input type="checkbox" name="menor_mediaData" checked={formData.menor_mediaData} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600" />
              <div className="text-xs text-slate-600 leading-normal w-full">
                <p className="font-bold text-[#0F172A] text-sm mb-0.5">Consentimiento Sin Muros Media</p>
                <p className="text-[#1E3A8A] text-[11px]">Autorizo la toma de fotografías para fines internos del ministerio Sin Muros Kids.</p>
                <button type="button" className="text-blue-600 text-[11px] font-semibold underline mt-1 block">Leer términos y condiciones</button>
              </div>
            </div>
          </div>

          {/* BOTONES ACCIÓN */}
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