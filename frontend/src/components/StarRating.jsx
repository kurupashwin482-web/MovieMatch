import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({
  rating = 0,
  onRate,
  disabled = false,
  size = 18,
  showLabel = true,
  interactive = true,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const activeValue = hoverRating || rating || 0;

  const handleClick = (value) => {
    if (disabled || !interactive) return;
    if (onRate) {
      onRate(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (disabled || !interactive) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (disabled || !interactive) return;
    setHoverRating(0);
  };

  return (
    <div className="star-rating-container" onMouseLeave={handleMouseLeave}>
      <div className="star-rating-stars">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = activeValue >= starIndex;
          const isHalf = activeValue >= starIndex - 0.5 && activeValue < starIndex;

          return (
            <button
              key={starIndex}
              type="button"
              className={`star-button ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''} ${
                disabled || !interactive ? 'cursor-default' : 'cursor-pointer'
              }`}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              disabled={disabled || !interactive}
              title={`Rate ${starIndex} star${starIndex > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={`star-icon ${isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="star-rating-label">
          {activeValue > 0 ? `${activeValue.toFixed(1)} / 5` : 'Rate'}
        </span>
      )}
    </div>
  );
};
