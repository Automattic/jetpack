import { useQuery } from '@tanstack/react-query';
import { fetchPromotedProduct } from '../data/api/promoted-product';
import { keys } from '../data/query-client';

/**
 * Prices move on a catalogue's schedule, not a session's. An hour is
 * long enough that opening the screen twice costs one request, and
 * short enough that a price change reaches a tab left open all day.
 */
const PROMOTED_PRODUCT_STALE_MS = 60 * 60_000;

const MONTHS_PER_YEAR = 12;

type Result = {
	/**
	 * The full monthly price, or null when no price could be read.
	 * Callers must treat null as "render no price", never as free.
	 */
	monthlyPrice: number | null;
	/**
	 * The monthly price while an introductory offer is running, or null
	 * when there is no offer — or when its interval is one this cannot
	 * convert to months.
	 */
	introMonthlyPrice: number | null;
	/**
	 * The currency WordPress.com priced this in. Null whenever
	 * `monthlyPrice` is null; there is no default, and assuming one
	 * would mislabel every non-USD site.
	 */
	currencyCode: string | null;
};

const EMPTY: Result = { monthlyPrice: null, introMonthlyPrice: null, currencyCode: null };

/**
 * Months covered by one interval of an introductory offer.
 *
 * The legacy screen divides `cost_per_interval` by 12 unconditionally,
 * which is right only while the offer's interval is a single year — the
 * shape the catalogue happens to ship today. A monthly offer would
 * render at a twelfth of what it costs.
 *
 * An unrecognized unit returns null so the caller shows no introductory
 * price at all. The full price still renders, which is the accurate
 * half; a wrong discount is worse than a missing one.
 *
 * @param unit  - The offer's interval unit.
 * @param count - How many of those units one interval spans.
 * @return Months per interval, or null if the unit is not understood.
 */
function intervalMonths( unit?: string, count?: number ): number | null {
	const intervals = typeof count === 'number' && count > 0 ? count : 1;

	if ( unit === 'year' ) {
		return intervals * MONTHS_PER_YEAR;
	}

	if ( unit === 'month' ) {
		return intervals;
	}

	return null;
}

/**
 * React Query hook exposing the promoted Backup product's monthly price.
 *
 * Deliberately not gated on `useCanQueryWpcom()`, unlike every other
 * hook here. The route it reads is an unauthenticated `wp_remote_get`
 * against the public product catalogue — it needs `manage_options` and
 * nothing else, so gating it on the site's WordPress.com connection
 * would copy a constraint that does not apply to it.
 *
 * Its one caller is the no-plan screen, which mounts only for a site
 * that has no Backup plan. That is what keeps this from becoming
 * another request issued behind the gate: the query cannot start
 * anywhere the reader could not act on the answer.
 *
 * @return The monthly prices and their currency, or nulls throughout.
 */
export function usePromotedProduct(): Result {
	const query = useQuery( {
		queryKey: keys.promotedProduct(),
		queryFn: fetchPromotedProduct,
		staleTime: PROMOTED_PRODUCT_STALE_MS,
		// Overrides the client's `retry: 1`: a retry only ever follows a
		// failure, and failures are not cached, so it always costs the site
		// a live blocking request to WordPress.com for a figure the screen
		// is designed to work without.
		retry: false,
	} );

	const product = query.data;
	const cost = typeof product?.cost === 'number' ? product.cost : null;
	const currencyCode = typeof product?.currency_code === 'string' ? product.currency_code : null;

	// Both halves or neither: an amount cannot be formatted without a
	// currency, and this catalogue's currency varies by site rather than
	// being implicitly USD.
	if ( cost === null || ! currencyCode ) {
		return EMPTY;
	}

	const monthlyPrice = cost / MONTHS_PER_YEAR;

	const offer = product?.introductory_offer;
	const offerCost = typeof offer?.cost_per_interval === 'number' ? offer.cost_per_interval : null;
	const months = offer ? intervalMonths( offer.interval_unit, offer.interval_count ) : null;

	const introMonthlyPrice = offerCost !== null && months !== null ? offerCost / months : null;

	return { monthlyPrice, introMonthlyPrice, currencyCode };
}
