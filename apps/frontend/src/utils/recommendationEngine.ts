import { sunglassesCatalog, type SunglassesProduct } from '../data/sunglassesCatalog';
import { fetchRecommendation } from '../api/quizApi';
import type { AnsweredQuestionDto } from '../types/quiz';

/** Everything the user picked, lowercased, for keyword matching in the fallback. */
const selectedText = (history: AnsweredQuestionDto[]) =>
  history.flatMap((h) => h.selectedAnswers).join(' | ').toLowerCase();

export interface RecommendationResult {
  hero: SunglassesProduct;
  alternatives: SunglassesProduct[];
  why: string[];
  source: 'backend' | 'client_heuristic';
}

/**
 * Asks the backend to pick a product from the answer history. Falls back to a
 * local keyword heuristic when the service is unreachable, so a demo survives
 * a cold start or an agent hiccup.
 */
export async function computeRecommendation(
  history: AnsweredQuestionDto[]
): Promise<RecommendationResult> {
  try {
    const data = await fetchRecommendation(history);
    const matchProduct = (id?: string) => {
      if (!id) return null;
      return sunglassesCatalog.find(
        (p) => p.id === id || p.id.includes(id) || id.includes(p.id)
      ) ?? null;
    };

    const hero = matchProduct(data.hero?.id) ?? sunglassesCatalog[0];
    const alternatives = (data.alternatives ?? [])
      .map((a) => matchProduct(a?.id))
      .filter((p): p is SunglassesProduct => !!p && p.id !== hero.id);

    return {
      hero,
      alternatives: alternatives.length > 0 ? alternatives : getFallbackAlternatives(hero.id),
      why: data.why?.length ? data.why : generateWhyBullets(hero, history),
      source: 'backend',
    };
  } catch {
    return computeClientRecommendation(history);
  }
}

function computeClientRecommendation(history: AnsweredQuestionDto[]): RecommendationResult {
  const picked = selectedText(history);
  const said = (...needles: string[]) => needles.some((n) => picked.includes(n));

  const scored = sunglassesCatalog.map((product) => {
    let score = 50; // base score

    // Width fit scoring
    if (said('pinch my temples', 'too tight')) {
      if (product.frame_size === 'Wide' || product.frame_width_mm >= 144) score += 25;
      else if (product.frame_size === 'Narrow' || product.frame_width_mm <= 135) score -= 30;
    } else if (said('too wide', 'slide or look oversized')) {
      if (product.frame_size === 'Narrow' || product.frame_size === 'Narrow to Standard' || product.frame_width_mm <= 136) score += 25;
      else if (product.frame_size === 'Wide') score -= 30;
    }

    // Pain points scoring
    if (said('slide down my nose')) {
      if (product.bridge_architecture.toLowerCase().includes('silicone') || product.bridge_architecture.toLowerCase().includes('rubber')) score += 20;
    }
    if (said('red pinch marks', 'behind my ears', 'featherlight')) {
      if (product.weight_grams < 15.0) score += 25;
      else if (product.weight_grams > 30.0) score -= 15;
    }
    if (said('touch your cheeks', 'lift off my nose')) {
      if (product.solves_pain_points.some((p) => p.toLowerCase().includes('cheek'))) score += 20;
    }

    // Bridge ergonomics
    if (said('slide down my nose') && product.bridge_architecture.toLowerCase().includes('silicone')) {
      score += 20;
    }
    if (said('featherlight') && (product.weight_grams < 15 || product.frame_material.toLowerCase().includes('titanium'))) {
      score += 20;
    }

    // Environment & activities
    if (said('driving and road trips', 'water, beach, boating, snow')) {
      if (product.lens_type.toLowerCase().includes('polarized')) score += 25;
    }
    if (said('running, cycling, training')) {
      if (product.best_for_activities.some((a) => a.toLowerCase().includes('running') || a.toLowerCase().includes('cycling'))) score += 30;
    }

    // Lens privacy & aesthetic
    if (said('fully dark')) {
      if (product.lens_tint.toLowerCase().includes('black') || product.lens_tint.toLowerCase().includes('obsidian') || product.lens_tint.toLowerCase().includes('mirror')) score += 15;
    }
    if (said('lighter gradient')) {
      if (product.lens_type.toLowerCase().includes('gradient') || product.lens_tint.toLowerCase().includes('gradient')) score += 20;
    }
    if (said('tinted and expressive')) {
      if (product.lens_tint.toLowerCase().includes('amber') || product.lens_tint.toLowerCase().includes('green')) score += 15;
    }

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const hero = scored[0].product;
  const alternatives = scored.slice(1, 4).map((s) => s.product);
  const why = generateWhyBullets(hero, history);

  return {
    hero,
    alternatives,
    why,
    source: 'client_heuristic',
  };
}

function generateWhyBullets(product: SunglassesProduct, history: AnsweredQuestionDto[]): string[] {
  const picked = selectedText(history);
  const said = (...needles: string[]) => needles.some((n) => picked.includes(n));
  const bullets: string[] = [];

  if (said('pinch my temples', 'too tight')) {
    bullets.push(`Generous ${product.frame_width_mm}mm frame width eliminates temple pinch and pressure indentations.`);
  } else if (said('too wide', 'slide or look oversized')) {
    bullets.push(`Calibrated ${product.frame_width_mm}mm profile ensures a flush, secure fit without sliding forward.`);
  } else {
    bullets.push(`Tailored ${product.frame_size.toLowerCase()} chassis engineered for balanced, all-day zygomatic comfort.`);
  }

  if (said('slide down my nose') || said('slide down my nose')) {
    bullets.push(`Features ${product.bridge_architecture.toLowerCase()} that anchor firmly even in high heat.`);
  } else if (said('red pinch marks') || product.weight_grams < 20) {
    bullets.push(`Featherweight ${product.weight_grams}g build prevents nasal crest fatigue and red pressure marks.`);
  } else {
    bullets.push(`${product.frame_material} delivers enduring structural resilience.`);
  }

  if (said('water, beach, boating, snow', 'driving and road trips')) {
    bullets.push(`${product.lens_type} eradicates blinding reflective surface glare on highways and water.`);
  } else {
    bullets.push(`${product.lens_tint} provides optimal optical clarity and UV400 sun protection.`);
  }

  return bullets.slice(0, 3);
}

function getFallbackAlternatives(excludeId: string): SunglassesProduct[] {
  return sunglassesCatalog.filter((p) => p.id !== excludeId).slice(0, 3);
}
