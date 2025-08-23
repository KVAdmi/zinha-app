import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Activity, Mic, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PreventionModule = () => {
  const { toast } = useToast();

  const preventionItems = [
    {
      icon: ShieldCheck,
      title: 'Kit de Detección',
      description: 'Conecta dispositivos para detectar sustancias en bebidas y mantenerte segura.',
      color: 'bg-brand-accent',
      action: () => toast({ title: "🔬 Función en desarrollo" }),
    },
    {
      icon: Mic,
      title: 'Escáner Emocional',
      description: 'Nuestra IA puede detectar señales de ansiedad o riesgo en tu voz.',
      color: 'bg-brand-secondary',
      action: () => toast({ title: "🎤 Función en desarrollo" }),
    },
    {
      icon: FileText,
      title: 'Espacio Legal',
      description: 'Guías paso a paso y conexión con abogadas expertas en violencia de género.',
      color: 'bg-brand-primary',
      action: () => toast({ title: "⚖️ Función en desarrollo" }),
    },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-brand-background overflow-y-auto">
      <div className="pt-20 min-h-full">
        <Helmet>
          <title>Prevención y Detección - Zinha</title>
          <meta name="description" content="Herramientas de alta tecnología para la prevención de riesgos y guías de acción legal." />
        </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-brand-primary font-serif">
            Prevención y Detección
          </h1>
          <p className="text-xl text-brand-secondary max-w-3xl mx-auto">
            Tecnología y conocimiento para anticipar y actuar ante el riesgo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {preventionItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group"
              >
                <div
                  onClick={item.action}
                  className="bg-white rounded-3xl p-8 card-hover cursor-pointer h-full border border-brand-accent/20"
                >
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-brand-primary font-serif">
                    {item.title}
                  </h3>
                  <p className="text-brand-secondary leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <div className="flex items-center text-brand-accent group-hover:text-brand-primary transition-colors">
                    <span className="font-medium">Saber más</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PreventionModule;