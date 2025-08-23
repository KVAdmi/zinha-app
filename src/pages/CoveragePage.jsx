import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { LifeBuoy, FileDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CoveragePage = () => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "🚧 Función en desarrollo",
      description: "Pronto podrás descargar el PDF de tus coberturas aquí. ¡Gracias por tu paciencia!",
    });
  };

  const handleCall = () => {
    window.location.href = 'tel:911';
    toast({
      title: "📞 Llamando a Asistencia Zinha",
      description: "Conectando con la línea de ayuda inmediata.",
    });
  };

  return (
    <div className="min-h-screen p-4">
      <Helmet>
        <title>Mis Coberturas - Zinha</title>
        <meta name="description" content="Accede a los detalles de tu póliza de asistencia Zinha y solicita ayuda cuando la necesites." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center">
            <LifeBuoy className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold font-serif text-brand-primary">Mis Coberturas</h1>
        <p className="text-lg text-brand-secondary max-w-md mx-auto">Tu póliza de asistencia y ayuda inmediata.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-3xl p-6 max-w-2xl mx-auto card-hover"
      >
        <h2 className="text-2xl font-bold text-brand-primary font-serif mb-2">Póliza Premium Zinha</h2>
        <p className="text-brand-secondary mb-6">
          Aquí encontrarás toda la información sobre las asistencias y beneficios incluidos en tu plan. Estamos para cuidarte.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleDownload}
            className="bg-brand-accent hover:bg-brand-secondary text-white rounded-xl py-6 text-base font-bold"
          >
            <FileDown className="w-5 h-5 mr-3" />
            Descargar mis coberturas
          </Button>
          <Button
            onClick={handleCall}
            className="bg-brand-primary hover:bg-brand-dark-blue text-white rounded-xl py-6 text-base font-bold"
          >
            <Phone className="w-5 h-5 mr-3" />
            Asistencia Zinha
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CoveragePage;