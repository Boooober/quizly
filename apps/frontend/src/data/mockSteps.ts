import type { OnboardingStepUI } from '../types/onboarding';

export const mockOnboardingSteps: OnboardingStepUI[] = [
  {
    id: 'step_width_fit',
    category: 'Anatomy & Sizing',
    question: 'How do standard sunglasses typically fit your head width?',
    helperText: 'Choose the one that best reflects your past experience',
    mode: 'single_select',
    options: [
      {
        id: 'width_tight',
        title: 'Too narrow / pinches temples',
        subtitle: 'Leaves red pressure indentations behind ears after an hour',
        tag: 'Wide Frame Needed',
      },
      {
        id: 'width_standard',
        title: 'Standard flush fit',
        subtitle: 'Balanced grip, sits comfortably on zygomatic arches without pinching',
      },
      {
        id: 'width_loose',
        title: 'Too wide / loose on sides',
        subtitle: 'Slides forward easily or frames look oversized on your face',
        tag: 'Petite Frame Needed',
      },
    ],
  },
  {
    id: 'step_fit_friction',
    category: 'Fit & Friction',
    question: 'Tell us about your fit and feel. Any specific issues to eliminate?',
    helperText: 'Select all that apply to you',
    mode: 'multi_select',
    options: [
      {
        id: 'pain_bridge_slip',
        title: 'Bridge Slipping',
        subtitle: 'Constantly slides down nasal crest when walking or looking down',
        tag: 'Common',
      },
      {
        id: 'pain_pinch_marks',
        title: 'Red Nose Indentations',
        subtitle: 'Heavy frames leave visible red compression marks on nose bridge',
      },
      {
        id: 'pain_cheek_contact',
        title: 'Cheekbone Contact',
        subtitle: 'Lower rim rests on cheeks or lifts and fogs up when smiling',
      },
      {
        id: 'pain_temple_fatigue',
        title: 'Temple Headaches',
        subtitle: 'Dull ache behind ears or around temples after 2+ hours of wear',
      },
      {
        id: 'pain_eyelash_touch',
        title: 'Eyelashes Hitting Lenses',
        subtitle: 'Insufficient vertex distance causes eyelashes to touch inner glass',
      },
    ],
  },
  {
    id: 'step_bridge_profile',
    category: 'Bridge Ergonomics',
    question: 'What nose-pad style works best for your nasal bridge?',
    helperText: 'Choose one preference',
    mode: 'single_select',
    options: [
      {
        id: 'bridge_silicone_pads',
        title: 'Adjustable Silicone Pads',
        subtitle: 'Micro-adjustable titanium arms with non-slip medical silicone',
        tag: 'Zero Slip',
      },
      {
        id: 'bridge_keyhole_acetate',
        title: 'Classic Keyhole Saddle Bridge',
        subtitle: 'Molded acetate with weight distributed across lateral sides',
      },
      {
        id: 'bridge_ultralight_rimless',
        title: 'Ultralight Titanium Chassis',
        subtitle: 'Featherweight build (<12g) so you barely feel any pressure',
        tag: 'Featherweight',
      },
      {
        id: 'bridge_no_preference',
        title: 'No specific preference',
        subtitle: 'Standard bridge design fits me without discomfort',
      },
    ],
  },
  {
    id: 'step_lifestyle_setting',
    category: 'Light & Environments',
    question: 'Where will you wear these sunglasses the most?',
    helperText: 'Select all environments relevant to your lifestyle',
    mode: 'multi_select',
    options: [
      {
        id: 'env_city_commute',
        title: 'City & Daily Routine',
        subtitle: 'Walking, morning commute, outdoor dining and urban cafes',
      },
      {
        id: 'env_driving_road',
        title: 'Driving & Highway Road Trips',
        subtitle: 'Intense blinding asphalt reflections and dashboard glare',
        tag: 'High Glare',
      },
      {
        id: 'env_water_snow',
        title: 'Open Water, Beach & Snow',
        subtitle: 'High-albedo reflective glare requiring polarized optical precision',
        tag: 'Polarized Critical',
      },
      {
        id: 'env_active_training',
        title: 'Dynamic Sports & Running',
        subtitle: 'High perspiration, movement stability, and ventilation',
      },
      {
        id: 'env_golden_hour',
        title: 'Golden Hour & Social Evenings',
        subtitle: 'Sunset terraces, relaxed eye contact, and aesthetic tone',
      },
    ],
  },
  {
    id: 'step_lens_privacy',
    category: 'Optical Privacy',
    question: 'How dark and private do you prefer your lenses to be?',
    helperText: 'Choose your lens tint depth',
    mode: 'single_select',
    options: [
      {
        id: 'tint_impenetrable_dark',
        title: 'Fully Dark & Impenetrable',
        subtitle: 'Zero eye visibility from outside, stoic Category 3-4 solar shield',
        tag: 'Maximum Shade',
      },
      {
        id: 'tint_classic_balanced',
        title: 'Classic Balanced Tint',
        subtitle: 'Traditional dark green or neutral grey with natural color fidelity',
      },
      {
        id: 'tint_gradient_luminous',
        title: 'Luminous 2-Tone Gradient',
        subtitle: 'Darker top brow shading to clear bottom for warm conversational eye contact',
        tag: 'Editorial',
      },
      {
        id: 'tint_expressive_vintage',
        title: 'Warm Vintage Tint (Amber / Rose)',
        subtitle: 'High-contrast chromatic enhancement for mood and aesthetic warmth',
      },
    ],
  },
];
