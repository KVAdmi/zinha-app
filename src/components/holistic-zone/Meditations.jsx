
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, BarChart } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const Meditations = () => {
  const [meditations, setMeditations] = useState([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchMeditations = async () => {
      const { data, error } = await supabase
        .from('meditaciones')
        .select('*')
        .eq('visible', true);
      if (error) {
        console.error('Error fetching meditations:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las meditaciones.' });
      }
      else setMeditations(data);
    };
    fetchMeditations();
  }, [toast]);
  
  const playAudio = (audioUrl) => {
    if (audioUrl) {
        window.open(audioUrl, '_blank');
    } else {
        toast({
            variant: "destructive",
            title: "Audio no disponible",
            description: "No hay un archivo de audio para esta meditación.",
        });
    }
  };

  return (
    <div className="space-y-4">
      {meditations.map((meditation, index) => (
        <motion.div
          key={meditation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between"
        >
          <div className="flex-grow">
            <h3 className="font-bold text-lg text-brand-primary">{meditation.titulo}</h3>
            <p className="text-sm text-brand-primary/80 mb-2">{meditation.descripcion}</p>
            <div className="flex items-center space-x-4 text-xs text-brand-secondary">
              <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {meditation.duracion_min} min</span>
              <span className="flex items-center"><BarChart className="mr-1 h-3 w-3" /> {meditation.nivel}</span>
            </div>
          </div>
          <Button size="icon" className="bg-brand-highlight hover:bg-brand-highlight/80 rounded-full" onClick={() => playAudio(meditation.url_audio)}>
            <PlayCircle className="h-6 w-6 text-brand-primary" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default Meditations;
