import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/customSupabaseClient'
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AssociationFormModal = ({ association, onClose, onSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    telefono: '',
    url_web: '',
    ubicacion: '',
    visible: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (association) {
      const [city, state] = association.ubicacion?.split(',').map(s => s.trim()) || ['', ''];
      setFormData({
        nombre: association.nombre || '',
        descripcion: association.descripcion || '',
        telefono: association.telefono || '',
        url_web: association.url_web || '',
        state: state || '',
        city: city || '',
        visible: association.visible ?? true,
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        telefono: '',
        url_web: '',
        state: '',
        city: '',
        visible: true,
      });
    }
  }, [association]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { city, state, ...restOfData } = formData;
    const submissionData = {
      ...restOfData,
      ubicacion: `${city}, ${state}`,
      created_by: user.id,
    };

    let query;
    if (association) {
      query = supabase.from('asociaciones_apoyo').update(submissionData).eq('id', association.id);
    } else {
      query = supabase.from('asociaciones_apoyo').insert(submissionData);
    }

    const { error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la asociación.' });
      console.error(error);
    } else {
      toast({ title: 'Éxito', description: `Asociación ${association ? 'actualizada' : 'creada'} correctamente.` });
      onSave();
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-serif text-brand-primary">
              {association ? 'Editar Asociación' : 'Nueva Asociación'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-secondary mb-1">Nombre</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full p-2 border border-brand-accent/30 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-secondary mb-1">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" className="w-full p-2 border border-brand-accent/30 rounded-lg"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-secondary mb-1">Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2 border border-brand-accent/30 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-secondary mb-1">Sitio Web</label>
              <input type="url" name="url_web" value={formData.url_web} onChange={handleChange} className="w-full p-2 border border-brand-accent/30 rounded-lg" />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-brand-secondary mb-1">Ciudad</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border border-brand-accent/30 rounded-lg" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-brand-secondary mb-1">Estado</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-2 border border-brand-accent/30 rounded-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="visible" name="visible" checked={formData.visible} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
              <label htmlFor="visible" className="text-sm font-medium text-brand-secondary">Visible para usuarias</label>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssociationFormModal;