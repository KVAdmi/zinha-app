// 🚀 SERVICIO DE GEOLOCALIZACIÓN HÍBRIDO ULTRA-RÁPIDO
// GPS Nativo PRIMERO + Google API como BACKUP para máxima velocidad y precisión

class PreciseLocationService {
  constructor() {
    // Cargar API Key desde variables de entorno para seguridad
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCPPTBvh8bzf_r-rEIy_SzUgVX6xkI7q0g';
    this.currentWatchId = null;
    this.lastKnownPosition = null;
    this.accuracyThreshold = 50; // metros
    this.callbacks = new Set();
  }

  // 🚀 MÉTODO PRINCIPAL HÍBRIDO: GPS Nativo PRIMERO (más rápido) + Google BACKUP
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 8000, // Timeout más corto para emergencias
      maximumAge: 0,
      requireHighAccuracy: true,
      fastMode: true // Modo rápido para emergencias
    };

    const config = { ...defaultOptions, ...options };
    
    console.log('🚀 [EMERGENCIA] Obteniendo ubicación HÍBRIDA (GPS + Google)...');

    // ESTRATEGIA 1: GPS NATIVO PRIMERO (MÁS RÁPIDO Y PRECISO)
    try {
      console.log('📱 [GPS-NATIVO] Intentando GPS del dispositivo...');
      const nativePosition = await this.getNativeGeolocationFast(config);
      
      console.log(`✅ [GPS-NATIVO] ¡Éxito! Precisión: ${nativePosition.accuracy}m`);
      this.lastKnownPosition = nativePosition;
      return nativePosition;
      
    } catch (nativeError) {
      console.log(`⚠️ [GPS-NATIVO] Falló: ${nativeError.message}`);
      
      // ESTRATEGIA 2: GOOGLE API COMO BACKUP
      try {
        console.log('🌐 [GOOGLE-BACKUP] Usando Google API...');
        const googlePosition = await this.getGoogleGeolocation();
        
        console.log(`✅ [GOOGLE-BACKUP] ¡Éxito! Precisión: ${googlePosition.accuracy}m`);
        this.lastKnownPosition = googlePosition;
        return googlePosition;
        
      } catch (googleError) {
        console.error('❌ [AMBOS-FALLARON] GPS + Google fallaron');
        throw new Error(`No se pudo obtener ubicación: GPS (${nativeError.message}), Google (${googleError.message})`);
      }
    }
  }

  // 🌐 GOOGLE GEOLOCATION API - PRIORIDAD MÁXIMA
  async getGoogleGeolocation() {
    const response = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        considerIp: true,
        wifiAccessPoints: [],
        cellTowers: []
      })
    });

    if (!response.ok) {
      throw new Error(`Google Geolocation Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.location) {
      throw new Error('Google Geolocation: No location data received');
    }
    
    return {
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy || 30, // Google suele dar precisión muy alta
      timestamp: Date.now(),
      source: 'google-api'
    };
  }

  // 📱 GPS NATIVO ULTRA-RÁPIDO - PRIORIDAD MÁXIMA
  async getNativeGeolocationFast(options) {
    try {
      // 🚀 PRIORIDAD 1: CAPACITOR NATIVO (Apps nativas iOS/Android)
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        console.log('📱 [CAPACITOR] Usando Geolocation nativo...');
        
        // Solicitar permisos primero
        const permissions = await Geolocation.requestPermissions();
        console.log('📱 [CAPACITOR] Permisos:', permissions);
        
        if (permissions.location !== 'granted') {
          throw new Error('Permisos de ubicación denegados en Capacitor');
        }
        
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: options.timeout || 10000,
          maximumAge: 0
        });
        
        console.log('✅ [CAPACITOR] Ubicación obtenida:', position);
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'capacitor-nativo'
        };
        
      } catch (capacitorError) {
        console.log('⚠️ [CAPACITOR] No disponible, usando navegador:', capacitorError.message);
        
        // 🌐 FALLBACK: NAVEGADOR WEB
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('GPS no disponible en este dispositivo'));
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error(`GPS timeout después de ${options.timeout}ms`));
          }, options.timeout);

          navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          
          // Validar precisión para emergencias
          if (position.coords.accuracy > 200) {
            console.log(`⚠️ [GPS] Precisión baja: ${position.coords.accuracy}m`);
          }
          
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'gps-nativo-rapido'
          });
        },
        (error) => {
          clearTimeout(timeout);
          let errorMessage = 'Error GPS desconocido';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso GPS denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS no disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS timeout';
              break;
          }
          
          reject(new Error(errorMessage));
        },
            {
              enableHighAccuracy: true, // ¡MÁXIMA PRECISIÓN!
              timeout: options.timeout,
              maximumAge: 0 // Sin caché para emergencias
            }
          );
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // 🔄 SEGUIMIENTO CONTINUO HÍBRIDO PARA ACOMPAÑAMIENTO
  startHighAccuracyWatch(callback, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      interval: 3000, // Cada 3 segundos para emergencias
      minAccuracy: 2000, // ✅ AUMENTADO: Aceptar hasta 2000m para seguimiento (emergencias)
      timeout: 6000, // Timeout más corto para respuesta rápida
      useNativeFirst: true // Usar GPS nativo primero
    };

    const config = { ...defaultOptions, ...options };
    
    console.log('🔄 [SEGUIMIENTO-HÍBRIDO] Iniciando watch GPS + Google...');
    
    // Detener cualquier watch previo
    this.stopWatch();
    
    // Función híbrida para obtener ubicación periódicamente
    const updateLocation = async () => {
      try {
        const position = await this.getCurrentPosition({
          timeout: config.timeout,
          enableHighAccuracy: config.enableHighAccuracy
        });
        
        // Solo notificar si la precisión es aceptable
        console.log(`🔍 [DEBUG-SEGUIMIENTO] Posición obtenida: precisión=${position.accuracy}m, límite=${config.minAccuracy}m`);
        
        if (position.accuracy <= config.minAccuracy) {
          console.log(`✅ [SEGUIMIENTO] Precisión ACEPTADA: ${position.accuracy}m ≤ ${config.minAccuracy}m`);
          callback(position);
          this.notifyCallbacks(position);
        } else {
          console.log(`❌ [SEGUIMIENTO] Precisión RECHAZADA: ${position.accuracy}m > ${config.minAccuracy}m - IGNORANDO`);
        }
        
      } catch (error) {
        console.error('❌ [SEGUIMIENTO] Error:', error.message);
        // Continuar intentando en lugar de fallar
      }
    };
    
    // Obtener ubicación inicial inmediatamente
    updateLocation();
    
    // Configurar intervalo
    this.currentWatchId = setInterval(updateLocation, config.interval);
    
    console.log(`✅ [SEGUIMIENTO] Watch iniciado cada ${config.interval}ms`);
  }

  // ⏹️ DETENER SEGUIMIENTO
  stopWatch() {
    if (this.currentWatchId) {
      clearInterval(this.currentWatchId);
      this.currentWatchId = null;
      console.log('⏹️ Watch detenido');
    }
  }

  // ✅ VERIFICAR PRECISIÓN
  isHighAccuracy(position) {
    return position && position.accuracy && position.accuracy <= this.accuracyThreshold;
  }

  // 📢 NOTIFICAR CALLBACKS
  notifyCallbacks(position) {
    this.callbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('Error en callback:', error);
      }
    });
  }

  // ⏰ DELAY PARA REINTENTOS
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ℹ️ INFORMACIÓN DEL SERVICIO HÍBRIDO
  getServiceInfo() {
    return {
      provider: 'GPS Nativo + Google API (Híbrido)',
      accuracy: 'Ultra-alta (1-10m GPS, 10-50m Google)',
      speed: 'Ultra-rápida (GPS primero, Google backup)',
      strategy: 'GPS nativo PRIMERO → Google API si falla',
      emergencyOptimized: true,
      lastPosition: this.lastKnownPosition
    };
  }
}

// Instancia única para toda la app
const preciseLocationService = new PreciseLocationService();

export default preciseLocationService;
