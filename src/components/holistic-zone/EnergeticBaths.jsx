
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const EnergeticBaths = () => {
  const [baths, setBaths] = useState([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchBaths = async () => {
      const { data, error } = await supabase
        .from('banos_energeticos')
        .select('*')
        .eq('visible', true);
      if (error) {
        console.error('Error fetching baths:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los baños energéticos.' });
      }
      else setBaths(data);
    };
    fetchBaths();
  }, [toast]);

  return (
    <div className="space-y-4">
      {baths.map((bath, index) => (
        <motion.div
          key={bath.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="font-bold text-lg text-brand-primary">{bath.nombre}</h3>
          <p className="text-sm text-brand-secondary mb-3">{bath.categoria}</p>
          <div className="text-sm text-brand-primary/80">
            <h4 className="font-semibold mb-1">Ingredientes:</h4>
            <p className="mb-2 whitespace-pre-line">{bath.ingredientes}</p>
            <h4 className="font-semibold mb-1">Instrucciones:</h4>
            <p className="whitespace-pre-line">{bath.instrucciones}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default EnergeticBaths;
