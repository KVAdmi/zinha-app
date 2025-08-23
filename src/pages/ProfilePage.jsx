import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { User, Edit, Save, Camera, Heart, Briefcase, Meh, Smile, Frown, CreditCard, Bell, LogOut, Upload, Calendar, FileText, Loader2, Plus, Shield, Key, Users, ChevronDown, ChevronUp, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import supabase from '@/lib/customSupabaseClient';
import { generarYDescargarCert } from '@/lib/certificateGenerator';
import { createVita365Checkout } from '@/lib/stripePayments';
import { FLAGS } from '../config/flags.ts';
import EmergencyContacts from '@/components/security/EmergencyContacts.jsx';
import AddContactModal from '@/components/security/AddContactModal.jsx';
import StripePaymentModal from '@/components/payment/StripePaymentModal.jsx';

// Componente de formulario inline para agregar contactos
const AddContactFormInline = ({ onAdd, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [relacion, setRelacion] = useState('');
  const [prioridad, setPrioridad] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !telefono || !relacion || !prioridad) return;
    
    setSaving(true);
    await onAdd({ nombre, telefono, relacion, prioridad });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#382a3c] mb-4">Nuevo Contacto de Emergencia</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-3 bg-white/80 border border-white/60 rounded-xl focus:outline-none focus:border-[#c1d43a] text-[#382a3c]"
          required
          style={{ fontFamily: 'Questrial, sans-serif' }}
        />
        
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full px-4 py-3 bg-white/80 border border-white/60 rounded-xl focus:outline-none focus:border-[#c1d43a] text-[#382a3c]"
          required
          style={{ fontFamily: 'Questrial, sans-serif' }}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={relacion}
          onChange={(e) => setRelacion(e.target.value)}
          className="w-full px-4 py-3 bg-white/80 border border-white/60 rounded-xl focus:outline-none focus:border-[#c1d43a] text-[#382a3c]"
          required
          style={{ fontFamily: 'Questrial, sans-serif' }}
        >
          <option value="">Selecciona la relación</option>
          <option value="Familiar">Familiar</option>
          <option value="Amigo/a">Amigo/a</option>
          <option value="Pareja">Pareja</option>
          <option value="Compañero/a">Compañero/a</option>
          <option value="Vecino/a">Vecino/a</option>
          <option value="Otro">Otro</option>
        </select>
        
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(parseInt(e.target.value))}
          className="w-full px-4 py-3 bg-white/80 border border-white/60 rounded-xl focus:outline-none focus:border-[#c1d43a] text-[#382a3c]"
          required
          style={{ fontFamily: 'Questrial, sans-serif' }}
        >
          <option value={1}>🚨 Prioridad 1 - URGENTE (Familia/Pareja)</option>
          <option value={2}>⚠️ Prioridad 2 - IMPORTANTE (Amigos cercanos)</option>
          <option value={3}>📞 Prioridad 3 - APOYO (Vecinos/Conocidos)</option>
        </select>
      </div>
      
      <div className="flex space-x-3 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-gray-400 hover:bg-gray-500 text-white rounded-xl px-6 py-2"
          style={{ fontFamily: 'Questrial, sans-serif' }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving || !nombre || !telefono || !relacion || !prioridad}
          className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-xl px-6 py-2 font-semibold disabled:opacity-50"
          style={{ fontFamily: 'Questrial, sans-serif' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Contacto'
          )}
        </Button>
      </div>
    </form>
  );
};

const ProfilePage = () => {
  const { toast } = useToast();
  const { signOut: logout, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    momento_vida: 'emprendiendo',
    foto_url: '',
    tipo_plan: 'mensual', // Cambiar de 'basico' a 'mensual' por defecto
    nombre_completo: '',
    fecha_nacimiento: '',
    curp: '',
    coverage_id: '',
    id_vita: '',
    codigo_donativo: '',
    has_paid: false,
    plan_estado: 'inactivo', // 'inactivo', 'activo', 'vencido'
    fecha_inicio_plan: null,
    fecha_vencimiento_plan: null,
    cobertura_activa: false
  });
  const [editableProfile, setEditableProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVitaForm, setShowVitaForm] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVitaDataPrompt, setShowVitaDataPrompt] = useState(false);
  const [showContactsSection, setShowContactsSection] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('📋 Datos del perfil obtenidos:', { data, error });

        if (error && error.code !== 'PGRST116') {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu perfil.' });
        } else if (data) {
          console.log('✅ Perfil cargado:', data);
          setProfile(data);
          setEditableProfile(data);
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, toast]);

  // Cargar contactos de emergencia
  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  // Mostrar tarjeta de bienvenida para nuevos usuarios
  const loadContacts = async () => {
    if (!user) return;
    
    setContactsLoading(true);
    const { data, error } = await supabase
      .from('contactos_emergencia')
      .select('*')
      .eq('user_id', user.id);

    if (!error) {
      setContacts(data || []);
    }
    setContactsLoading(false);
  };

  const handleAddContact = async (contactData) => {
    const { data, error } = await supabase
      .from('contactos_emergencia')
      .insert([{
        ...contactData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo agregar el contacto'
      });
    } else {
      setContacts(prev => [...prev, data]);
      setShowContactModal(false);
      toast({
        title: 'Contacto agregado',
        description: 'El contacto de emergencia se agregó correctamente'
      });
    }
  };

  const handleDeleteContact = async (contactId) => {
    const { error } = await supabase
      .from('contactos_emergencia')
      .delete()
      .eq('id', contactId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el contacto'
      });
    } else {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      toast({
        title: 'Contacto eliminado',
        description: 'El contacto de emergencia se eliminó correctamente'
      });
    }
  };

  // Función para generar ID único de cobertura
  const generateCoverageId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `VITA-${timestamp}-${randomStr}`.toUpperCase();
  };

  // Función para generar ID Vita365 automáticamente
  const generateVitaId = (nombreCompleto, fechaNacimiento, curp = '') => {
    if (!nombreCompleto || !fechaNacimiento) return '';
    
    // Obtener iniciales del nombre (primera letra de nombre y apellido)
    const palabras = nombreCompleto.trim().split(' ').filter(word => word.length > 0);
    let iniciales = '';
    
    if (palabras.length >= 2) {
      // Primera letra del nombre y primera letra del primer apellido
      iniciales = (palabras[0][0] + palabras[1][0]).toUpperCase();
    } else if (palabras.length === 1) {
      // Solo hay un nombre, usar las dos primeras letras
      iniciales = palabras[0].substring(0, 2).toUpperCase();
    }
    
    // Obtener año de nacimiento
    const año = new Date(fechaNacimiento).getFullYear();
    
    // Si hay CURP, usar los últimos 2 caracteres, si no, usar timestamp
    let sufijo = '';
    if (curp && curp.length >= 2) {
      sufijo = curp.slice(-2);
    } else {
      sufijo = (Date.now() % 100).toString().padStart(2, '0');
    }
    
    return `ZINHA-${iniciales}-${año}-${sufijo}`;
  };

  // Función para calcular edad
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad;
  };

  // Función para validar CURP (18 caracteres)
  const validarCURP = (curp) => {
    if (!curp) return false;
    // Eliminar espacios y convertir a mayúsculas
    const curpLimpio = curp.replace(/\s/g, '').toUpperCase();
    return curpLimpio.length === 18;
  };

  // Función para validar códigos donativos (consulta básica)
  const validarCodigoDonativo = async (codigo) => {
    if (!codigo) return false;
    
    try {
      console.log('🔍 Validando código donativo en BD:', codigo);
      
      // Consulta básica para verificar si el código existe y está activo
      const { data, error } = await supabase
        .from('codigos_donativos')
        .select('codigo, activo, fecha_expiracion, usos_actuales, usos_maximos')
        .eq('codigo', codigo.toUpperCase())
        .eq('activo', true)
        .single();

      if (error || !data) {
        console.log('❌ Código no encontrado o inactivo:', error);
        return false;
      }

      // Verificación básica de expiración y usos
      const ahora = new Date();
      const expiracion = new Date(data.fecha_expiracion);
      
      if (ahora > expiracion) {
        console.log('⏰ Código expirado');
        return false;
      }

      if (data.usos_actuales >= data.usos_maximos) {
        console.log('🚫 Código agotado');
        return false;
      }

      console.log('✅ Código parece válido (verificación final con RPC)');
      return data; // Retornar los datos del código
      
    } catch (error) {
      console.error('💥 Error validando código:', error);
      return false;
    }
  };

  // Función MEJORADA para registrar el uso de un código donativo usando tu función RPC
  const registrarUsoCodigo = async (codigo) => {
    try {
      console.log('📝 Canjeando código donativo:', codigo);
      
      // Usar tu función RPC existente
      const { data, error } = await supabase.rpc('redeem_codigo_donativo', { 
        p_codigo: codigo.toUpperCase(), 
        p_user: user.id 
      });

      if (error) {
        console.error('❌ Error al canjear código:', error);
        throw new Error(`Error al canjear código: ${error.message}`);
      }

      if (data) {
        console.log("✅ Código canjeado con éxito:", data);
        return { success: true, message: 'Código aplicado exitosamente', data };
      } else {
        console.log("❌ Código inválido o ya usado");
        throw new Error('El código donativo es inválido, ya fue usado o ha expirado.');
      }
      
    } catch (error) {
      console.error('💥 Error en registrarUsoCodigo:', error);
      throw error;
    }
  };

  // Función para verificar si la usuaria tiene acceso gratuito via código donativo
  const tieneAccesoGratuito = () => {
    // Verificar si tiene has_paid = true Y un código donativo válido
    const tieneCodigoDonativo = profile.codigo_donativo && profile.codigo_donativo.trim() !== '';
    const haPagado = profile.has_paid === true;
    
    console.log('🔍 Verificando acceso gratuito:', {
      tieneCodigoDonativo,
      haPagado,
      codigo: profile.codigo_donativo
    });
    
    return haPagado && tieneCodigoDonativo;
  };

  // Función auxiliar para verificar si tiene acceso por pago normal (sin código)
  const tieneAccesoPorPago = () => {
    const noTieneCodigoDonativo = !profile.codigo_donativo || profile.codigo_donativo.trim() === '';
    const haPagado = profile.has_paid === true;
    
    return haPagado && noTieneCodigoDonativo;
  };

  // Función helper para UI - determinar estado del código donativo (síncrona)
  const getEstadoCodigoDonativo = (codigo) => {
    if (!codigo || !codigo.trim()) return null;
    
    // Si has_paid es true y tiene código, asumimos que es válido
    if (profile.has_paid && profile.codigo_donativo === codigo) {
      return {
        valido: true,
        mensaje: '✓ Válido - Acceso Vitalicio',
        color: 'green'
      };
    }
    
    // Si no está marcado como pagado, probablemente necesita validación
    return {
      valido: false,
      mensaje: '⏳ Pendiente de validación',
      color: 'yellow'
    };
  };

  // Función para validar mayoría de edad
  const esMayorDeEdad = (fechaNacimiento) => {
    return calcularEdad(fechaNacimiento) >= 18;
  };

  // Manejar guardado de datos Vita365
  const handleSaveVitaData = async () => {
    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: 'Error de autenticación', 
        description: 'No hay usuario autenticado. Inicia sesión nuevamente.' 
      });
      return;
    }
    
    console.log('Usuario autenticado:', user.id);
    
    // Validaciones básicas
    const planSeleccionado = editableProfile.plan_pago || editableProfile.tipo_plan;
    if (!editableProfile.nombre_completo || !editableProfile.fecha_nacimiento || !editableProfile.curp || !planSeleccionado) {
      toast({ 
        variant: 'destructive', 
        title: 'Campos incompletos', 
        description: 'Por favor completa nombre, fecha de nacimiento, CURP y plan de pago.' 
      });
      return;
    }

    // Validación de CURP (18 caracteres)
    if (!validarCURP(editableProfile.curp)) {
      toast({ 
        variant: 'destructive', 
        title: 'CURP inválido', 
        description: 'El CURP debe tener exactamente 18 caracteres. Por favor revisa la información.' 
      });
      return;
    }

    // Validación de mayoría de edad
    if (!esMayorDeEdad(editableProfile.fecha_nacimiento)) {
      const edad = calcularEdad(editableProfile.fecha_nacimiento);
      toast({ 
        variant: 'destructive', 
        title: 'Edad no válida', 
        description: `Debes ser mayor de edad para registrarte en Vita365. Tu edad actual: ${edad} años.` 
      });
      return;
    }

    setSaving(true);
    try {
      // Generar ID Vita365 automáticamente si no existe
      const vitaId = editableProfile.id_vita || generateVitaId(
        editableProfile.nombre_completo, 
        editableProfile.fecha_nacimiento, 
        editableProfile.curp
      );
      
      // Generar ID de cobertura si no existe
      const coverage_id = profile.coverage_id || generateCoverageId();

      // Verificar si tiene código donativo válido
      const codigoDonativo = editableProfile.codigo_donativo?.toUpperCase();
      let tieneCodigoValido = false;
      let codigoData = null;
      
      if (codigoDonativo) {
        console.log('🔍 Procesando código donativo:', codigoDonativo);
        
        // Primero hacer una validación básica
        codigoData = await validarCodigoDonativo(codigoDonativo);
        
        if (codigoData) {
          // Si pasa la validación básica, intentar canjearlo con tu función RPC
          try {
            console.log('💳 Intentando canjear código con RPC...');
            const resultadoCanje = await registrarUsoCodigo(codigoDonativo);
            
            if (resultadoCanje.success) {
              tieneCodigoValido = true;
              console.log('✅ Código canjeado exitosamente');
            }
            
          } catch (error) {
            console.error('❌ Error al canjear código:', error);
            toast({
              variant: 'destructive',
              title: 'Error con el código donativo',
              description: error.message || 'El código donativo no pudo ser aplicado. Puede que ya haya sido usado o sea inválido.'
            });
            setSaving(false);
            return;
          }
        } else if (codigoDonativo) {
          // Si el código no es válido desde la validación básica
          toast({
            variant: 'destructive',
            title: 'Código donativo inválido',
            description: 'El código ingresado no existe, ha expirado o ya alcanzó su límite de usos.'
          });
          setSaving(false);
          return;
        }
      }

      console.log('💾 Guardando datos con código donativo:', {
        codigoOriginal: editableProfile.codigo_donativo,
        codigoDonativo,
        tieneCodigoValido,
        editableProfile
      });

      // Debug: Ver qué datos vamos a guardar
      const dataToUpdate = {
        nombre_completo: editableProfile.nombre_completo,
        fecha_nacimiento: editableProfile.fecha_nacimiento,
        curp: editableProfile.curp.toUpperCase(),
        id_vita: vitaId,
        coverage_id,
        profile_completed: true,
        tipo_plan: editableProfile.plan_pago || 'mensual', // Mapear plan_pago a tipo_plan
        codigo_donativo: codigoDonativo || null,
        has_paid: tieneCodigoValido, // Si tiene código válido, marcar como pagado
        updated_at: new Date().toISOString()
      };
      
      console.log('Datos a guardar:', dataToUpdate);
      console.log('User ID:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', user.id);

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error al guardar datos Vita365:', error);
        throw error;
      }

      // Actualizar los estados con los nuevos datos
      const updatedProfile = { 
        ...profile, 
        ...editableProfile, 
        id_vita: vitaId, 
        coverage_id,
        profile_completed: true,
        codigo_donativo: codigoDonativo,
        has_paid: tieneCodigoValido
      };
      
      setProfile(updatedProfile);
      setEditableProfile(updatedProfile);
      setShowVitaForm(false);
      
      // Mensaje personalizado según si tiene código donativo o no
      if (tieneCodigoValido) {
        toast({ 
          title: '🎉 ¡Código donativo aplicado exitosamente!', 
          description: `¡Felicitaciones! Tienes acceso VITALICIO a Zinha. Tu ID Vita365: ${vitaId}`,
          className: 'bg-green-100 border-green-400 text-green-800',
          duration: 6000 // Mostrar más tiempo para que lean el mensaje importante
        });
      } else {
        toast({ 
          title: 'Datos Vita365 guardados', 
          description: `Tu ID Vita365: ${vitaId}. Ahora procede con el pago para activar tu membresía.` 
        });
      }
    } catch (error) {
      console.error('Error completo:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al guardar datos', 
        description: error.message || 'No se pudieron guardar los datos. Revisa la consola para más detalles.' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para generar vista previa del ID Vita365
  const getVitaIdPreview = () => {
    if (editableProfile.nombre_completo && editableProfile.fecha_nacimiento) {
      return generateVitaId(
        editableProfile.nombre_completo, 
        editableProfile.fecha_nacimiento, 
        editableProfile.curp
      );
    }
    return '';
  };

  // Función para descargar certificado personalizado con ID Vita365
  const handleDownloadCertificateWithVitaId = async () => {
    if (!profile.id_vita) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes un ID Vita365 asignado"
      });
      return;
    }

    setGeneratingCert(true);
    toast({
      title: "Descargando certificado",
      description: "Preparando tu certificado personalizado..."
    });

    try {
      // URL del PDF en Supabase
      const pdfUrl = 'https://gptwzuqmuvzttajgjrry.supabase.co/storage/v1/object/public/documentos-seguridad/Cobertura%20Vita365%20-%20Zinha.pdf';
      
      // Descargar el PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('No se pudo descargar el certificado');
      }
      
      const blob = await response.blob();
      
      // Crear un enlace de descarga con el nombre personalizado
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado_Vita365_${profile.id_vita}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "¡Certificado descargado!",
        description: `Tu certificado personalizado ${profile.id_vita} ha sido descargado exitosamente`
      });

    } catch (error) {
      console.error('Error al descargar certificado:', error);
      toast({
        variant: "destructive",
        title: "Error al descargar certificado",
        description: error.message || "No se pudo descargar el certificado. Inténtalo de nuevo."
      });
    } finally {
      setGeneratingCert(false);
    }
  };

  // Función para generar certificado usando Edge Function
  const handleGenerateCertificate = async () => {
    setGeneratingCert(true);
    toast({
      title: "Generando certificado",
      description: "Personalizando tu certificado Vita365..."
    });

    try {
      await generarYDescargarCert();
      
      toast({
        title: "¡Certificado generado!",
        description: "Tu certificado Vita365 ha sido generado y descargado exitosamente"
      });

    } catch (error) {
      console.error('Error al generar certificado:', error);
      toast({
        variant: "destructive",
        title: "Error al generar certificado",
        description: error.message || "No se pudo generar el certificado. Inténtalo de nuevo."
      });
    } finally {
      setGeneratingCert(false);
    }
  };

  // Función para procesar pago con Stripe
  const handlePayment = async () => {
    const planSeleccionado = editableProfile.plan_pago || editableProfile.tipo_plan || profile.tipo_plan;
    console.log('🎯 Plan seleccionado para pago:', planSeleccionado);
    
    if (!planSeleccionado) {
      toast({
        variant: "destructive",
        title: "Selecciona un plan",
        description: "Por favor selecciona un plan de pago antes de continuar."
      });
      return;
    }

    // Validar que el perfil esté completo antes del pago
    if (!isFormValid()) {
      toast({
        variant: "destructive",
        title: "Completa tu perfil",
        description: "Debes completar todos los campos obligatorios antes de proceder al pago."
      });
      return;
    }

    // Guardar perfil antes de proceder al pago
    try {
      await handleSave();
      console.log('✅ Perfil guardado, procediendo al pago...');
    } catch (error) {
      console.error('❌ Error al guardar perfil:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudo guardar tu perfil. Intenta de nuevo."
      });
      return;
    }

    setProcessingPayment(true);
    toast({
      title: "Procesando pago",
      description: "Redirigiendo a la plataforma de pago segura..."
    });

    try {
      console.log('🚀 Iniciando checkout con datos:', {
        plan: planSeleccionado,
        perfil: editableProfile
      });
      
      await createVita365Checkout(planSeleccionado, editableProfile);
    } catch (error) {
      console.error('💥 Error al procesar pago:', error);
      toast({
        variant: "destructive",
        title: "Error en el pago",
        description: error.message || "No se pudo procesar el pago. Verifica tu conexión e inténtalo de nuevo."
      });
      setProcessingPayment(false);
    }
  };

  const handleLifeMomentChange = (moment) => {
    if (isEditing) {
      setEditableProfile(prev => ({ ...prev, momento_vida: moment }));
    }
  };

  const handleInputChange = (field, value) => {
    if (isEditing) {
      setEditableProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editableProfile.username,
          momento_vida: editableProfile.momento_vida
        })
        .eq('id', user.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.' });
      } else {
        setProfile(editableProfile);
        toast({ title: 'Perfil actualizado', description: 'Tus cambios han sido guardados con éxito.' });
        setIsEditing(false);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Actualizar estado local
      setProfile(prev => ({ ...prev, foto_url: publicUrl.publicUrl }));
      setEditableProfile(prev => ({ ...prev, foto_url: publicUrl.publicUrl }));
      
      toast({ title: 'Foto actualizada', description: 'Tu foto de perfil ha sido actualizada.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al subir foto', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  // Función para calcular fecha de vencimiento
  const calcularFechaVencimiento = (tipoPlan, fechaInicio = new Date()) => {
    const fecha = new Date(fechaInicio);
    
    switch (tipoPlan) {
      case 'mensual':
        fecha.setMonth(fecha.getMonth() + 1);
        break;
      case 'trimestral':
        fecha.setMonth(fecha.getMonth() + 3);
        break;
      case 'semestral':
        fecha.setMonth(fecha.getMonth() + 6);
        break;
      case 'anual':
        fecha.setFullYear(fecha.getFullYear() + 1);
        break;
      case 'donativo':
        // Códigos donativo tienen 1 año desde activación
        fecha.setFullYear(fecha.getFullYear() + 1);
        break;
      default:
        fecha.setMonth(fecha.getMonth() + 1);
    }
    
    return fecha;
  };

  // Función para manejar activación exitosa (pago o código)
  const handleActivacionExitosa = async (tipoActivacion, tipoPlan = null) => {
    try {
      const fechaInicio = new Date();
      const fechaVencimiento = calcularFechaVencimiento(
        tipoActivacion === 'donativo' ? 'donativo' : tipoPlan, 
        fechaInicio
      );

      // Actualizar perfil con datos de plan
      const updates = {
        plan_estado: 'activo',
        fecha_inicio_plan: fechaInicio.toISOString(),
        fecha_vencimiento_plan: fechaVencimiento.toISOString(),
        cobertura_activa: false, // Se activa después de 24 horas
        has_paid: tipoActivacion === 'pago' ? true : profile.has_paid,
        codigo_donativo: tipoActivacion === 'donativo' ? profile.codigo_donativo : profile.codigo_donativo
      };

      // Actualizar en Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      // Actualizar estado local
      setProfile(prev => ({ ...prev, ...updates }));

      // Mostrar prompt para completar datos de Vita365
      setShowVitaDataPrompt(true);

      toast({
        title: tipoActivacion === 'donativo' ? '¡Código activado exitosamente! 🎉' : '¡Pago procesado exitosamente! 🎉',
        description: 'Tu cobertura se activará en las próximas 24 horas. Completa tus datos de Vita365 para estar lista.',
        className: 'bg-green-100 border-green-400 text-green-800'
      });

    } catch (error) {
      console.error('Error al procesar activación:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar activación",
        description: "Hubo un problema al activar tu plan. Contáctanos si persiste."
      });
    }
  };

  // Función para ir a la página de pago
  const handleGoToPayment = async () => {
    console.log(' Pagar o ingresar código de donativo presionado');
    console.log(' Estado del perfil:', profile);
    
    // Verificar si tiene código donativo válido (acceso vitalicio)
    if (tieneAccesoGratuito()) {
      toast({
        title: "¡Acceso vitalicio activo! ",
        description: `Ya tienes acceso vitalicio con tu código donativo ${profile.codigo_donativo}. ¡Disfruta Zinha sin límites!`,
        className: 'bg-green-100 border-green-400 text-green-800'
      });
      return;
    }

    // Verificar si ya ha pagado por suscripción normal
    if (tieneAccesoPorPago()) {
      toast({
        title: "Membresía activa ✅",
        description: "Tu membresía ya está activa. Puedes gestionar tu plan desde configuración.",
      });
      return;
    }
    
    // Si no tiene acceso, abrir modal de pago
    setShowPaymentModal(true);
  };

  // Función para manejar el éxito del pago
  const handlePaymentSuccess = async (tipoPlan = 'mensual') => {
    try {
      // Usar la nueva función de activación
      await handleActivacionExitosa('pago', tipoPlan);
      
      // Recargar datos del perfil desde la base de datos
      await loadProfile();
      
    } catch (error) {
      console.error('Error al actualizar después del pago:', error);
      toast({
        variant: "destructive",
        title: "Error al confirmar pago",
        description: "Tu pago fue procesado pero hubo un problema actualizando tu perfil. Contáctanos."
      });
    }
  };

  const lifeMoments = {
    feliz: { icon: Smile, label: 'Feliz', color: 'bg-brand-highlight' },
    duelo: { icon: Frown, label: 'En Duelo', color: 'bg-brand-secondary' },
    emprendiendo: { icon: Briefcase, label: 'Emprendiendo', color: 'bg-brand-dark-blue' },
    soledad: { icon: Meh, label: 'En Soledad', color: 'bg-brand-primary' },
    maternando: { icon: Heart, label: 'Maternando', color: 'bg-pink-400' },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5e6ff] via-[#e8d8f0] to-[#c8a6a6] p-4 overflow-hidden relative">
      {/* Elementos decorativos de fondo más alegres */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-[#c1d43a]/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-[#c8a6a6]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#8d7583]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-20 w-24 h-24 bg-[#f5e6ff]/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-36 h-36 bg-[#c1d43a]/15 rounded-full blur-2xl"></div>
      </div>

      <Helmet>
        <title>Mi Perfil - Zinha</title>
        <meta name="description" content="Gestiona tu perfil, comparte sobre ti y elige tu momento de vida." />
        <link href="https://fonts.googleapis.com/css2?family=Questrial&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Tarjeta de prompt para completar datos Vita365 */}
      {showVitaDataPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/50" style={{ fontFamily: 'Questrial, sans-serif' }}>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-r from-[#c1d43a] to-[#a8c139] rounded-full">
                <img 
                  src="/public/images/Logo Zinha1.png" 
                  alt="Zinha" 
                  className="w-6 h-6"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#382a3c] mb-2">¡Bienvenida a Vita365! 🎉</h3>
                <p className="text-sm text-[#382a3c]/80 mb-4">
                  Tu cobertura se activará en las próximas 24 horas. Completa tus datos para estar completamente protegida.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowVitaDataPrompt(false);
                      // Scroll to Vita365 section
                      document.getElementById('vita365-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] text-[#382a3c] px-4 py-2 rounded-xl font-semibold text-sm"
                  >
                    Completar datos
                  </button>
                  <button
                    onClick={() => setShowVitaDataPrompt(false)}
                    className="bg-white/70 text-[#382a3c] px-4 py-2 rounded-xl font-semibold text-sm border border-white/60"
                  >
                    Más tarde
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowVitaDataPrompt(false)}
                className="text-[#382a3c]/60 hover:text-[#382a3c] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto relative z-10"
      >
        {/* Header del perfil - con más color y alegría */}
        <div className="relative bg-gradient-to-br from-white/40 via-[#f5e6ff]/30 to-white/35 backdrop-blur-xl rounded-[2rem] p-8 text-center mb-6 shadow-2xl border border-white/50" style={{ fontFamily: 'Questrial, sans-serif' }}>
          <div className="absolute top-6 right-6 flex space-x-3">
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
              size="icon" 
              disabled={saving}
              className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-full shadow-xl border-2 border-white/50 font-bold"
              style={{ boxShadow: '0 8px 25px rgba(193, 212, 58, 0.4)' }}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />)}
            </Button>
            <Button 
              onClick={logout} 
              size="icon" 
              className="bg-gradient-to-r from-[#c8a6a6] to-[#b89696] hover:from-[#b89696] hover:to-[#c8a6a6] text-white rounded-full shadow-xl border-2 border-white/50 font-bold"
              style={{ boxShadow: '0 8px 25px rgba(200, 166, 166, 0.4)' }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Foto de perfil con colores más alegres */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#c1d43a] via-[#c8a6a6] to-[#8d7583] p-2 shadow-2xl" style={{ boxShadow: '0 15px 35px rgba(193, 212, 58, 0.3)' }}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/90 to-[#f5e6ff]/80 p-1">
                <img 
                  src={profile.foto_url || 'https://storage.googleapis.com/hostinger-horizons-assets-prod/ce6b3f33-5fa3-4c63-a670-0869d616221b/0e777a8766c7bd2db6c389ce3909c978.png'} 
                  alt="Foto de perfil" 
                  className="w-full h-full rounded-full object-cover shadow-inner" 
                />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              disabled={uploading}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current.click()} 
              disabled={uploading} 
              className="absolute bottom-3 right-3 bg-gradient-to-r from-[#c1d43a] to-[#a8c139] text-[#382a3c] p-3 rounded-full hover:from-[#a8c139] hover:to-[#c1d43a] shadow-xl border-2 border-white font-bold"
              style={{ boxShadow: '0 8px 20px rgba(193, 212, 58, 0.4)' }}
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            </button>
          </div>

          {/* Información del usuario más elegante */}
          <div className="text-center mb-8">
            {isEditing ? (
              <input
                type="text"
                value={editableProfile.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="text-2xl font-bold text-[#382a3c] bg-white/60 backdrop-blur-sm border-2 border-[#c1d43a]/50 rounded-full px-6 py-3 text-center focus:outline-none focus:border-[#8d75838] focus:bg-white/80 transition-all duration-300 shadow-lg"
                placeholder="Tu nombre de usuario"
                style={{ fontFamily: 'Questrial, sans-serif' }}
              />
            ) : (
              <h1 className="text-3xl font-bold text-[#382a3c] mb-3 drop-shadow-sm" style={{ fontFamily: 'Questrial, sans-serif' }}>
                {profile.username || user.email}
              </h1>
            )}
            
            <div className="flex justify-center items-center space-x-2 mb-4">
              <span className="px-6 py-3 bg-gradient-to-r from-[#c1d43a] to-[#a8c139] text-[#382a3c] rounded-full text-sm font-bold border-2 border-white/50 backdrop-blur-sm shadow-xl">
                 {profile.tipo_plan || 'básico'} Plan
              </span>
            </div>
            
            {profile.coverage_id && (
              <p className="text-xs text-[#382a3c] font-mono bg-gradient-to-r from-white/60 to-white/40 rounded-full px-6 py-3 inline-block backdrop-blur-sm shadow-lg border-2 border-white/60 font-bold">
                🆔 ID: {profile.coverage_id}
              </p>
            )}
          </div>
        </div>

        {/* Información Personal - Vita365 con colores más alegres */}
        <div id="vita365-section" className="bg-gradient-to-br from-white/40 via-[#f5e6ff]/20 to-white/35 backdrop-blur-xl rounded-[2rem] p-8 mb-6 shadow-2xl border border-white/50" style={{ fontFamily: 'Questrial, sans-serif' }}>
          <div className="relative mb-8">
            <h2 className="text-2xl font-bold text-[#382a3c] text-center" style={{ fontFamily: 'Questrial, sans-serif' }}>
              Información Vita365
            </h2>
            <div className="absolute right-0 top-0 flex space-x-3">
              {/* Botón para descargar certificado personalizado - solo después de completar el formulario */}
              {profile.id_vita && profile.nombre_completo && profile.fecha_nacimiento && profile.curp && (tieneAccesoGratuito() || profile.has_paid) && (
                <Button 
                  onClick={handleDownloadCertificateWithVitaId}
                  disabled={generatingCert}
                  className="text-white text-sm px-6 py-3 rounded-full font-semibold shadow-xl border-2 border-white/50 bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a]"
                  style={{ 
                    fontFamily: 'Questrial, sans-serif',
                    boxShadow: '0 8px 25px rgba(193, 212, 58, 0.4)'
                  }}
                >
                  {generatingCert ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#382a3c]" />
                      <span className="text-[#382a3c]">Descargando...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2 text-[#382a3c]" />
                      <span className="text-[#382a3c]">Descarga tu Certificado</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Formulario Vita365 */}
          {showVitaForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-8 border-t border-white/40 pt-8"
              style={{ fontFamily: 'Questrial, sans-serif' }}
            >
              <div className="text-center bg-gradient-to-r from-white/50 to-white/30 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
                <p className="text-[#382a3c] text-sm font-medium">
                   Completa estos datos para activar tu cobertura Vita365 
                </p>
              </div>
              
              <div className="grid gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[#382a3c] mb-3">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={editableProfile.nombre_completo || ''}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, nombre_completo: e.target.value }))}
                    placeholder="Escribe tu nombre completo aquí"
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 transition-all duration-300 shadow-lg text-[#382a3c] placeholder-[#382a3c]/50"
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[#382a3c] mb-3">
                    Fecha de nacimiento * (Debes ser mayor de edad)
                  </label>
                  <input
                    type="date"
                    value={editableProfile.fecha_nacimiento || ''}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                    placeholder="dd/mm/aaaa"
                    className={`w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none transition-all duration-300 shadow-lg text-[#382a3c] placeholder-[#382a3c]/50 ${
                      editableProfile.fecha_nacimiento && !esMayorDeEdad(editableProfile.fecha_nacimiento)
                        ? 'border-red-400 focus:border-red-500 bg-red-50/80' 
                        : editableProfile.fecha_nacimiento && esMayorDeEdad(editableProfile.fecha_nacimiento)
                        ? 'border-green-400 focus:border-green-500 bg-green-50/80'
                        : 'border-white/60 focus:border-[#c1d43a] focus:bg-white/90'
                    }`}
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  />
                  {editableProfile.fecha_nacimiento && (
                    <div className={`text-xs mt-3 px-4 py-2 rounded-full text-center font-medium shadow-md ${
                      esMayorDeEdad(editableProfile.fecha_nacimiento) 
                        ? 'text-green-700 bg-green-100/80 border border-green-200' 
                        : 'text-red-700 bg-red-100/80 border border-red-200'
                    }`}>
                      Edad: {calcularEdad(editableProfile.fecha_nacimiento)} años
                      {esMayorDeEdad(editableProfile.fecha_nacimiento) 
                        ? ' ✓ Mayor de edad' 
                        : ' ⚠️ Debes ser mayor de edad'
                      }
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[#382a3c] mb-3">
                    CURP * (18 caracteres)
                  </label>
                  <input
                    type="text"
                    value={editableProfile.curp || ''}
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase().replace(/\s/g, '');
                      setEditableProfile(prev => ({ ...prev, curp: valor }));
                    }}
                    placeholder="Ejemplo: AAAA000000HAAAA00"
                    className={`w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none font-mono transition-all duration-300 shadow-lg text-[#382a3c] placeholder-[#382a3c]/50 ${
                      editableProfile.curp && !validarCURP(editableProfile.curp)
                        ? 'border-red-400 focus:border-red-500 bg-red-50/80' 
                        : editableProfile.curp && validarCURP(editableProfile.curp)
                        ? 'border-green-400 focus:border-green-500 bg-green-50/80'
                        : 'border-white/60 focus:border-[#c1d43a] focus:bg-white/90'
                    }`}
                    maxLength="18"
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  />
                  {editableProfile.curp && (
                    <div className={`text-xs mt-3 px-4 py-2 rounded-full text-center font-medium shadow-md ${
                      validarCURP(editableProfile.curp) 
                        ? 'text-green-700 bg-green-100/80 border border-green-200' 
                        : 'text-red-700 bg-red-100/80 border border-red-200'
                    }`}>
                      {editableProfile.curp.length}/18 caracteres
                      {validarCURP(editableProfile.curp) 
                        ? ' ✓ CURP válido' 
                        : ` - ${18 - editableProfile.curp.length} caracteres faltantes`
                      }
                    </div>
                  )}
                </div>

                {/* Campo Código Donativo */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#382a3c] mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Código Donativo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe tu código donativo aquí"
                    value={editableProfile.codigo_donativo || ''}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, codigo_donativo: e.target.value.toUpperCase() }))}
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 uppercase transition-all duration-300 shadow-lg text-[#382a3c] placeholder-[#382a3c]/50"
                    maxLength="20"
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  />
                  <p className="text-xs text-[#382a3c]/70 mt-2 px-3 py-1 bg-white/30 rounded-full text-center">
                     Si tienes un código donativo, podrás acceder a todos los beneficios de manera gratuita
                  </p>
                </div>

                {/* Campo ID Vita365 - Solo lectura, generado automáticamente */}
                <div>
                  <label className="block text-sm font-semibold text-[#382a3c] mb-3">
                    ID Vita365 (Generado automáticamente)
                  </label>
                  <input
                    type="text"
                    value={getVitaIdPreview() || ''}
                    placeholder="Se generará automáticamente al completar los datos"
                    readOnly
                    className="w-full px-6 py-4 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl font-mono text-[#382a3c]/70 cursor-not-allowed placeholder-[#382a3c]/40 shadow-lg"
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  />
                </div>

                {/* Plan de Pago */}
                <div>
                  <label className="block text-sm font-semibold text-[#382a3c] mb-3">
                    Plan de Pago *
                  </label>
                  <select
                    value={editableProfile.tipo_plan || 'mensual'}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, plan_pago: e.target.value }))}
                    className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 transition-all duration-300 shadow-lg text-[#382a3c]"
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  >
                    <option value="mensual">Mensual - $149 MXN/mes</option>
                    <option value="trimestral">3 Meses - $402 MXN ($134/mes)</option>
                    <option value="semestral">6 Meses - $804 MXN ($134/mes)</option>
                    <option value="anual">12 Meses - $1,296 MXN ($108/mes)</option>
                  </select>
                  <div className="text-xs text-[#382a3c]/70 mt-2 px-3 py-2 bg-white/30 rounded-2xl text-center">
                    {(editableProfile.tipo_plan || editableProfile.plan_pago) === 'mensual' && '💳 Facturación mensual'}
                    {(editableProfile.tipo_plan || editableProfile.plan_pago) === 'trimestral' && '💰 Ahorra $45 - Facturación cada 3 meses'}
                    {(editableProfile.tipo_plan || editableProfile.plan_pago) === 'semestral' && '💰 Ahorra $90 - Facturación cada 6 meses'}
                    {(editableProfile.tipo_plan || editableProfile.plan_pago) === 'anual' && '🎉 Ahorra $492 al año - Facturación anual'}
                  </div>
                </div>

                {/* Vista previa del ID Vita365 */}
                {getVitaIdPreview() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      📋 Tu ID Vita365 será:
                    </h4>
                    <div className="font-mono text-lg text-green-900 bg-white px-3 py-2 rounded border">
                      {getVitaIdPreview()}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Se generará automáticamente al guardar tus datos
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button 
                  onClick={() => setShowVitaForm(false)}
                  className="bg-gradient-to-r from-white/70 to-white/50 hover:from-white/80 hover:to-white/70 text-[#382a3c] border-2 border-[#c8a6a6]/50 rounded-2xl backdrop-blur-sm font-semibold shadow-lg"
                  style={{ fontFamily: 'Questrial, sans-serif' }}
                >
                   Cancelar
                </Button>
                <Button 
                  onClick={handleSaveVitaData}
                  disabled={
                    saving || 
                    !editableProfile.nombre_completo || 
                    !editableProfile.fecha_nacimiento || 
                    !editableProfile.curp ||
                    !(editableProfile.plan_pago || editableProfile.tipo_plan) ||
                    !validarCURP(editableProfile.curp) ||
                    !esMayorDeEdad(editableProfile.fecha_nacimiento)
                  }
                  className={`text-white rounded-2xl font-semibold shadow-xl border-2 border-white/30 ${
                    saving || 
                    !editableProfile.nombre_completo || 
                    !editableProfile.fecha_nacimiento || 
                    !editableProfile.curp ||
                    !(editableProfile.plan_pago || editableProfile.tipo_plan) ||
                    !validarCURP(editableProfile.curp) ||
                    !esMayorDeEdad(editableProfile.fecha_nacimiento)
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c]'
                  }`}
                  style={{ 
                    fontFamily: 'Questrial, sans-serif',
                    boxShadow: saving || 
                      !editableProfile.nombre_completo || 
                      !editableProfile.fecha_nacimiento || 
                      !editableProfile.curp ||
                      !(editableProfile.plan_pago || editableProfile.tipo_plan) ||
                      !validarCURP(editableProfile.curp) ||
                      !esMayorDeEdad(editableProfile.fecha_nacimiento) ? '' : '0 8px 25px rgba(193, 212, 58, 0.4)'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                       Guardar y Continuar
                    </>
                  )}
                </Button>
                
                {/* Botón de pago - más colorido */}
                {profile.profile_completed && (profile.tipo_plan || editableProfile.plan_pago) && (
                  <Button 
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className={`text-white rounded-2xl font-semibold shadow-xl border-2 border-white/30 ${
                      processingPayment 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#8d7583] to-[#382a3c] hover:from-[#382a3c] hover:to-[#8d7583]'
                    }`}
                    style={{ fontFamily: 'Questrial, sans-serif' }}
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceder al Pago
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Vista de datos guardados */
            <div className="space-y-4" style={{ fontFamily: 'Questrial, sans-serif' }}>
              {profile.nombre_completo ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-[#382a3c]" />
                      <span className="text-[#382a3c] font-medium">Nombre completo</span>
                    </div>
                    <span className="text-sm text-[#382a3c]/70">{profile.nombre_completo}</span>
                  </div>
                  
                  {profile.fecha_nacimiento && (
                    <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-[#382a3c]" />
                        <span className="text-[#382a3c] font-medium">Fecha de nacimiento</span>
                      </div>
                      <span className="text-sm text-[#382a3c]/70">{new Date(profile.fecha_nacimiento).toLocaleDateString('es-MX')}</span>
                    </div>
                  )}
                  
                  {profile.curp && (
                    <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#382a3c]" />
                        <span className="text-[#382a3c] font-medium">CURP</span>
                      </div>
                      <span className="text-sm text-[#382a3c]/70 font-mono">{profile.curp}</span>
                    </div>
                  )}

                  {/* Estado de Membresía */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[#382a3c] mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Estado de Membresía
                    </h3>
                    
                    {tieneAccesoGratuito() ? (
                      <div className="p-4 bg-gradient-to-r from-green-100/80 to-emerald-100/80 border border-green-300/60 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-800 font-bold text-lg">🎉 Acceso Vitalicio</p>
                            <p className="text-green-700 text-sm">Código donativo aplicado exitosamente</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 text-xs">Sin límites</p>
                            <p className="text-green-600 text-xs">Para siempre</p>
                          </div>
                        </div>
                      </div>
                    ) : tieneAccesoPorPago() ? (
                      <div className="p-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 border border-blue-300/60 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-800 font-bold text-lg">✅ Membresía Activa</p>
                            <p className="text-blue-700 text-sm">Plan {profile.tipo_plan || 'mensual'}</p>
                            {profile.fecha_vencimiento_plan && (
                              <p className="text-blue-600 text-xs mt-1">
                                Vigencia hasta: {new Date(profile.fecha_vencimiento_plan).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-blue-600 text-xs">Suscripción</p>
                            <p className="text-blue-600 text-xs">Renovable</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-100/80 to-slate-100/80 border border-gray-300/60 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-800 font-bold text-lg">⏳ Sin Membresía</p>
                            <p className="text-gray-700 text-sm">Acceso limitado</p>
                          </div>
                          <div className="text-right">
                            <Button
                              onClick={handleGoToPayment}
                              size="sm"
                              className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-xl px-4 py-2 text-xs font-semibold"
                            >
                              Pagar/Código
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.id_vita && (
                    <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#382a3c]" />
                        <span className="text-[#382a3c] font-medium">ID Vita365</span>
                      </div>
                      <span className="text-sm text-[#382a3c]/70 font-mono">{profile.id_vita}</span>
                    </div>
                  )}

                  {profile.coverage_id && (
                    <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-[#382a3c]" />
                        <span className="text-[#382a3c] font-medium">ID Cobertura</span>
                      </div>
                      <span className="text-sm text-[#382a3c]/70 font-mono">{profile.coverage_id}</span>
                    </div>
                  )}

                  {profile.codigo_donativo && (
                    (() => {
                      const estado = getEstadoCodigoDonativo(profile.codigo_donativo);
                      const colorClass = estado.color === 'green' 
                        ? 'bg-green-100/60 border-green-300/60 text-green-800' 
                        : estado.color === 'yellow'
                        ? 'bg-yellow-100/60 border-yellow-300/60 text-yellow-800'
                        : 'bg-red-100/60 border-red-300/60 text-red-800';
                      
                      const iconColor = estado.color === 'green' 
                        ? 'text-green-600' 
                        : estado.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-red-600';

                      return (
                        <div className={`flex items-center justify-between p-4 rounded-2xl backdrop-blur-sm border ${colorClass}`}>
                          <div className="flex items-center space-x-3">
                            <Key className={`w-5 h-5 ${iconColor}`} />
                            <span className="font-medium">Código Donativo</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-mono ${iconColor} font-bold`}>
                              {profile.codigo_donativo}
                            </span>
                            <p className={`text-xs ${iconColor}`}>
                              {estado.mensaje}
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {profile.plan_pago && (
                    <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-[#382a3c]" />
                        <span className="text-[#382a3c] font-medium">Plan de Pago</span>
                      </div>
                      <span className="text-sm text-[#382a3c]/70">
                        {profile.plan_pago === 'mensual' && 'Mensual ($149/mes)'}
                        {profile.plan_pago === 'trimestral' && '3 Meses ($402)'}
                        {profile.plan_pago === 'semestral' && '6 Meses ($804)'}
                        {profile.plan_pago === 'anual' && '12 Meses ($1,296)'}
                      </span>
                    </div>
                  )}

                  <div className="mt-6 p-6 bg-green-100/60 border border-green-300/60 rounded-2xl backdrop-blur-sm">
                    <p className="text-green-800 text-sm flex items-center font-medium mb-3">
                      <Shield className="w-4 h-4 mr-2" />
                      Cobertura Vita365 activada ✓
                    </p>
                    
                    <p className="text-green-700 text-xs font-bold mb-4 bg-green-50 p-3 rounded-xl border border-green-200">
                      ⚠️ IMPORTANTE: Es INDISPENSABLE tener a la mano su ID VITA365 para el uso de sus asistencias.
                    </p>

                    {/* Botón de certificado movido aquí */}
                    {profile.coverage_id && profile.profile_completed && (tieneAccesoGratuito() || profile.has_paid) && (
                      <div className="flex justify-center">
                        <Button 
                          onClick={handleGenerateCertificate}
                          disabled={generatingCert}
                          className="text-white text-sm px-6 py-3 rounded-full font-semibold shadow-xl border-2 border-white/50 bg-gradient-to-r from-[#8d7583] to-[#382a3c] hover:from-[#382a3c] hover:to-[#8d7583]"
                          style={{ 
                            fontFamily: 'Questrial, sans-serif',
                            boxShadow: '0 8px 25px rgba(141, 117, 131, 0.4)'
                          }}
                        >
                          {generatingCert ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Descargar Certificado
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {FLAGS.VITA_ADMIN_UI && profile?.rol === 'super_admin' && (
                      <div className="mt-2">
                        <a 
                          href="/vita365/dashboard-titular" 
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Ver resumen admin →
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-1">
                  {/* Imagen de Vita365 con efecto 3D - pegada al encabezado */}
                  <div className="mt-0 mb-1">
                    <img 
                      src="/images/vita365.png" 
                      alt="Vita365" 
                      className="w-64 h-64 mx-auto object-contain transform hover:scale-105 transition-all duration-300"
                      style={{ 
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2)) drop-shadow(0 4px 8px rgba(56,42,60,0.3))',
                        transform: 'perspective(1000px) rotateX(5deg)',
                        transformStyle: 'preserve-3d'
                      }}
                    />
                  </div>
                  <p className="text-[#382a3c] mb-6 font-medium">
                     Completa tus datos para activar tu cobertura Vita365
                  </p>
                  <Button 
                    onClick={() => setShowVitaForm(true)}
                    className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-2xl font-bold shadow-xl border-2 border-white/50 px-8 py-4"
                    style={{ 
                      fontFamily: 'Questrial, sans-serif',
                      boxShadow: '0 8px 25px rgba(193, 212, 58, 0.4)'
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                     Completar Datos Vita365
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suscripción y Pagos - con más color */}
        <div className="bg-gradient-to-br from-white/40 via-[#c8a6a6]/10 to-white/35 backdrop-blur-xl rounded-[2rem] p-8 mb-6 shadow-2xl border border-white/50" style={{ fontFamily: 'Questrial, sans-serif' }}>
          <h2 className="text-2xl font-bold text-[#382a3c] mb-8 text-center">Suscripción y Pagos</h2>
          <div className="space-y-6">
            <div 
              onClick={handleGoToPayment} 
              className="flex items-center justify-between p-6 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm rounded-2xl cursor-pointer hover:from-white/80 hover:to-white/60 border-2 border-white/60 shadow-xl hover:shadow-2xl"
            >
              <div className="flex items-center space-x-4">
                {tieneAccesoGratuito() ? (
                  <div className="p-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-[#c1d43a] to-[#a8c139] rounded-full shadow-lg">
                    <CreditCard className="w-6 h-6 text-[#382a3c]" />
                  </div>
                )}
                <span className="text-[#382a3c] font-semibold text-lg">
                  {tieneAccesoGratuito() ? 'Acceso gratuito activo' : 'Gestionar plan y pagos'}
                </span>
                {!tieneAccesoGratuito() && !profile.has_paid && (
                  <p className="text-sm text-[#382a3c]/70 mt-1">
                    Pagar o ingresar código de donativo
                  </p>
                )}
              </div>
              <div className="text-2xl text-[#382a3c]/70">→</div>
            </div>
            <div className={`flex items-center justify-between p-6 rounded-2xl backdrop-blur-sm border shadow-lg ${
              tieneAccesoGratuito() || profile.has_paid 
                ? 'bg-green-100/70 border-green-300/70' 
                : 'bg-white/50 border-white/60'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  tieneAccesoGratuito() || profile.has_paid 
                    ? 'bg-green-200' 
                    : 'bg-orange-100'
                }`}>
                  <Bell className={`w-6 h-6 ${
                    tieneAccesoGratuito() || profile.has_paid 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`} />
                </div>
                <span className={`font-semibold text-lg ${
                  tieneAccesoGratuito() || profile.has_paid 
                    ? 'text-green-800' 
                    : 'text-[#382a3c]'
                }`}>Estado del plan</span>
              </div>
              <span className={`text-sm font-bold px-4 py-2 rounded-full ${
                tieneAccesoGratuito() || profile.has_paid 
                  ? 'text-green-600 bg-green-200' 
                  : 'text-orange-600 bg-orange-100'
              }`}>
                {tieneAccesoGratuito() ? 'Acceso Gratuito ' : 
                 profile.has_paid ? 'Activo ✓' : 'Pendiente '}
              </span>
            </div>
          </div>
        </div>

        {/* Sección de Contactos de Emergencia - más colorida */}
        <div className="bg-gradient-to-br from-white/40 via-[#8d7583]/10 to-white/35 backdrop-blur-xl rounded-[2rem] p-8 mb-6 shadow-2xl border border-white/50" style={{ fontFamily: 'Questrial, sans-serif' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-[#8d7583] to-[#382a3c] rounded-full shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#382a3c]">Contactos de Emergencia</h2>
            </div>
            {contacts.length > 0 && (
              <Button 
                onClick={() => setShowContactsSection(!showContactsSection)}
                className="bg-gradient-to-r from-white/70 to-white/50 hover:from-white/90 hover:to-white/70 text-[#382a3c] rounded-2xl px-4 py-2 font-medium shadow-lg border-2 border-white/50 backdrop-blur-sm transition-all duration-300"
                style={{ fontFamily: 'Questrial, sans-serif' }}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-sm">{showContactsSection ? 'Ocultar' : 'Ver'} contactos</span>
                  {showContactsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </Button>
            )}
          </div>
          
          <div className="text-sm text-[#382a3c]/90 mb-6 text-center bg-gradient-to-r from-white/60 to-white/40 rounded-2xl p-5 backdrop-blur-sm border-2 border-white/60 shadow-lg font-medium">
             Configura tus contactos de confianza para emergencias. Estos contactos recibirán alertas cuando uses el botón de auxilio.
          </div>

          {/* Botón Agregar - ahora debajo del texto explicativo */}
          {!showAddContactForm && (
            <div className="text-center mb-6">
              <Button 
                onClick={() => setShowAddContactForm(true)}
                className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-xl px-6 py-3 font-semibold shadow-lg border-2 border-white/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>
          )}

          {/* Formulario para agregar contacto - aparece aquí mismo */}
          {showAddContactForm && (
            <div className="mb-6">
              <AddContactFormInline 
                onAdd={(contactData) => {
                  handleAddContact(contactData);
                  setShowAddContactForm(false);
                }}
                onCancel={() => setShowAddContactForm(false)}
              />
            </div>
          )}

          {/* Lista de contactos existentes */}
          {showContactsSection && contacts.length > 0 && (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="p-4 bg-white/50 rounded-2xl border border-white/50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      contact.prioridad === 1 ? 'bg-gradient-to-r from-[#382a3c] to-[#8d7583]' :
                      contact.prioridad === 2 ? 'bg-gradient-to-r from-[#8d7583] to-[#c8a6a6]' :
                      'bg-gradient-to-r from-[#c1d43a] to-[#c8a6a6]'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {contact.prioridad || 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#382a3c]">{contact.nombre}</h4>
                      <p className="text-sm text-[#382a3c]/70">{contact.relacion}</p>
                      <p className="text-sm text-[#382a3c]/60 font-mono">{contact.telefono}</p>
                      <p className="text-xs text-[#382a3c]/50">
                        {contact.prioridad === 1 ? ' Prioridad URGENTE' :
                         contact.prioridad === 2 ? ' Prioridad IMPORTANTE' :
                         ' Prioridad APOYO'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteContact(contact.id)}
                    size="icon"
                    className="bg-gradient-to-r from-[#c8a6a6] to-[#8d7583] hover:from-[#8d7583] hover:to-[#c8a6a6] text-white rounded-full shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Mensaje cuando no hay contactos */}
          {!showAddContactForm && contacts.length === 0 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#8d7583]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#8d7583]" />
              </div>
              <p className="text-[#382a3c]/70">Usa el botón "Agregar Contacto" de arriba para configurar tus contactos de emergencia</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal para agregar contacto */}
      <AddContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onAdd={handleAddContact}
      />

      {/* Modal de pago integrado */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        profile={profile}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default ProfilePage;