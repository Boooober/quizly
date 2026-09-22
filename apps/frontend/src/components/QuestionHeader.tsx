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
    <div className="text-left">
      {category && (
        <div className="inline-flex items-center gap-2 rounded-sm border border-accent/20 bg-accent/8 px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.18em] text-accent-bright uppercase">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
          {category}
        </div>
      )}

      <h1 className="mt-4 text-[1.75rem] leading-[1.12] font-semibold tracking-[-0.022em] text-white sm:text-4xl lg:text-[2.75rem]">
        {question}
      </h1>

      {helperText && (
        <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-zinc-400 sm:text-base">
          {helperText}
        </p>
      )}
    </div>
  );
};
