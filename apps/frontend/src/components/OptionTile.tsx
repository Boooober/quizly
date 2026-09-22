import React from 'react';
import type { OptionUI } from '../types/onboarding';

interface OptionTileProps {
  option: OptionUI;
  isSelected: boolean;
  /** 'radio' commits immediately, 'checkbox' toggles a draft selection. */
  control: 'radio' | 'checkbox';
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * A flat filled tile, in the manner of the reference product grids: no border,
 * no shadow, no elevation. Selection is carried by fill and a hairline ring.
 */
export const OptionTile: React.FC<OptionTileProps> = ({
  option,
  isSelected,
  control,
  disabled = false,
  onSelect,
}) => {
  return (
    <button
      type="button"
      role={control}
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-h-[4.75rem] w-full items-center gap-4 rounded-tile px-5 py-4 text-left transition-colors duration-200 ease-soft ${
        isSelected
          ? 'bg-accent-tint ring-1 ring-accent ring-inset'
          : 'bg-tile hover:bg-tile-hover'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="min-w-0 flex-1">
        {option.tag && (
          <span
            className={`caption block ${isSelected ? 'text-accent' : 'text-faint'}`}
          >
            {option.tag}
          </span>
        )}

        <span
          className={`mt-1 block text-[1.0625rem] leading-snug text-ink sm:text-lg ${
            isSelected ? 'font-semibold' : 'font-medium'
          }`}
        >
          {option.title}
        </span>

        {option.subtitle && (
          <span className="mt-1 block max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
            {option.subtitle}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center border transition-colors duration-200 ease-soft ${
          control === 'radio' ? 'rounded-full' : 'rounded-md'
        } ${isSelected ? 'border-accent bg-accent' : 'border-control bg-transparent'}`}
      >
        {isSelected &&
          (control === 'radio' ? (
            <span className="h-2 w-2 rounded-full bg-page" />
          ) : (
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="#fff" strokeWidth="2.25">
              <path d="M2.5 7.5 5.5 10.5 11.5 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
      </span>
    </button>
  );
};
