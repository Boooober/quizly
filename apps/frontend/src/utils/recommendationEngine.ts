import { sunglassesCatalog, type SunglassesProduct } from '../data/sunglassesCatalog';

export interface RecommendationResult {
  hero: SunglassesProduct;
  alternatives: SunglassesProduct[];
  why: string[];
  source: 'backend' | 'client_heuristic';
}

/**
 * Calculates a personalized recommendation from user onboarding answers.
 * Optionally attempts the backend /quiz/recommend endpoint, falling back to local heuristic.
 */
export async function computeRecommendation(
  answers: Record<string, string[]>
): Promise<RecommendationResult> {
  // Try backend first if configured or local
  const apiUrl = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:3000';
  try {
    const formattedAnswers = Object.entries(answers).map(([stepId, selectedOptionIds]) => ({
      question: stepId,
      answers: selectedOptionIds,
      typeOfQuestion: 'multiChoice' as const,
      selectedAnswers: selectedOptionIds,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${apiUrl}/quiz/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedAnswers),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const heroProduct = sunglassesCatalog.find((p) => p.id === data.hero?.id) || sunglassesCatalog[0];
      const altProducts = (data.alternatives || [])
        .map((a: { id: string }) => sunglassesCatalog.find((p) => p.id === a.id))
        .filter((p: SunglassesProduct | undefined): p is SunglassesProduct => !!p && p.id !== heroProduct.id);

      return {
        hero: heroProduct,
        alternatives: altProducts.length > 0 ? altProducts : getFallbackAlternatives(heroProduct.id),
        why: data.why && data.why.length > 0 ? data.why : generateWhyBullets(heroProduct, answers),
        source: 'backend',
      };
    }
  } catch {
    // Backend offline or cold - proceed to client heuristic
  }

  // Client-side heuristic recommendation engine
  return computeClientRecommendation(answers);
}

function computeClientRecommendation(answers: Record<string, string[]>): RecommendationResult {
  const selectedOptions = new Set(Object.values(answers).flat());

  const scored = sunglassesCatalog.map((product) => {
    let score = 50; // base score

    // Width fit scoring
    if (selectedOptions.has('width_tight')) {
      if (product.frame_size === 'Wide' || product.frame_width_mm >= 144) score += 25;
      else if (product.frame_size === 'Narrow' || product.frame_width_mm <= 135) score -= 30;
    } else if (selectedOptions.has('width_loose')) {
      if (product.frame_size === 'Narrow' || product.frame_size === 'Narrow to Standard' || product.frame_width_mm <= 136) score += 25;
      else if (product.frame_size === 'Wide') score -= 30;
    }

    // Pain points scoring
    if (selectedOptions.has('pain_bridge_slip')) {
      if (product.bridge_architecture.toLowerCase().includes('silicone') || product.bridge_architecture.toLowerCase().includes('rubber')) score += 20;
    }
    if (selectedOptions.has('pain_pinch_marks') || selectedOptions.has('pain_temple_fatigue')) {
      if (product.weight_grams < 15.0) score += 25;
      else if (product.weight_grams > 30.0) score -= 15;
    }
    if (selectedOptions.has('pain_cheek_contact')) {
      if (product.solves_pain_points.some((p) => p.toLowerCase().includes('cheek'))) score += 20;
    }

    // Bridge ergonomics
    if (selectedOptions.has('bridge_silicone_pads') && product.bridge_architecture.toLowerCase().includes('silicone')) {
      score += 20;
    }
    if (selectedOptions.has('bridge_ultralight_rimless') && (product.weight_grams < 15 || product.frame_material.toLowerCase().includes('titanium'))) {
      score += 20;
    }

    // Environment & activities
    if (selectedOptions.has('env_driving_road') || selectedOptions.has('env_water_snow')) {
      if (product.lens_type.toLowerCase().includes('polarized')) score += 25;
    }
    if (selectedOptions.has('env_active_training')) {
      if (product.best_for_activities.some((a) => a.toLowerCase().includes('running') || a.toLowerCase().includes('cycling'))) score += 30;
    }

    // Lens privacy & aesthetic
    if (selectedOptions.has('tint_impenetrable_dark')) {
      if (product.lens_tint.toLowerCase().includes('black') || product.lens_tint.toLowerCase().includes('obsidian') || product.lens_tint.toLowerCase().includes('mirror')) score += 15;
    }
    if (selectedOptions.has('tint_gradient_luminous')) {
      if (product.lens_type.toLowerCase().includes('gradient') || product.lens_tint.toLowerCase().includes('gradient')) score += 20;
    }
    if (selectedOptions.has('tint_expressive_vintage')) {
      if (product.lens_tint.toLowerCase().includes('amber') || product.lens_tint.toLowerCase().includes('green')) score += 15;
    }

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const hero = scored[0].product;
  const alternatives = scored.slice(1, 4).map((s) => s.product);
  const why = generateWhyBullets(hero, answers);

  return {
    hero,
    alternatives,
    why,
    source: 'client_heuristic',
  };
}

function generateWhyBullets(product: SunglassesProduct, answers: Record<string, string[]>): string[] {
  const selectedOptions = new Set(Object.values(answers).flat());
  const bullets: string[] = [];

  if (selectedOptions.has('width_tight')) {
    bullets.push(`Generous ${product.frame_width_mm}mm frame width eliminates temple pinch and pressure indentations.`);
  } else if (selectedOptions.has('width_loose')) {
    bullets.push(`Calibrated ${product.frame_width_mm}mm profile ensures a flush, secure fit without sliding forward.`);
  } else {
    bullets.push(`Tailored ${product.frame_size.toLowerCase()} chassis engineered for balanced, all-day zygomatic comfort.`);
  }

  if (selectedOptions.has('pain_bridge_slip') || selectedOptions.has('bridge_silicone_pads')) {
    bullets.push(`Features ${product.bridge_architecture.toLowerCase()} that anchor firmly even in high heat.`);
  } else if (selectedOptions.has('pain_pinch_marks') || product.weight_grams < 20) {
    bullets.push(`Featherweight ${product.weight_grams}g build prevents nasal crest fatigue and red pressure marks.`);
  } else {
    bullets.push(`${product.frame_material} delivers enduring structural resilience.`);
  }

  if (selectedOptions.has('env_water_snow') || selectedOptions.has('env_driving_road')) {
    bullets.push(`${product.lens_type} eradicates blinding reflective surface glare on highways and water.`);
  } else {
    bullets.push(`${product.lens_tint} provides optimal optical clarity and UV400 sun protection.`);
  }

  return bullets.slice(0, 3);
}

function getFallbackAlternatives(excludeId: string): SunglassesProduct[] {
  return sunglassesCatalog.filter((p) => p.id !== excludeId).slice(0, 3);
}
