import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { loadJitsiApiOnce } from '../utils/jitsi';

// ✅ VERSIÓN ACTUALIZADA - Cache busting para Netlify
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN as string;
const RETURN_PATH  = import.meta.env.VITE_JITSI_RETURN_PATH || '/perfil';

// Si ya tienes un cliente Supabase central, usa ese import.
// Este funciona out-of-the-box con tus envs VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export default function ConferenciaSala() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Parámetros de URL: ?room=...&name=...&pin=...
  const room = (params.get('room') || 'ZinhaSalaGeneral').trim();
  const displayName = (params.get('name') || 'Invitada Zinha').trim();
  const moderatorPin = (params.get('pin') || '').trim();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  const [isModerator, setIsModerator] = useState(false);
  const [phase, setPhase] = useState<'idle'|'validating'|'ready'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [conferenceJoined, setConferenceJoined] = useState(false);

  // 1) Solicitar permisos solo AL FINAL, justo antes de montar Jitsi
  // NO liberar el stream hasta que Jitsi esté listo
  const requestPermissions = async () => {
    try {
      console.log('Zinha: Solicitando permisos de cámara/micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      console.log('Zinha: Permisos concedidos');
      // NO cerrar el stream aquí - Jitsi lo tomará
      return stream;
    } catch (error) {
      console.error('Zinha: Error en permisos:', error);
      throw new Error('Necesitas permitir micrófono y cámara para entrar.');
    }
  };

  // 2) Validar PIN usando nuestro endpoint JWT
  useEffect(() => {
    if (phase !== 'idle') return; // ✅ SOLO ejecutar una vez cuando está en idle

    (async () => {
      try {
        setPhase('validating');
        console.log('Zinha: Validando PIN...', { pin: moderatorPin, room, displayName });
        
        if (moderatorPin && moderatorPin.trim() !== '') {
          // Validar PIN como moderador
          console.log('🔑 Validando PIN:', moderatorPin, 'para sala:', room);
          
          const { data, error } = await supabase.rpc('consume_moderator_pin', {
            p_pin: moderatorPin.trim(),
            p_room: room
          });

          if (error) {
            console.error('❌ Error en RPC:', error);
            throw new Error(`Error de validación: ${error.message}`);
          }

          console.log('📊 Resultado RPC:', data);

          if (data && data.length > 0 && data[0].success) {
            setIsModerator(true);
            console.log('✅ PIN válido - Usuario es MODERADOR');
          } else {
            const message = data && data.length > 0 ? data[0].message : 'PIN inválido';
            console.log('❌ PIN rechazado:', message);
            throw new Error(`PIN incorrecto: ${message}`);
          }
        } else {
          // Sin PIN = invitado
          setIsModerator(false);
          console.log('👤 Sin PIN - Usuario es INVITADO');
        }

        // ✅ Pedir permisos después de validación exitosa
        console.log('Zinha: Solicitando permisos...');
        try {
          await requestPermissions();
          console.log('Zinha: Permisos obtenidos');
        } catch (permError: any) {
          console.warn('Zinha: Error en permisos, continuando:', permError);
          // No fallar por permisos - Jitsi los puede pedir después
        }

        setPhase('ready');

      } catch (e: any) {
        console.error('Error al validar PIN:', e);
        setPhase('error');
        setErrorMsg(`Error: ${e.message}`);
      }
    })();
  }, []); // ✅ SIN DEPENDENCIAS - Solo ejecutar UNA vez

  // 3) Montar Jitsi cuando esté listo
  useEffect(() => {
    let disposed = false;
    if (phase !== 'ready') return;
    if (!containerRef.current) return;

    (async () => {
      try {
        // ✅ Los permisos ya se pidieron en la validación del PIN
        // Ya no necesitamos pedirlos otra vez aquí
        
        await loadJitsiApiOnce(JITSI_DOMAIN);
        if (disposed) return;

        const jitsiConfig = {
          roomName: room,
          parentNode: containerRef.current,
          userInfo: { 
            displayName,
            role: isModerator ? 'moderator' : 'participant'
          },
          lang: 'es',
          configOverwrite: {
            prejoinConfig: { enabled: false },
            enableWelcomePage: false,
            disableDeepLinking: true,
            hideConferenceSubject: true,
            hideConferenceTimer: true,
            // Configuración crítica de permisos
            enableUserRolesBasedOnToken: true, // ← HABILITAR para JWT
            moderatedRoomServiceUrl: undefined,
            // Controlar quien puede hacer qué
            disableModeratorIndicator: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            // SEGURIDAD: Deshabilitar shortcuts para que no puedan usar hangup nativo
            disableShortcuts: true
          },
          interfaceConfigOverwrite: {
            // SIN hangup nativo - usamos nuestro botón propio
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'chat',
              'participants-pane',
              'tileview'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            DEFAULT_LOGO_URL: '',
            DEFAULT_WELCOME_PAGE_LOGO_URL: '',
            HIDE_DEEP_LINKING_LOGO: true,
            MOBILE_APP_PROMO: false,
            SHOW_POWERED_BY: false,
            DISPLAY_ROOM_NAME: false,
            SHOW_ROOM_TIMER: false
          },
          disableDeepLinking: true
        };

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, jitsiConfig);
        apiRef.current = api;

        // Asegura nombre visible al unir
        api.addEventListener('videoConferenceJoined', () => {
          if (displayName) {
            api.executeCommand('displayName', displayName);
          }
          
          // CRÍTICO: Configurar rol explícitamente dentro de la conferencia
          console.log(`Zinha: Usuario unido como ${isModerator ? 'MODERADOR' : 'INVITADO'}`);
          
          // Si no es moderador, explícitamente quitar permisos de moderador
          if (!isModerator) {
            // Los invitados NO pueden terminar conferencia para todos
            console.log('Zinha: Invitado sin permisos de terminar para todos');
          }
        });

        // Al cerrar, regresa a /perfil
        api.addEventListener('readyToClose', () => {
          navigate(RETURN_PATH, { replace: true });
        });

        // (No podemos modificar DOM del iframe cross-origin)
        // Si quieres tapar el watermark con overlay Zinha, ya está en el JSX de abajo.

      } catch (e: any) {
        setPhase('error');
        setErrorMsg(e?.message || 'No se pudo iniciar la videollamada.');
      }
    })();

    return () => {
      disposed = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  }, [phase, room, displayName, navigate, isModerator]);

  // 4) Botón propio según rol
  const handleExit = () => {
    const api = apiRef.current;
    if (!api) return;
    
    console.log('Zinha: Saliendo...', { isModerator, pin: moderatorPin });
    
    // LÓGICA ESTRICTA: Solo si tenemos PIN válido somos moderador
    const reallyIsModerator = isModerator && moderatorPin.length > 0;
    
    if (reallyIsModerator) {
      console.log('Zinha: MODERADOR terminando conferencia para TODOS');
      api.executeCommand('endConference'); // termina para todas
    } else {
      console.log('Zinha: INVITADO saliendo solo');
      api.executeCommand('hangup');        // solo sale ella
    }
  };

  if (phase === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="max-w-sm rounded-2xl bg-[#1e1e1e] p-5 text-center shadow">
          <p className="text-base leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => navigate(RETURN_PATH, { replace: true })}
            className="mt-4 rounded-xl bg-[#252525] px-4 py-2 text-sm text-white transition hover:bg-[#333]"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Loading simple
  if (phase === 'idle' || phase === 'validating') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        {/* Logo Zinha en pantalla de carga */}
        <div className="absolute top-8 left-8 z-10">
          <img
            src="/images/Logo para sala video.png"
            alt="Zinha"
            style={{ 
              width: 120, 
              height: 'auto', 
              opacity: 0.95 
            }}
          />
        </div>
        <div className="rounded-2xl bg-[#1e1e1e] px-4 py-3 text-sm">Entrando a la sala…</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {/* Contenedor donde se monta Jitsi */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Botón propio de salida - FONDO NEGRO para distinguir */}
      <button
        onClick={handleExit}
        className="absolute bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-xl bg-black/90 px-4 py-3 text-sm font-medium text-white shadow-xl border border-white/20 transition hover:bg-black hover:scale-105 active:scale-95"
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16,17 21,12 16,7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        {isModerator ? 'Terminar reunión' : 'Salir'}
      </button>
    </div>
  );
}
