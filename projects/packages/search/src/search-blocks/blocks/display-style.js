/**
 * Shared `displayStyle` helpers for the bucket-driven filter blocks
 * (`filter-checkbox`, `filter-date`, `filter-wc-attribute`). JS-side
 * mirror of `Search_Blocks::normalize_display_style()` (PHP) so editor
 * previews and server-rendered output never disagree on what counts as
 * a valid variant.
 *
 * `filter-wc-stock-status` and `filter-wc-rating` deliberately don't
 * ship a chip variant today — single-option vs. star-row + suffix
 * shapes don't translate cleanly into a pill toggle. The helper is
 * ready for them to opt in later.
 */

/**
 * Coerce a saved `displayStyle` value to the supported enum. Anything that
 * isn't the literal string `'chips'` collapses to `'checkbox-list'`, so
 * legacy saves (missing attribute, `null`, unknown future variants) keep
 * rendering as the default rather than dropping out entirely.
 *
 * @param {unknown} value - Raw attribute value off `attributes.displayStyle`.
 * @return {'checkbox-list' | 'chips'} Normalized variant.
 */
export function normalizeDisplayStyle( value ) {
	return value === 'chips' ? 'chips' : 'checkbox-list';
}
