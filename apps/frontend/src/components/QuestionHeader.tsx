import React from 'react';

interface QuestionHeaderProps {
  category?: string;
  question: string;
  helperText?: string;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  category,
  question,
  helperText,
}) => {
  return (
    <div className="space-y-3 text-left">
      {category && (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          {category}
        </div>
      )}

      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl leading-snug">
        {question}
      </h1>

      {helperText && (
        <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};
