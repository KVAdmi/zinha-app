import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Phone, Trash2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmergencyContacts = ({ contacts, loading, onAdd, onDelete }) => {
  const handleCall = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const ContactSkeleton = () => (
    <div className="bg-brand-background rounded-2xl p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
        <div>
          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="bg-white rounded-3xl p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-brand-primary font-serif">Contactos de Confianza</h2>
        <Button
          onClick={onAdd}
          disabled={contacts.length >= 3}
          className="bg-brand-accent hover:bg-brand-secondary text-white rounded-full disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          {contacts.length >= 3 ? 'Límite alcanzado' : 'Agregar'}
        </Button>
      </div>

      {contacts.length >= 3 && (
        <p className="text-sm text-red-500 mt-2">
          Ya has agregado los 3 contactos permitidos. 🙌
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <ContactSkeleton />
          <ContactSkeleton />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10">
          <Users className="w-16 h-16 text-brand-accent/30 mx-auto mb-4" />
          <p className="text-brand-secondary text-lg font-semibold">Aún no tienes contactos de emergencia guardados.</p>
          <p className="text-brand-secondary/70">Agrega uno para estar más segura.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-brand-background rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-brand-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {contact.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-primary">{contact.nombre}</h3>
                  <p className="text-sm text-brand-secondary">{contact.telefono}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-brand-secondary hover:text-green-500"
                  onClick={() => handleWhatsApp(contact.telefono)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.58C8.75 21.39 10.36 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2ZM12.04 20.13C10.49 20.13 8.99 19.68 7.7 18.89L7.31 18.65L4.5 19.5L5.41 16.78L5.16 16.4C4.32 15.04 3.82 13.5 3.82 11.91C3.82 7.39 7.52 3.69 12.04 3.69C16.56 3.69 20.26 7.39 20.26 11.91C20.26 16.43 16.56 20.13 12.04 20.13ZM17.48 14.54C17.21 14.41 15.95 13.78 15.7 13.68C15.45 13.59 15.28 13.54 15.1 13.81C14.92 14.08 14.37 14.71 14.2 14.88C14.03 15.05 13.86 15.07 13.59 14.94C13.32 14.81 12.44 14.5 11.41 13.58C10.61 12.86 10.08 12.01 9.91 11.74C9.74 11.47 9.85 11.35 9.98 11.22C10.1 11.1 10.25 10.91 10.4 10.75C10.55 10.59 10.6 10.46 10.73 10.2C10.86 9.94 10.78 9.72 10.69 9.55C10.6 9.38 10.08 8.16 9.86 7.62C9.64 7.08 9.42 7.15 9.25 7.15H8.78C8.59 7.15 8.28 7.24 8.01 7.51C7.74 7.78 7.1 8.35 7.1 9.55C7.1 10.75 8.04 11.9 8.17 12.07C8.3 12.24 10.08 14.83 12.67 15.97C13.25 16.22 13.68 16.36 14.01 16.49C14.58 16.68 15.06 16.65 15.42 16.58C15.82 16.5 16.88 15.91 17.11 15.31C17.34 14.71 17.34 14.2 17.25 14.07C17.16 13.94 17.03 13.85 16.87 13.78C16.71 13.71 16.55 13.65 16.38 13.58L16.22 13.53C16.05 13.46 15.89 13.4 15.73 13.34L17.48 14.54Z"></path></svg>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-brand-secondary hover:text-brand-dark-blue"
                  onClick={() => handleCall(contact.telefono)}
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-brand-secondary hover:text-red-500"
                  onClick={() => onDelete(contact.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EmergencyContacts;
