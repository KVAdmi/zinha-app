import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Heart, Calendar, Bell, Activity, Pill, Plus, Edit, Trash2, CheckCircle, Clock, Droplets, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const HealthCard = ({ icon: Icon, title, value, color, bgColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    className={`${bgColor} rounded-3xl p-6 card-hover`}
  >
    <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-3xl font-bold text-brand-deep-purple mb-2">{value}</div>
    <div className="text-brand-gray-purple font-medium">{title}</div>
  </motion.div>
);

const Section = ({ title, buttonText, onButtonClick, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    className="glass-effect rounded-3xl p-8"
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-brand-deep-purple">{title}</h2>
      <Button onClick={onButtonClick} className="bg-brand-mauve hover:bg-brand-gray-purple text-white rounded-full">
        <Plus className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
    </div>
    {children}
  </motion.div>
);

const HealthModule = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    const exampleAppointments = [
      { id: 1, doctor: 'Dra. Elena Solís', specialty: 'Ginecología', date: '2025-08-10', time: '11:00' },
    ];
    const exampleMedications = [
      { id: 1, name: 'Vitamina C', dosage: '1000mg', frequency: '1 al día', nextDose: '09:00' },
    ];
    setAppointments(JSON.parse(localStorage.getItem('healthAppointments')) || exampleAppointments);
    setMedications(JSON.parse(localStorage.getItem('healthMedications')) || exampleMedications);
  }, []);

  const showToast = () => toast({ title: "🚧 Función en desarrollo" });

  const healthStats = [
    { icon: Droplets, title: 'Ciclo Menstrual', value: 'Día 14', color: 'from-pink-400 to-red-400', bgColor: 'bg-red-50' },
    { icon: Smile, title: 'Estado de Ánimo', value: 'Feliz', color: 'from-yellow-400 to-amber-400', bgColor: 'bg-yellow-50' },
    { icon: Calendar, title: 'Próximas Citas', value: appointments.length, color: 'from-blue-400 to-sky-400', bgColor: 'bg-blue-50' },
    { icon: Pill, title: 'Medicamentos', value: medications.length, color: 'from-green-400 to-emerald-400', bgColor: 'bg-green-50' },
  ];

  return (
    <div className="pt-20 min-h-screen">
      <Helmet>
        <title>Bienestar Holístico - ZINHA360</title>
        <meta name="description" content="Gestiona tu agenda cíclica, meditaciones y seguimiento emocional." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-mauve to-brand-gray-purple rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Bienestar Holístico</h1>
          <p className="text-xl text-brand-gray-purple max-w-3xl mx-auto">Cuida de ti, por dentro y por fuera.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {healthStats.map((stat, index) => (
            <HealthCard key={index} {...stat} delay={index * 0.1} />
          ))}
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          <Section title="Agenda Cíclica y Citas" buttonText="Agendar" onButtonClick={showToast} delay={0.4}>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white/50 rounded-2xl p-6 card-hover">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-brand-deep-purple">{apt.doctor}</h3>
                        <p className="text-brand-gray-purple">{apt.specialty}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={showToast} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={showToast} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-brand-deep-purple">
                      <div className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>{apt.date}</span></div>
                      <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>{apt.time}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-brand-gray-purple">No tienes citas programadas.</p></div>
            )}
          </Section>

          <Section title="Medicamentos y Recordatorios" buttonText="Agregar" onButtonClick={showToast} delay={0.6}>
            {medications.length > 0 ? (
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="bg-white/50 rounded-2xl p-6 card-hover">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-brand-deep-purple">{med.name}</h3>
                        <p className="text-brand-gray-purple">{med.dosage} • {med.frequency}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={showToast} className="p-2 text-gray-500 hover:text-green-600"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={showToast} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-brand-deep-purple"><Clock className="w-4 h-4" /><span>Próxima dosis: {med.nextDose}</span></div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Activo</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-brand-gray-purple">No tienes medicamentos registrados.</p></div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

export default HealthModule;