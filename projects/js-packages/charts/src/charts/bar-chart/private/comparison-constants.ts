// Shared comparison-mode tuning constants. These drive the geometry of the
// translucent "shadow" bars and how the primary bars are narrowed to sit in front of them.

/**
 * How much wider the comparison shadow is than the primary bar. Fallback used when the
 * theme value (`barChart.barStyles.comparison.widthFactor`) is absent. Also drives the
 * primary narrowing — the primary stays `1 / widthFactor` of the shadow.
 */
export const DEFAULT_COMPARISON_WIDTH_FACTOR = 1.5;

/**
 * Opacity of the comparison shadow. Fallback used when the theme value
 * (`barChart.barStyles.comparison.opacity`) is absent.
 */
export const DEFAULT_COMPARISON_OPACITY = 0.5;

/**
 * Fraction of each per-series step left as a gap between bars within a single tick.
 * Larger = more space between adjacent series; the shadow spans `1 - COMPARISON_INNER_GAP` of the step.
 */
export const COMPARISON_INNER_GAP = 0.1;

/**
 * Upper clamp on the computed group padding, so bars can never collapse to zero width
 * even at very large `widthFactor` values.
 */
export const MAX_GROUP_PADDING = 0.9;

/**
 * Factor applied to the category band's `paddingInner` in comparison mode to tighten the
 * gap between ticks. `0.75` = a 25% reduction of the tick-gap padding.
 */
export const COMPARISON_TICK_GAP_FACTOR = 0.75;
