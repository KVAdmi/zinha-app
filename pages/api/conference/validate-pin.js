// pages/api/conference/validate-pin.js
// Endpoint para validar PIN y generar JWT

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const JITSI_APP_ID = 'zinha';
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET; // Agregar al .env

export default async function handler(req, res) {
  console.log('🔥 API validate-pin llamada:', { method: req.method, body: req.body });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin, room, userName } = req.body;

  if (!room || !userName) {
    return res.status(400).json({ error: 'room y userName son requeridos' });
  }

  console.log('🔍 Validando:', { pin: pin || 'SIN_PIN', room, userName });

  try {
    // Si no hay PIN = invitado directo
    if (!pin || pin.trim() === '') {
      console.log('✅ Sin PIN - Usuario será INVITADO');
      return res.status(200).json({
        success: true,
        isModerator: false,
        jwt: null,
        message: 'Invitado sin PIN'
      });
    }

    // 1. Validar PIN en Supabase
    console.log('🔍 Validando PIN en Supabase:', { pin, room });
    
    const { data, error } = await supabase.rpc('consume_moderator_pin', {
      p_pin: pin,
      p_room: room
    });

    console.log('📊 Respuesta Supabase:', { data, error });

    if (error) {
      console.error('❌ Error Supabase:', error);
      throw error;
    }

    const isValidPin = data?.length > 0 && data[0]?.success;
    console.log('🎯 Resultado validación:', { isValidPin, data });

    // 2. Generar JWT según el resultado
    let jwt_token = null;
    let isModerator = false;

    if (isValidPin) {
      // PIN válido = MODERADOR
      isModerator = true;
      
      // Verificar que tenemos el secret para JWT
      if (!JITSI_APP_SECRET) {
        console.error('❌ JITSI_APP_SECRET no configurado');
        return res.status(500).json({ 
          error: 'Configuración de JWT faltante',
          success: false 
        });
      }
      
      jwt_token = generateJWT(userName, room, true);
      console.log('✅ JWT generado para MODERADOR');
      
      return res.status(200).json({
        success: true,
        isModerator: true,
        jwt: jwt_token,
        message: 'PIN válido - Moderador'
      });
    } else {
      // PIN inválido
      console.log('❌ PIN inválido o ya usado');
      const errorMessage = data?.[0]?.message || 'PIN inválido, ya usado o caducado';
      
      return res.status(400).json({
        success: false,
        isModerator: false,
        jwt: null,
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('💥 Error crítico en validación:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

function generateJWT(userName, roomName, isModerator) {
  const payload = {
    iss: JITSI_APP_ID,
    aud: JITSI_APP_ID,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
    sub: 'meet.appzinha.com',
    room: roomName,
    context: {
      user: {
        id: `user_${Date.now()}`,
        name: userName,
        avatar: '',
        email: '',
        moderator: isModerator ? 'true' : 'false'
      },
      features: {
        livestreaming: isModerator ? 'true' : 'false',
        recording: isModerator ? 'true' : 'false',
        transcription: isModerator ? 'true' : 'false',
        "outbound-call": isModerator ? 'true' : 'false'
      }
    }
  };

  return jwt.sign(payload, JITSI_APP_SECRET, { algorithm: 'HS256' });
}
