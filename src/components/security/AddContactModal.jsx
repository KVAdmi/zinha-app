import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/customSupabaseClient'

const AddContactModal = ({ isOpen, onClose }) => {
  const [newContact, setNewContact] = useState({
    nombre: '',
    telefono: '',
    prioridad: 1,
  });

  const handleAddClick = async () => {
    const { nombre, telefono, prioridad } = newContact;

    if (!nombre.trim() || !telefono.trim() || !prioridad) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    if (!/^\d{10}$/.test(telefono)) {
      alert('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (authError || !user) {
      alert('No se pudo obtener el usuario. Intenta iniciar sesión de nuevo.');
      return;
    }

    const { error } = await supabase
      .from('contactos_emergencia')
      .insert([
        {
          user_id: user.id,
          nombre,
          telefono,
          prioridad,
        },
      ]);

    if (error) {
      console.error('Error al guardar:', error);
      alert('Ocurrió un error al guardar el contacto.');
    } else {
      alert('¡Contacto guardado con éxito!');
      onClose(); // Cierra el modal
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/50"
        style={{ fontFamily: 'Questrial, sans-serif' }}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-[#382a3c] drop-shadow-sm">
            ✨ Agregar Contacto de Confianza
          </h3>
          <p className="text-sm text-[#382a3c]/70 mt-2">
            Agrega una persona importante para emergencias
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#382a3c] mb-3">Nombre</label>
            <input
              type="text"
              value={newContact.nombre}
              onChange={(e) =>
                setNewContact({ ...newContact, nombre: e.target.value })
              }
              className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 transition-all duration-300 shadow-lg text-[#382a3c]"
              placeholder="Nombre del contacto"
              autoFocus
              style={{ fontFamily: 'Questrial, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#382a3c] mb-3">Teléfono</label>
            <input
              type="tel"
              value={newContact.telefono}
              onChange={(e) =>
                setNewContact({ ...newContact, telefono: e.target.value })
              }
              className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 transition-all duration-300 shadow-lg text-[#382a3c]"
              placeholder="10 dígitos"
              style={{ fontFamily: 'Questrial, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#382a3c] mb-3">Prioridad</label>
            <select
              value={newContact.prioridad || 1}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  prioridad: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-6 py-4 bg-white/70 backdrop-blur-sm border-2 border-white/60 rounded-2xl focus:outline-none focus:border-[#c1d43a] focus:bg-white/90 transition-all duration-300 shadow-lg text-[#382a3c]"
              style={{ fontFamily: 'Questrial, sans-serif' }}
            >
              <option value={1}>Prioridad 1 (Principal)</option>
              <option value={2}>Prioridad 2 (Secundario)</option>
              <option value={3}>Prioridad 3 (Terciario)</option>
            </select>
          </div>

          <div className="flex justify-end pt-6 space-x-4">
            <Button 
              onClick={onClose} 
              className="bg-white/70 hover:bg-white/90 text-[#382a3c] border-2 border-white/60 rounded-2xl px-6 py-3 font-semibold transition-all duration-300 shadow-lg"
              style={{ fontFamily: 'Questrial, sans-serif' }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddClick} 
              className="bg-gradient-to-r from-[#c1d43a] to-[#a8c139] hover:from-[#a8c139] hover:to-[#c1d43a] text-[#382a3c] rounded-2xl px-6 py-3 font-semibold transition-all duration-300 shadow-xl border border-white/30"
              style={{ fontFamily: 'Questrial, sans-serif' }}
            >
              💾 Guardar Contacto
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddContactModal;
