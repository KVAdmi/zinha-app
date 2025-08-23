// src/hooks/useEmergencyActions.js - CÓDIGO ORIGINAL FUNCIONAL RESTAURADO

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/customSupabaseClient';
import preciseLocationService from '@/lib/preciseLocationService';

const useEmergencyActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Función para cargar APIs dinámicamente
  const loadCapacitorAPIs = async () => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const { AppLauncher } = await import('@capacitor/app-launcher');
      return { Geolocation, AppLauncher };
    } catch (error) {
      console.log('📱 APIs nativas no disponibles, usando web APIs');
      return { Geolocation: null, AppLauncher: null };
    }
  };

  // Cargar contactos al montar
  useEffect(() => {
    if (user) {
      loadEmergencyContacts();
    }
  }, [user]);

  const loadEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contactos_emergencia') // ✅ CORREGIDO: Usar nombre en español
        .select('*')
        .eq('user_id', user.id)
        .order('prioridad', { ascending: true }); // ✅ CORREGIDO: Usar prioridad en lugar de created_at

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error cargando contactos:', error);
    }
  };

  // 🚨 AUXILIO CON AUDIO - CÓDIGO ORIGINAL QUE FUNCIONABA
  const sendAudioEmergency = async () => {
    console.log('🚨 [DEBUG] sendAudioEmergency llamado');
    console.log('🚨 [DEBUG] Contactos disponibles:', contacts.length);
    console.log('🚨 [DEBUG] Usuario actual:', user?.id);
    
    if (!user) {
      toast({ title: '❌ Error de sesión', description: 'No hay usuario logueado. Inicia sesión primero.' });
      console.log('🚨 [DEBUG] No hay usuario logueado');
      return;
    }
    
    if (contacts.length === 0) {
      toast({ title: '⚠️ Sin contactos', description: 'Configura contactos de emergencia primero.' });
      console.log('🚨 [DEBUG] No hay contactos configurados');
      return;
    }

    try {
      console.log('🚨 [DEBUG] Iniciando proceso de auxilio...');
      toast({ title: '🎤 Solicitando permisos de micrófono...', description: '' });

      // 1. Solicitar permisos de micrófono
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error('Error micrófono:', err);
        toast({ title: '❌ Error de micrófono', description: 'No se pudo acceder al micrófono. Permite el acceso.' });
        return;
      }

      // 2. Obtener ubicación con Google Maps (máxima precisión)
      toast({ title: '🎯 Obteniendo ubicación con Google Maps...', description: 'Precisión máxima para emergencia' });

      const position = await preciseLocationService.getCurrentPosition({
        requireHighAccuracy: true,
        timeout: 10000,
        retries: 2
      });
      
      console.log(`🎯 [AUXILIO] Ubicación obtenida - Precisión: ${position.accuracy}m (Fuente: ${position.source})`);

      // 3. Mensaje: "Estamos grabando tu entorno durante 15 segundos"
      toast({ 
        title: '🎙️ Estamos grabando tu entorno durante 15 segundos', 
        description: 'Mantén el micrófono cerca del audio que quieres capturar' 
      });

      // 4. Grabar audio exactamente 15 segundos
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];
      
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      const stopRec = () => new Promise((resolve) => { 
        rec.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          resolve();
        };
        rec.stop(); 
      });
      
      rec.start();
      
      // Contador de 15 segundos
      for (let i = 15; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ 
          title: `🎙️ GRABANDO... ${i-1} segundos restantes`, 
          description: 'Capturando audio del entorno...' 
        });
      }
      
      if (rec.state === 'recording') {
        rec.stop();
      }
      
      await stopRec();

      toast({ title: '☁️ Subiendo audio...', description: 'Procesando grabación de emergencia' });

      // 5. Subir audio al bucket audios-panico
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size === 0) {
        toast({ title: '❌ Error', description: 'No se pudo grabar audio. Intenta de nuevo.' });
        return;
      }

      const fileName = `panico_${Date.now()}.webm`;
      
      const { error: upErr } = await supabase.storage
        .from('audios-panico')
        .upload(fileName, blob, { 
          contentType: 'audio/webm',
          cacheControl: '3600'
        });
      
      if (upErr) {
        console.error('Error subida:', upErr);
        toast({ title: '❌ Error al subir audio', description: upErr.message });
        return;
      }

      const { data: urlData } = supabase.storage.from('audios-panico').getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      // 6. Crear mensaje EXACTO para WhatsApp
      const mensajeWA = `Esta persona está en peligro.

Audio de emergencia: ${audioUrl}

Ubicación actual: https://maps.google.com/?q=${position.latitude},${position.longitude}
Precisión: ${Math.round(position.accuracy)}m (${position.source})

⚠️ Mensaje enviado desde Zinha App - Sistema de Emergencia`;

      // 7. Enviar por WhatsApp a contactos de emergencia (prioridad 1, 2, 3)
      const { AppLauncher } = await loadCapacitorAPIs();
      
      if (AppLauncher) {
        // Enviar a todos los contactos, priorizando por orden
        contacts.forEach((contact) => {
          const telefono = contact.telefono.replace(/\D/g, '');
          const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensajeWA)}`;
          AppLauncher.openUrl({ url });
        });
      } else {
        // Fallback para web
        contacts.forEach((contact) => {
          const telefono = contact.telefono.replace(/\D/g, '');
          const url = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensajeWA)}`;
          window.open(url, '_blank');
        });
      }

      // 8. Guardar evento en base de datos
      try {
        await supabase.from('eventos_peligro').insert({
          user_id: user.id,
          latitud: position.latitude,
          longitud: position.longitude,
          mensaje: mensajeWA,
          enviado: true,
          creado_en: new Date().toISOString()
        });
      } catch (insertErr) {
        console.error('Error al guardar evento:', insertErr);
      }

      toast({ 
        title: '✅ ¡Alerta de auxilio enviada!', 
        description: `Audio y ubicación enviados a tus contactos de emergencia con precisión de ${Math.round(position.accuracy)}m` 
      });

    } catch (error) {
      console.error('❌ [ERROR CRÍTICO] Error en auxilio con audio:', error);
      toast({ title: '❌ Error crítico en auxilio', description: error.message });
    }
  };

  // 👥 ACOMPAÑAMIENTO EN TIEMPO REAL CON MÁXIMA PRECISIÓN
  const toggleCompanionship = async () => {
    console.log('🚨 [DEBUG] toggleCompanionship EJECUTÁNDOSE');
    console.log('🚨 [DEBUG] Estado actual:', { isFollowing, contacts: contacts.length, user: user?.id });
    
    if (contacts.length === 0) {
      console.log('❌ [DEBUG] No hay contactos configurados');
      toast({ title: '⚠️ Sin contactos', description: 'Configura contactos de emergencia primero.' });
      return;
    }

    if (isFollowing) {
      // Detener seguimiento
      preciseLocationService.stopWatch();
      setIsFollowing(false);
      
      // Detener en base de datos si existe token
      if (window.__currentTrackingToken) {
        const { data, error } = await supabase.rpc('detener_seguimiento_tiempo_real', {
          p_token: window.__currentTrackingToken
        });
        
        if (!error) {
          toast({ 
            title: '🔒 Acompañamiento detenido', 
            description: 'Ya no se comparte tu ubicación. Tu privacidad está protegida.' 
          });
        }
        window.__currentTrackingToken = null;
      } else {
        toast({ title: '🔒 Seguimiento detenido' });
      }
      return;
    }

    // Mostrar mensaje inicial como me pidió
    toast({ 
      title: '🚶‍♀️ Tu acompañamiento inicia ahora', 
      description: 'Para detenerlo vuelve a tocar el botón. Obteniendo ubicación...' 
    });

    // Iniciar seguimiento con máxima precisión
    try {
      console.log('🔥 [DEBUG] toggleCompanionship - INICIANDO');
      console.log('🔥 [DEBUG] Contacts disponibles:', contacts.length);
      console.log('🔥 [DEBUG] User ID:', user?.id);
      
      // 📱 SOLICITAR PERMISOS DE UBICACIÓN PRIMERO (ANTES DE OBTENER POSICIÓN)
      console.log('📱 [EMERGENCIA] Solicitando permisos de ubicación ANTES de obtener posición...');
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const permissions = await Geolocation.requestPermissions();
        console.log('📱 [EMERGENCIA] Permisos obtenidos:', permissions);
        
        if (permissions.location !== 'granted') {
          console.log('⚠️ [EMERGENCIA] Permisos denegados, continuando con web fallback');
        } else {
          console.log('✅ [EMERGENCIA] Permisos de ubicación CONCEDIDOS');
        }
      } catch (capacitorError) {
        console.log('🌐 [EMERGENCIA] Capacitor no disponible, usando web APIs:', capacitorError.message);
      }
      
      console.log('🚨 [SEGURIDAD CRÍTICA] Iniciando acompañamiento con Google Maps');
      
      // Obtener ubicación inicial con Google Maps (máxima precisión y velocidad)
      console.log('🔥 [DEBUG] Llamando a preciseLocationService.getCurrentPosition...');
      const position = await preciseLocationService.getCurrentPosition({
        requireHighAccuracy: true,
        timeout: 10000,
        retries: 2
      });

      console.log(`🎯 Ubicación inicial obtenida - Precisión: ${position.accuracy}m (Fuente: ${position.source})`);
      
      // Iniciar seguimiento en base de datos
      const { data, error } = await supabase.rpc('iniciar_seguimiento_tiempo_real_v2', {
        p_user_id: user.id,
        p_destino: 'Seguimiento de emergencia',
        p_contacto_emergencia: contacts[0]?.telefono || 'No configurado'
      });

      if (error) throw error;

      const trackingUrl = data.url_seguimiento;
      window.__currentTrackingToken = data.token;

      console.log(`✅ Token de seguimiento: ${data.token}`);
      console.log(`🔗 URL de seguimiento: ${trackingUrl}`);

      // 📱 SOLICITAR PERMISOS DE UBICACIÓN (CON FALLBACK PARA WEB)
      try {
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          console.log('📱 [EMERGENCIA] Solicitando permisos de ubicación...');
          
          const permissions = await Geolocation.requestPermissions();
          console.log('📱 [EMERGENCIA] Permisos obtenidos:', permissions);
          
          if (permissions.location !== 'granted') {
            console.log('⚠️ [EMERGENCIA] Permisos denegados, continuando con web fallback');
          } else {
            console.log('✅ [EMERGENCIA] Permisos de ubicación CONCEDIDOS');
          }
        } catch (capacitorError) {
          console.log('🌐 [EMERGENCIA] Capacitor no disponible, usando web APIs:', capacitorError.message);
        }
      } catch (error) {
        console.log('⚠️ [EMERGENCIA] Error general de permisos, continuando:', error.message);
      }

      // Configurar seguimiento continuo de alta precisión
      preciseLocationService.startHighAccuracyWatch(
        async (position) => {
          console.log(`📍 [SEGUIMIENTO] Nueva posición: ${position.latitude}, ${position.longitude} (±${position.accuracy}m) [${position.source}]`);

          try {
            // 1. Actualizar con RPC (sistema original)
            const { data: updateData, error: rpcError } = await supabase.rpc('actualizar_ubicacion_seguimiento_v2_debug', {
              p_token: data.token,
              p_latitud: position.latitude,
              p_longitud: position.longitude,
              p_precision: Math.round(position.accuracy)
            });
            
            if (rpcError) {
              console.error('❌ Error actualizando ubicación con RPC:', rpcError);
            } else {
              console.log('✅ Ubicación actualizada en RPC');
            }

            // 2. TAMBIÉN actualizar tabla acompanamientos_activos directamente con TODAS las columnas
            const ahora = new Date().toISOString();
            const { error: tableError } = await supabase.from('acompanamientos_activos')
              .update({
                latitud_actual: position.latitude,
                longitud_actual: position.longitude,
                ubicacion_actual: {
                  type: "Point", 
                  coordinates: [position.longitude, position.latitude]
                },
                activo: true, // Asegurar que sigue activo
                updated_at: ahora,
                ultima_actualizacion_ubicacion: ahora, // ✅ NUEVA COLUMNA
                precision_metros: Math.round(position.accuracy),
                // ✅ CONSTRUIR ruta_seguimiento como array de coordenadas
                ruta_seguimiento: [{
                  coordinates: [position.longitude, position.latitude],
                  timestamp: ahora,
                  precision: Math.round(position.accuracy)
                }]
              })
              .eq('token', data.token); // ✅ Actualizar solo POR TOKEN

            if (tableError) {
              console.error('❌ Error actualizando acompanamientos_activos:', tableError);
            } else {
              console.log('✅ Ubicación actualizada en acompanamientos_activos');
            }

          } catch (criticalError) {
            console.error('💥 Error crítico en actualización:', criticalError);
          }
        },
        {
              minAccuracy: 2000, // ✅ RESTAURADO: Como estaba funcionando (acepta 1068m)
          interval: 3000,  // Actualizar cada 3 segundos para seguridad crítica
          enableHighAccuracy: true
        }
      );

      // Notificar a contactos con mensaje claro
      const mensaje = encodeURIComponent(`🚶‍♀️ ACOMPÁÑAME - Estoy en camino y necesito que me acompañes virtualmente. 

Puedes seguir mi ubicación en tiempo real aquí: 
${trackingUrl}

Este enlace te permitirá ver dónde estoy y mi recorrido completo desde que inició mi trayecto.

¡Gracias por cuidarme! 💜`);
      
      const { AppLauncher } = await loadCapacitorAPIs();
      
      if (AppLauncher) {
        contacts.forEach((contact) => {
          const telefono = contact.telefono.replace(/\D/g, '');
          const url = `https://wa.me/52${telefono}?text=${mensaje}`;
          AppLauncher.openUrl({ url });
        });
      } else {
        // Fallback para web
        contacts.forEach((contact) => {
          const telefono = contact.telefono.replace(/\D/g, '');
          const url = `https://wa.me/52${telefono}?text=${mensaje}`;
          window.open(url, '_blank');
        });
      }

      setIsFollowing(true);
      toast({ 
        title: '✅ Acompañamiento activo', 
        description: `Tu ubicación se comparte en tiempo real. Precisión actual: ${Math.round(position.accuracy)}m con ${position.source}` 
      });

    } catch (error) {
      console.error('❌ [ERROR CRÍTICO] Error en acompañamiento:', error);
      toast({ title: '❌ Error crítico en acompañamiento', description: error.message });
    }
  };

  // 📞 LLAMADA SEGURA - Reproduce audio del bucket audios-seguridad
  const reproducirLlamadaSegura = async () => {
    try {
      // Obtener la URL pública del audio desde el bucket audios-seguridad
      const { data } = supabase.storage.from('audios-seguridad').getPublicUrl('Amiga Molesta.mp3');
      const audioUrl = data?.publicUrl;
      
      if (!audioUrl) {
        toast({ title: '❌ Error', description: 'No se encontró el audio de seguridad' });
        return;
      }
      
      // Crear y reproducir audio
      const audio = new Audio(audioUrl);
      
      toast({ title: '📞 Llamada segura', description: 'Reproduciendo audio de seguridad...' });
      
      try {
        await audio.play();
      } catch (playError) {
        toast({ title: '❌ Error', description: 'Error al reproducir audio. Intenta de nuevo.' });
        return;
      }
      
      // Cuando termine el audio, opcional: realizar alguna acción
      audio.onended = () => {
        console.log('Audio de llamada segura terminado');
      };
      
    } catch (error) {
      console.error('Error en llamada segura:', error);
      toast({ title: '❌ Error', description: 'Error al cargar audio: ' + error.message });
    }
  };

  return {
    contacts,
    isFollowing,
    sendAudioEmergency,
    toggleCompanionship,
    reproducirLlamadaSegura,
    loadEmergencyContacts
  };
};

export default useEmergencyActions;
export { useEmergencyActions };
