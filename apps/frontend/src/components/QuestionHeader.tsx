import React from 'react';
import type { Pigment } from '../theme/pigments';

interface QuestionHeaderProps {
  fieldNumber: number;
  totalFields: number;
  pigment: Pigment;
  category?: string;
  question: string;
  helperText?: string;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  fieldNumber,
  totalFields,
  pigment,
  category,
  question,
  helperText,
}) => {
  return (
    <div className="text-center">
      <p className="caption flex items-center justify-center gap-2 text-faint">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: pigment.hex }}
        />
        <span data-numeric>
          {String(fieldNumber).padStart(2, '0')} / {String(totalFields).padStart(2, '0')}
        </span>
        {category && <span className="text-muted">— {category}</span>}
      </p>

      <h1 className="mt-4 text-[1.75rem] leading-[1.18] text-ink sm:text-[2.125rem]">
        {question}
      </h1>

      {helperText && (
        <p className="subheading mt-2 text-muted">{helperText}</p>
      )}
    </div>
  );
};
