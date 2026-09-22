import React from 'react';
import type { Pigment } from '../theme/pigments';

interface QuestionHeaderProps {
  pigment: Pigment;
  category?: string;
  question: string;
  helperText?: string;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  helperText,
}) => {
  return (
    <div className="text-center">
      <h1 className="mt-4 text-[1.75rem] leading-[1.18] text-ink sm:text-[2.125rem]">
        {question}
      </h1>

      {helperText && (
        <p className="subheading mt-2 text-muted">{helperText}</p>
      )}
    </div>
  );
};
