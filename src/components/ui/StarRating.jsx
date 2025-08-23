import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ count = 5, rating, onRatingChange, size = 6, isInteractive = true }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index) => {
    if (!isInteractive) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!isInteractive) return;
    setHoverRating(0);
  };

  const handleClick = (index) => {
    if (!isInteractive) return;
    onRatingChange(index);
  };

  const stars = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="flex items-center space-x-1">
      {stars.map((index) => {
        const fillValue = hoverRating > 0 ? hoverRating : rating;
        const isFilled = index <= fillValue;
        return (
          <Star
            key={index}
            className={cn(
              `w-${size} h-${size}`,
              isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300',
              isInteractive ? 'cursor-pointer transition-transform duration-200 hover:scale-125' : ''
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;