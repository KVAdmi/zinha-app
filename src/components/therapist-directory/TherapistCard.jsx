
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Stethoscope, MapPin, Edit, Trash2, MessageCircle } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import ReviewsSection from './ReviewsSection';

const TherapistCard = ({ therapist, isAdmin, onEdit, onDelete, reviewsData, fetchReviews }) => {
    const [isReviewsVisible, setIsReviewsVisible] = useState(false);
    const { reviews, averageRating, reviewCount } = reviewsData[therapist.id] || { reviews: [], averageRating: 0, reviewCount: 0 };

    const toggleReviews = () => {
        if (!isReviewsVisible) {
            fetchReviews(therapist.id);
        }
        setIsReviewsVisible(!isReviewsVisible);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            layout
            className="bg-white rounded-2xl shadow-md p-6 flex flex-col h-full transition-shadow hover:shadow-xl"
        >
            <h3 className="text-xl font-bold text-brand-primary mb-2">{therapist.nombre}</h3>
            <p className="text-brand-accent font-semibold mb-1 flex items-center"><Stethoscope className="w-4 h-4 mr-2" />{therapist.especialidad}</p>
            <p className="text-brand-secondary mb-4 flex items-center"><MapPin className="w-4 h-4 mr-2" />{therapist.ciudad}</p>
            
            <div className="flex items-center space-x-2 mb-4 text-sm text-brand-secondary">
                <StarRating rating={averageRating} isInteractive={false} size={5} />
                <span>({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})</span>
            </div>

            <div className="mt-auto space-y-2">
                <div className="flex space-x-2">
                    {therapist.telefono && (
                        <a href={`tel:${therapist.telefono}`} className="flex-1">
                            <Button variant="outline" className="w-full"><Phone className="w-4 h-4 mr-2" />Llamar</Button>
                        </a>
                    )}
                    {therapist.whatsapp && (
                        <a href={`https://wa.me/${therapist.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-white"><MessageSquare className="w-4 h-4 mr-2" />WhatsApp</Button>
                        </a>
                    )}
                </div>
                <Button variant="ghost" className="w-full text-brand-accent" onClick={toggleReviews}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isReviewsVisible ? 'Ocultar Reseñas' : 'Ver Reseñas'}
                </Button>
            </div>

            <AnimatePresence>
                {isReviewsVisible && <ReviewsSection therapistId={therapist.id} reviews={reviews} fetchReviews={fetchReviews} />}
            </AnimatePresence>

            {isAdmin && (
                <div className="mt-4 border-t pt-2 flex justify-between items-center">
                    <p className={`text-sm font-bold ${therapist.visible ? 'text-green-600' : 'text-red-600'}`}>{therapist.visible ? 'Visible' : 'Oculto'}</p>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(therapist)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(therapist.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default TherapistCard;
