/**
 * Pure helpers for the active-filters block. Split from view.js for Jest
 * — view bundles run inside `@wordpress/interactivity` and are awkward to test.
 */

import { formatDateBucketLabel } from '../../store/api';

/**
 * Bucket-based label lookup for a selected filter value. Buckets are either
 * bare slugs (post_type) or `slug/Name` (taxonomy, author). Falls back to
 * the raw slug so selected pills don't vanish when the value drops from agg buckets.
 *
 * @param {object} state       - Store state.
 * @param {string} filterKey   - Filter key.
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
 * Type-specific label resolution. Returns null when no product-specific
 * resolution applies (caller falls back to `resolveBucketValueLabel`).
 *
 * date: `formatDateBucketLabel` with seeded `state.locale` + interval.
 * wc_stock_status: lookup in `state.wcStockStatusLabels`.
 * wc_rating: seeded templates (`ratingStarsTop` for 5★; `…AndUpSingle/Plural`
 * for 1-4★). View bundles can't import `@wordpress/i18n`, so plural picks
 * via `count === 1` (degraded for >2-form languages — accepted tradeoff).
 *
 * @param {object} state       - Store state.
 * @param {object} config      - FilterConfig entry.
 * @param {string} filterValue - Selected raw value.
 * @return {string|null} Resolved label, or null for non-product types.
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
		// Malformed → raw slug; chip stays rather than disappearing.
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
 * Price-range chip label. Three templates by bounds:
 * both → "$10 – $50"; min-only → "$10+"; max-only → "Under $50"
 * (Amazon/eBay/Walmart convention). Symbol from `state.priceCurrencySymbol`.
 *
 * @param {object}                               state - Store state.
 * @param {{min: number|null, max: number|null}} range - Active price range.
 * @return {string} Empty when both bounds null.
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
 * Pill descriptors for the active-filters block. `kind: 'filter'` per
 * selected value, plus a `kind: 'priceRange'` pill when a price range is active.
 *
 * @param {object} state - Store state.
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
			// Explicit `valueLabels` override (set on a filter's filterConfig)
			// wins over product resolution and bucket-derived labels.
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
