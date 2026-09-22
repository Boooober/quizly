/**
 * The swatch chips printed on the reference board, with their labels and hex
 * values kept verbatim. One is assigned per assessment field so each section
 * of the form is colour-coded the way the board codes frame finishes.
 */
export interface Pigment {
  label: string;
  hex: string;
}

export const PIGMENTS: Pigment[] = [
  { label: 'Gray grey', hex: '#526074' },
  { label: 'Brown', hex: '#904B2B' },
  { label: 'Gray yellow green', hex: '#7E8963' },
  { label: 'Red', hex: '#841919' },
  { label: 'Ochre', hex: '#957752' },
];

export const pigmentForIndex = (index: number): Pigment =>
  PIGMENTS[index % PIGMENTS.length];
