// ✅ FooterBottomNavigation.jsx - versión funcional y conectada al hook

import React from 'react';
import { AlertTriangle, Share2, PhoneCall, User, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmergencyActions } from '@/hooks/useEmergencyActions';

const FooterBottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // ✅ Usar los nombres originales de las funciones del hook (sin renombrar)
  const {
    sendAudioEmergency,
    toggleCompanionship,
    reproducirLlamadaSegura,
    isFollowing,
  } = useEmergencyActions();

  // 🔥 DEBUG: Verificar que el hook está funcionando
  console.log(`🚀 [DEBUG] FooterBottomNavigation renderizado`);
  console.log(`🚀 [DEBUG] Hook functions:`, { 
    sendAudioEmergency: typeof sendAudioEmergency, 
    toggleCompanionship: typeof toggleCompanionship, 
    reproducirLlamadaSegura: typeof reproducirLlamadaSegura, 
    isFollowing 
  });

  const botones = [
    {
      icono: <AlertTriangle size={24} color="white" />,
      color: '#490000', // Color específico que me diste
      titulo: 'Grabar',
      onClick: sendAudioEmergency, // ✅ Usar directamente sendAudioEmergency
    },
    {
      icono: <Share2 size={24} color="white" />,
      color: isFollowing ? '#c1d43a' : '#263152', // Color específico #263152 que me diste
      titulo: isFollowing ? 'Detener' : 'Acompáñame',
      onClick: toggleCompanionship, // ✅ Usar directamente toggleCompanionship
    },
    {
      icono: <PhoneCall size={24} color="white" />,
      color: '#8d7583', // Color específico #8d7583 que me diste
      titulo: 'Llamada',
      onClick: reproducirLlamadaSegura,
    },
    {
      icono: <Shield size={24} color="white" />,
      color: '#c1d43a', // Color específico #c1d43a que me diste
      titulo: 'Vita365',
      onClick: () => window.open('tel:5593373553', '_self'),
    },
    {
      icono: <User size={24} color="white" />,
      color: '#c8a6a6', // Color específico #c8a6a6 que me diste
      titulo: 'Perfil',
      onClick: () => navigate('/perfil'),
    },
  ];

  // ⚠️ TEMPORALMENTE COMENTADO PARA DEBUG EN WEB
  // if (location.pathname === '/landing') return null;

  return (
    <footer
      className="w-full z-50 flex-shrink-0"
      style={{
        position: 'fixed', // 🔧 TEMPORAL: Fijo para debug
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #382a3c 0%, #4A3E57 50%, #382a3c 100%)',
        borderTop: '3px solid #ff6b6b', // 🔧 TEMPORAL: Borde rojo para visibilidad
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        height: '80px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-full w-full">
        {botones.map((boton, index) => (
          <button
            key={index}
            onClick={() => {
              console.log(`🔥 [DEBUG] Botón ${boton.titulo} clickeado`);
              console.log(`🔥 [DEBUG] Función:`, boton.onClick);
              console.log(`🔥 [DEBUG] Hook disponible:`, { sendAudioEmergency, toggleCompanionship, reproducirLlamadaSegura, isFollowing });
              try {
                boton.onClick();
                console.log(`✅ [DEBUG] Botón ${boton.titulo} ejecutado sin errores`);
              } catch (error) {
                console.error(`❌ [DEBUG] Error en botón ${boton.titulo}:`, error);
              }
            }}
            className="flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 group flex-1 h-full"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all duration-200 group-hover:scale-110"
              style={{
                backgroundColor: boton.color,
                boxShadow: `0 4px 12px ${boton.color}40`,
              }}
            >
              {boton.icono}
            </div>
            <span
              className="text-xs font-medium text-white/90 group-hover:text-white transition-colors duration-200 text-center leading-tight"
              style={{ fontSize: '11px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {boton.titulo}
            </span>
          </button>
        ))}
      </div>
    </footer>
  );
};

export default FooterBottomNavigation;
