/**
 * Pure helpers for the active-filters block.
 *
 * Split out from view.js so they're directly testable: the view bundle
 * itself runs inside `@wordpress/interactivity` and is awkward to exercise
 * in Jest, but the label resolution logic is just data → string and
 * benefits from focused unit tests.
 */

import { formatDateBucketLabel } from '../../store/api';

/**
 * Look up the display label for a selected filter value via aggregation
 * buckets. Generic taxonomy / post-type / author filters store the *slug*
 * part of each selection; the matching aggregation bucket key is either
 * the slug itself (post types) or `slug/Name` (taxonomies, authors).
 *
 * If we find a matching bucket we return its display name; otherwise the
 * raw slug stays. Bucket counts can shift with every new query, and a
 * selected pill should not vanish just because its value fell out of the
 * top-N agg buckets.
 *
 * @param {object} state       - Store state slice (`{ aggregations }`).
 * @param {string} filterKey   - Filter key this value belongs to.
 * @param {string} filterValue - Selected slug.
 * @return {string} Display label.
 */
export function resolveBucketValueLabel( state, filterKey, filterValue ) {
	const buckets = state?.aggregations?.[ filterKey ]?.buckets;
	if ( Array.isArray( buckets ) ) {
		for ( const bucket of buckets ) {
			const key = String( bucket.key ?? '' );
			const slashIdx = key.indexOf( '/' );
			const slug = slashIdx === -1 ? key : key.slice( 0, slashIdx );
			if ( slug === filterValue ) {
				return slashIdx === -1 ? key : key.slice( slashIdx + 1 );
			}
		}
	}
	return filterValue;
}

/**
 * Resolve a display label for a filter value that needs type-specific formatting.
 *
 * For `date`, the raw bucket slug (`2024-01`) is formatted via
 * `formatDateBucketLabel` using the seeded `state.locale` and the
 * config's `interval` (year or month).
 * For `wc_stock_status`, the slug is looked up in
 * `state.wcStockStatusLabels`, seeded from the status block's option list.
 * For `wc_rating`, the value is formatted via three seeded templates —
 * `ratingStarsTop` for 5 (the row is "exactly 5 stars", no "& up"
 * affordance), and `ratingStarsAndUpSingle` / `…Plural` for the 1-4
 * threshold rows. The view bundle can't import `\@wordpress/i18n`, so
 * plural selection happens here with a `count === 1` test (degraded
 * plural for languages with >2 forms — accepted tradeoff). Anything
 * else returns null so the caller can fall back to the bucket-based
 * generic resolver.
 *
 * @param {object} state       - Store state slice.
 * @param {object} config      - FilterConfig entry (or undefined).
 * @param {string} filterValue - Selected raw value.
 * @return {string|null} Resolved label, or null when no product-specific resolution applies.
 */
export function resolveProductValueLabel( state, config, filterValue ) {
	const filterType = config?.filterType;
	if ( filterType === 'date' ) {
		const interval = config?.interval === 'month' ? 'month' : 'year';
		return formatDateBucketLabel( filterValue, interval, state?.locale ?? 'en-US' );
	}
	if ( filterType === 'wc_stock_status' ) {
		const labels = state?.wcStockStatusLabels ?? {};
		return labels[ filterValue ] ?? filterValue;
	}
	if ( filterType === 'wc_rating' ) {
		const stars = Number( filterValue );
		// Defensive: a malformed star value (NaN, out of range) falls
		// through to the raw slug; the chip still renders rather than
		// silently disappearing.
		if ( ! Number.isFinite( stars ) || stars < 1 || stars > 5 ) {
			return filterValue;
		}
		if ( stars === 5 ) {
			return state?.strings?.ratingStarsTop ?? '5 stars';
		}
		const template =
			stars === 1
				? state?.strings?.ratingStarsAndUpSingle ?? '%d star and up'
				: state?.strings?.ratingStarsAndUpPlural ?? '%d stars and up';
		return template.replace( '%d', String( stars ) );
	}
	return null;
}

/**
 * Format the current price range as a chip label.
 *
 * Picks one of three templates by which bound(s) are set:
 * - both: "$10 – $50"
 * - min only: "$10+"   (compact "and above" form — common across mainstream e-commerce filters)
 * - max only: "Under $50"   (mirrors Amazon / eBay / Walmart's max-only convention)
 *
 * Currency symbol comes from `state.priceCurrencySymbol` (seeded by the
 * price block's render.php from its currencySymbol attribute, falling back
 * to "$" when no price block is on the page). The numeric value is rendered
 * raw — locale-specific formatting would require Intl.NumberFormat per
 * currency code, which v1 doesn't carry. Leaving the symbol-only convention
 * matches the price input's own non-formatting display.
 *
 * @param {object}                               state - Store state slice.
 * @param {{min: number|null, max: number|null}} range - Active price range.
 * @return {string} Chip label without the leading group prefix; empty string when both bounds are null.
 */
export function formatPriceRangeChip( state, range ) {
	const symbol = state?.priceCurrencySymbol ?? '$';
	const min = range?.min;
	const max = range?.max;
	const hasMin = min !== null && min !== undefined;
	const hasMax = max !== null && max !== undefined;
	if ( hasMin && hasMax ) {
		const template = state?.strings?.priceRangeFromTo ?? '%1$s – %2$s';
		return template
			.replace( '%1$s', `${ symbol }${ min }` )
			.replace( '%2$s', `${ symbol }${ max }` );
	}
	if ( hasMin ) {
		const template = state?.strings?.priceRangeFrom ?? '%s+';
		return template.replace( '%s', `${ symbol }${ min }` );
	}
	if ( hasMax ) {
		const template = state?.strings?.priceRangeUpTo ?? 'Under %s';
		return template.replace( '%s', `${ symbol }${ max }` );
	}
	return '';
}

/**
 * Build the pill descriptor list for the active-filters block from the
 * current store state. Splits the `kind: 'filter'` pills (one per selected
 * value across every filterKey) and the single `kind: 'priceRange'` pill
 * appended at the end when a price range is active.
 *
 * Pulled out of view.js so the iteration order, label composition, and
 * remove dispatch shape are unit-testable without an Interactivity API
 * runtime.
 *
 * @param {object} state - Store state slice with `activeFilters`,
 *                       `filterConfigs`, `aggregations`, `priceRange`,
 *                       `strings`, `wcStockStatusLabels`,
 *                       `priceCurrencySymbol`.
 * @return {Array<object>} Pill descriptors.
 */
export function buildActivePills( state ) {
	const removeFormat = state?.strings?.removeFilter ?? 'Remove %s';
	const pills = [];

	for ( const [ filterKey, values ] of Object.entries( state?.activeFilters ?? {} ) ) {
		if ( ! Array.isArray( values ) ) {
			continue;
		}
		const config = state?.filterConfigs?.[ filterKey ];
		const groupLabel = config?.label ?? filterKey;
		for ( const value of values ) {
			const productLabel = resolveProductValueLabel( state, config, value );
			// `valueLabels` is an explicit per-value override authored by the
			// block (e.g. filter-post-type seeds human-readable names for each
			// registered post type). It wins over both product resolution and
			// bucket-derived labels.
			const explicitLabel = config?.valueLabels?.[ value ];
			let valueLabel;
			if ( explicitLabel !== undefined ) {
				valueLabel = explicitLabel;
			} else if ( productLabel !== null ) {
				valueLabel = productLabel;
			} else {
				valueLabel = resolveBucketValueLabel( state, filterKey, value );
			}
			const label = `${ groupLabel }: ${ valueLabel }`;
			pills.push( {
				id: `${ filterKey }:${ value }`,
				kind: 'filter',
				filterKey,
				value,
				label,
				ariaLabel: removeFormat.replace( '%s', label ),
			} );
		}
	}

	const range = state?.priceRange;
	if ( range && ( range.min !== null || range.max !== null ) ) {
		const valueLabel = formatPriceRangeChip( state, range );
		if ( valueLabel ) {
			const groupLabel = state?.strings?.priceLabel ?? 'Price';
			const label = `${ groupLabel }: ${ valueLabel }`;
			pills.push( {
				id: `priceRange:${ range.min ?? '' }:${ range.max ?? '' }`,
				kind: 'priceRange',
				filterKey: '',
				value: '',
				label,
				ariaLabel: removeFormat.replace( '%s', label ),
			} );
		}
	}

	return pills;
}
