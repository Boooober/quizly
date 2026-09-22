import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { OptionUI } from '../types/onboarding';

interface OptionCardProps {
  option: OptionUI;
  index: number;
  isSelected: boolean;
  /** 'radio' commits immediately, 'checkbox' toggles a draft selection. */
  control: 'radio' | 'checkbox';
  disabled?: boolean;
  onSelect: () => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  index,
  isSelected,
  control,
  disabled = false,
  onSelect,
}) => {
  return (
    <motion.button
      type="button"
      role={control}
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.045, duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={`group relative w-full overflow-hidden rounded-card border p-5 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out ${
        isSelected
          ? 'border-accent bg-accent/8 shadow-accent'
          : 'border-line bg-surface/70 shadow-card hover:-translate-y-px hover:border-line-strong hover:bg-surface-raised'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {/* Accent rail: reads as selection without adding a second colour */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.5 bg-accent transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5 pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-base font-medium transition-colors sm:text-[1.0625rem] ${
                isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
              }`}
            >
              {option.title}
            </span>
            {option.tag && (
              <span className="rounded-sm border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-accent-bright">
                {option.tag}
              </span>
            )}
          </div>

          {option.subtitle && (
            <p className="max-w-[58ch] text-[0.8125rem] leading-relaxed text-zinc-400 sm:text-sm">
              {option.subtitle}
            </p>
          )}
        </div>

        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border transition-colors duration-200 ${
            control === 'radio' ? 'rounded-full' : 'rounded-md'
          } ${
            isSelected
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-zinc-700 bg-black/25 group-hover:border-zinc-500'
          }`}
        >
          {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
        </span>
      </div>
    </motion.button>
  );
};
