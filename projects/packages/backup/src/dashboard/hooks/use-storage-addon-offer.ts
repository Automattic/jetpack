import { useQuery } from '@tanstack/react-query';
import { fetchStorageAddonOffer } from '../data/api/storage-addon-offer';
import { keys } from '../data/query-client';

/**
 * Add-on prices move on a catalogue's schedule, not a session's. An hour
 * matches `use-promoted-product.ts`, for the same reason: opening the
 * screen twice costs one request, and a price change still reaches a tab
 * left open all day.
 */
const STORAGE_ADDON_OFFER_STALE_MS = 60 * 60_000;

type Result = {
	/**
	 * The WordPress.com product slug to send to checkout, or null when no
	 * offer could be read. Callers must not build a checkout URL without
	 * it — legacy does, and the resulting path carries the literal string
	 * `null` where the product should be.
	 */
	slug: string | null;
	/** The add-on's size as WordPress.com words it, e.g. `100GB`. */
	sizeText: string | null;
	/**
	 * One month of the add-on, in `currencyCode`. The introductory price
	 * when one is running, the full price otherwise.
	 */
	monthlyPrice: number | null;
	/**
	 * The currency WordPress.com priced this in. Null whenever
	 * `monthlyPrice` is null; there is no default, and assuming one would
	 * mislabel every non-USD site.
	 */
	currencyCode: string | null;
};

const EMPTY: Result = { slug: null, sizeText: null, monthlyPrice: null, currencyCode: null };

/**
 * React Query hook exposing the storage add-on being offered.
 *
 * Both consumers live inside the storage section, and neither can render
 * anything useful before it: the upsell needs the size and the price for
 * its copy, and the help popover needs the slug for its checkout link.
 * Sharing one hook is what makes that dependency explicit. Legacy leaves
 * it to chance — only its upsell fetches, only at a usage level where its
 * popover does not render, so the popover's link is built from the
 * store's `null` default on every site.
 *
 * Deliberately not gated on `useCanQueryWpcom()`, like
 * `use-promoted-product.ts` and unlike the rest of this dashboard. The
 * route's permission callback is `current_user_can( 'manage_options' )`
 * and nothing more, so the site's WordPress.com user connection is not a
 * precondition. What keeps this from firing behind the connection gate is
 * the `enabled` flag below: both byte figures come from routes that *are*
 * gated, so neither is known until the connection is.
 *
 * @param storageUsed  - Bytes of backup storage in use, or null if unknown.
 * @param storageLimit - The plan's storage limit in bytes, or null if unknown.
 * @return The offer, or nulls throughout.
 */
export function useStorageAddonOffer(
	storageUsed: number | null,
	storageLimit: number | null
): Result {
	// Both, not either. A request carrying one figure is not a partial
	// answer: dropped, the missing arg earns a 400; sent empty, it earns
	// something worse — a confidently wrong add-on, because the route's
	// `'type' => 'numeric'` validates nothing. `storage-addon-offer.ts`
	// has the details.
	const enabled = storageUsed !== null && storageLimit !== null;

	const query = useQuery( {
		queryKey: keys.storageAddonOffer( storageUsed, storageLimit ),
		// The two assertions are exactly what `enabled` guarantees: React
		// Query does not call this while the flag is false.
		//
		// Deliberately not a second runtime check. One would answer `null`
		// for a request that should never have been attempted, which turns
		// a gate that has drifted into silence — and silence is the one
		// outcome from which nobody learns the gate is wrong. The route's
		// refusal is the signal, so let it happen.
		queryFn: () => fetchStorageAddonOffer( storageUsed as number, storageLimit as number ),
		enabled,
		staleTime: STORAGE_ADDON_OFFER_STALE_MS,
		// Overrides the client's `retry: 1`, for the reason
		// `use-promoted-product.ts` spells out: the route's own work is an
		// uncached, blocking request from the *site* to WordPress.com's
		// product catalogue, so a retry doubles the expensive hop rather
		// than the cheap one, to buy a figure both consumers are built to
		// render without.
		retry: false,
	} );

	const offer = query.data;
	const slug = typeof offer?.slug === 'string' ? offer.slug : null;
	const sizeText = typeof offer?.size_text === 'string' ? offer.size_text : null;

	const pricing = offer?.pricing;
	const fullPrice = typeof pricing?.full_price === 'number' ? pricing.full_price : null;
	const discountPrice = typeof pricing?.discount_price === 'number' ? pricing.discount_price : null;
	const currencyCode = typeof pricing?.currency_code === 'string' ? pricing.currency_code : null;

	// Both halves or neither: an amount cannot be formatted without a
	// currency, and this catalogue's currency varies by site rather than
	// being implicitly USD.
	if ( ! slug || ! sizeText || fullPrice === null || ! currencyCode ) {
		return { ...EMPTY, slug, sizeText };
	}

	// The lower of the two, and only one of them is ever rendered. The
	// helper seeds `discount_price` with the full cost and overwrites it
	// only from a live introductory offer, so the two are usually equal;
	// the comparison is what stops a catalogue quirk from quoting the
	// higher figure.
	//
	// No struck-through original accompanies it, which is why this
	// compares numbers where `gates/promoted-price.tsx` compares rendered
	// strings. That rule exists to stop a strikethrough showing the same
	// amount twice — two prices differing below the currency's precision
	// format identically. With a single figure on screen there is nothing
	// to strike through and nothing to contradict; anyone adding one here
	// must switch this comparison to the rendered form.
	const monthlyPrice =
		discountPrice !== null && discountPrice > 0 && discountPrice < fullPrice
			? discountPrice
			: fullPrice;

	return { slug, sizeText, monthlyPrice, currencyCode };
}
