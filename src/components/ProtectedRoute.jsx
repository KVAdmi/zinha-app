import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import supabase from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Shield, CreditCard, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  // BYPASS TOTAL PARA ADMIN
  if (user?.email === 'asistia24@gmail.com') {
    return children;
  }

  // Lista de códigos donativos válidos
  const validarCodigoDonativo = async (codigo) => {
    if (!codigo) return false;
    
    try {
      const { data, error } = await supabase
        .from('codigos_donativos')
        .select('*')
        .eq('codigo', codigo.toUpperCase())
        .eq('activo', true)
        .single();

      if (error || !data) return false;

      // Verificar expiración
      const ahora = new Date();
      const expiracion = new Date(data.fecha_expiracion);
      
      if (ahora > expiracion) return false;

      // Verificar usos
      if (data.usos_actuales >= data.usos_maximos) return false;

      return true;
    } catch (error) {
      console.error('Error validando código:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Obtener perfil del usuario
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error al obtener perfil:', error);
          setLoading(false);
          return;
        }

        setProfile(profileData || {});

        // Verificar acceso:
        // 1. Si tiene código donativo válido
        // 2. Si ha pagado (has_paid = true)
        // 3. Si el perfil está completo
        const tieneCodigoDonativo = profileData?.codigo_donativo && await validarCodigoDonativo(profileData.codigo_donativo);
        const haPagado = profileData?.has_paid === true;
        const perfilCompleto = profileData?.profile_completed === true;

        console.log('🔍 Verificando acceso:', {
          tieneCodigoDonativo,
          haPagado,
          perfilCompleto,
          codigo: profileData?.codigo_donativo,
          profileData: profileData
        });

        if (tieneCodigoDonativo || haPagado) {
          setAccessGranted(true);
        } else {
          setAccessGranted(false);
        }

      } catch (error) {
        console.error('Error al verificar acceso:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo verificar tu acceso. Intenta recargar la página.'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading, toast]);

  // Mostrar loading mientras se verifica
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si tiene acceso, mostrar el contenido
  if (accessGranted) {
    return children;
  }

  // Si no tiene acceso, mostrar pantalla de acceso denegado
  return (
    <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <Shield className="w-16 h-16 mx-auto mb-6 text-brand-primary" />
          
          <h1 className="text-2xl font-bold text-brand-primary mb-4">
            Acceso Requerido
          </h1>
          
          <p className="text-brand-secondary mb-6">
            Para acceder a Zinha necesitas activar tu membresía o tener un código donativo válido.
          </p>

          <div className="space-y-4">
            {/* Mostrar estado del perfil */}
            {!profile?.profile_completed && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Paso 1: Completar perfil</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Completa tus datos personales en tu perfil.
                </p>
              </div>
            )}

            {profile?.profile_completed && !profile?.has_paid && !validarCodigoDonativo(profile?.codigo_donativo) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Paso 2: Activar membresía</span>
                </div>
                <p className="text-sm text-blue-700">
                  Selecciona un plan de pago o ingresa un código donativo.
                </p>
              </div>
            )}

            {profile?.codigo_donativo && !validarCodigoDonativo(profile.codigo_donativo) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Código donativo inválido</span>
                </div>
                <p className="text-sm text-red-700">
                  El código "{profile.codigo_donativo}" no es válido. Verifica el código o procede con el pago.
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/perfil'}
                className="w-full bg-brand-accent hover:bg-brand-secondary text-white"
              >
                {!profile?.profile_completed ? 'Completar Perfil' : 'Ir a Mi Perfil'}
              </Button>

              {profile?.profile_completed && (
                <Button 
                  onClick={() => window.location.href = '/pricing'}
                  variant="outline"
                  className="w-full border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ver Planes de Pago
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ¿Tienes un código donativo? Ingrésalo en tu perfil para acceso gratuito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
