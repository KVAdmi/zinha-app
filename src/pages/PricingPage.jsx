import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Star, Phone, Loader2, Gift } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import supabase from '@/lib/customSupabaseClient.js';
import { Toaster } from '@/components/ui/toaster';

const PricingPage = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [loading, setLoading] = useState(false);
  const [donationCode, setDonationCode] = useState('');
  const [showDonationCode, setShowDonationCode] = useState(false);

  // Configuración de Stripe
  const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;
  
  // Verificar si Stripe está configurado
  const isStripeConfigured = !!STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== 'pk_test_TU_CLAVE_PUBLICA_DE_STRIPE';
  
  const plans = {
    basic: {
      name: 'Básico',
      price: 79,
      priceId: STRIPE_PRICE_ID_BASIC,
      features: [
        'Acceso a toda la comunidad',
        'Diario emocional ilimitado',
        'Módulo de seguridad personal',
        'Biblioteca Zinha completa',
      ],
    },
    premium: {
      name: 'Premium',
      price: 199,
      priceId: STRIPE_PRICE_ID_PREMIUM,
      features: [
        'Todos los beneficios del plan Básico',
        'Asistencia y coberturas Zinha',
        'Zona Holística exclusiva',
        'Eventos y talleres premium',
      ],
    },
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };
  
  const handleDonationCode = async () => {
    if (!donationCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo requerido',
        description: 'Por favor, ingresa tu código de donativo.',
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar código en Supabase
      const { data, error } = await supabase
        .from('codigos_donativo')
        .select('*')
        .eq('codigo', donationCode.trim().toUpperCase())
        .eq('activo', true)
        .single();

      if (error || !data) {
        toast({
          variant: 'destructive',
          title: 'Código inválido',
          description: 'El código de donativo no es válido o ya ha sido usado.',
        });
        setLoading(false);
        return;
      }

      // Marcar código como usado
      await supabase
        .from('codigos_donativo')
        .update({ 
          activo: false, 
          usado_por: user.id,
          fecha_uso: new Date().toISOString()
        })
        .eq('codigo', donationCode.trim().toUpperCase());

      // Actualizar perfil del usuario
      await supabase
        .from('profiles')
        .update({ 
          tipo_plan: 'premium',
          fecha_activacion: new Date().toISOString()
        })
        .eq('id', user.id);

      toast({
        title: '¡Código aplicado!',
        description: 'Tu membresía premium ha sido activada. Completa tu perfil para acceder a todos los beneficios.',
      });

      // Redirigir a completar perfil
      navigate('/completar-perfil');

    } catch (error) {
      console.error('Error verificando código:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al verificar el código. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinue = async () => {
    if (!session || !user) {
      toast({
        variant: 'destructive',
        title: 'Debes iniciar sesión',
        description: 'Para continuar, por favor inicia sesión o regístrate.',
      });
      navigate('/login');
      return;
    }
    
    setLoading(true);

    try {
        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error("Stripe no está disponible. Por favor verifica la configuración.");
        }

        // Verificar configuración de Stripe
        if (!isStripeConfigured) {
            throw new Error("Stripe no está configurado correctamente. Contacta al administrador.");
        }

        // Datos del plan seleccionado
        const planData = plans[selectedPlan];
        
        // Crear checkout session usando Stripe directamente
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{ 
            price_data: {
              currency: 'mxn',
              product_data: {
                name: planData.name,
                description: `Suscripción ${planData.name} - Zinha`,
              },
              unit_amount: planData.price * 100, // Convertir a centavos
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1 
          }],
          mode: 'subscription',
          success_url: `${window.location.origin}/payment-success?plan=${selectedPlan}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
          customer_email: user.email,
          metadata: {
            userId: user.id,
            plan: selectedPlan
          }
        });

        if (error) {
          throw new Error(error.message);
        }

    } catch (error) {
        console.error('Error en pago:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "No se pudo iniciar el proceso de pago.",
        });
        setLoading(false);
    }
  };

  const handleAssistanceCall = () => {
    toast({
      title: '🚧 Esta función aún no está implementada',
      description: '¡Pero no te preocupes! Puedes solicitarla en tu próximo mensaje. 🚀'
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-brand-primary p-4">
      <BackButton fallbackRoute="/home" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto text-center"
      >
        <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/ce6b3f33-5fa3-4c63-a670-0869d616221b/e28c1dd880094048b81784be4521dd6c.png" alt="Zinha Logo" className="h-20 mx-auto mb-4" />
        <h1 className="text-4xl font-serif text-white mb-2">Elige tu Plan</h1>
        <p className="text-lg text-brand-secondary mb-10">Únete a la sororidad y accede a todas las herramientas para tu bienestar.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([key, plan]) => (
            <motion.div
              key={key}
              onClick={() => handleSelectPlan(key)}
              whileHover={{ y: -5 }}
              className={`glass-effect rounded-3xl p-8 cursor-pointer transition-all duration-300 flex flex-col relative overflow-hidden ${
                selectedPlan === key ? 'border-2 border-brand-accent scale-105' : 'border-2 border-transparent'
              }`}
            >
              {key === 'premium' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-accent text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1 z-10">
                  <Star className="w-4 h-4" />
                  <span>Más Popular</span>
                </div>
              )}
              <h2 className="text-3xl font-serif text-white mb-2">{plan.name}</h2>
              <p className="text-5xl font-bold text-white mb-4">
                ${plan.price}
                <span className="text-lg font-normal text-brand-secondary">/mes</span>
              </p>
              <ul className="space-y-3 text-left text-brand-background/80 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-brand-highlight flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {key === 'premium' && (
                 <Button onClick={handleAssistanceCall} variant="secondary" className="w-full bg-brand-highlight hover:bg-yellow-400 text-brand-primary rounded-full text-md py-4 mt-4 flex items-center space-x-2">
                    <Phone className="w-5 h-5"/>
                    <span>Pedir Asistencia Línea Zinha</span>
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Sección de código de donativo */}
        <div className="mt-10 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="border-t border-white/30 flex-1"></div>
            <span className="px-4 text-white/70 text-sm">o</span>
            <div className="border-t border-white/30 flex-1"></div>
          </div>
          
          <motion.div 
            className="glass-effect rounded-2xl p-6 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-brand-accent mr-2" />
              <h3 className="text-xl font-semibold text-white">¿Tienes un código de donativo?</h3>
            </div>
            <p className="text-brand-secondary text-sm mb-4 text-center">
              Si tienes un código especial, ingrésalo aquí para activar tu membresía
            </p>
            
            {!showDonationCode ? (
              <Button
                onClick={() => setShowDonationCode(true)}
                variant="outline"
                className="w-full border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white"
              >
                Tengo un código de donativo
              </Button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Ingresa tu código"
                  value={donationCode}
                  onChange={(e) => setDonationCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-full text-center font-mono text-lg uppercase tracking-widest"
                  maxLength="10"
                />
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDonationCode}
                    disabled={loading || !donationCode.trim()}
                    className="flex-1 bg-brand-accent hover:bg-brand-secondary text-white rounded-full"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Aplicar código'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDonationCode(false);
                      setDonationCode('');
                    }}
                    variant="outline"
                    className="px-6 border-white/30 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={loading || showDonationCode || !isStripeConfigured}
          className="w-full max-w-md bg-brand-accent hover:bg-brand-secondary text-white rounded-full text-lg py-6 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : !isStripeConfigured ? (
            "Stripe no configurado"
          ) : (
            `Continuar con ${plans[selectedPlan].name}`
          )}
        </Button>

        {!isStripeConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md"
          >
            <p className="text-yellow-800 text-sm text-center">
              ⚠️ Para activar los pagos, configura las claves de Stripe en el archivo .env:
              <br />
              <code className="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code>
            </p>
          </motion.div>
        )}
      </motion.div>
      <Toaster />
    </div>
  );
};

export default PricingPage;