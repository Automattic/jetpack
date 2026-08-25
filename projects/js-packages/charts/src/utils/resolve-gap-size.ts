import type { GapSize } from '../types';

/**
 * The WPDS gap ramp, written out rather than interpolated so
 * `src/styles/test/wpds-fallbacks.test.ts` can check each fallback against the
 * installed design system.
 */
const GAP_SIZE_TOKENS: Record< GapSize, string > = {
	xs: 'var(--wpds-dimension-gap-xs, 4px)',
	sm: 'var(--wpds-dimension-gap-sm, 8px)',
	md: 'var(--wpds-dimension-gap-md, 12px)',
	lg: 'var(--wpds-dimension-gap-lg, 16px)',
	xl: 'var(--wpds-dimension-gap-xl, 24px)',
	'2xl': 'var(--wpds-dimension-gap-2xl, 32px)',
	'3xl': 'var(--wpds-dimension-gap-3xl, 40px)',
};

/**
 * Resolve a gap a theme may express either on the WPDS scale or as raw pixels.
 *
 * @param gap - A `GapSize` step, a pixel number, or nothing.
 * @return The token for a scale step, the number untouched, or undefined.
 */
export function resolveGapSize( gap: number | GapSize | undefined ): string | number | undefined {
	return typeof gap === 'string' ? GAP_SIZE_TOKENS[ gap ] : gap;
}
