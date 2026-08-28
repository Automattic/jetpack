import { useQuery } from '@tanstack/react-query';
import { fetchStorageAddonOffer } from '../data/api/storage-addon-offer';
import { keys } from '../data/query-client';

/**
 * Add-on prices move on a catalogue's schedule, not a session's. Matches
 * `use-promoted-product.ts`.
 */
const STORAGE_ADDON_OFFER_STALE_MS = 60 * 60_000;

type Result = {
	/**
	 * The product slug to send to checkout, or null. Callers must not build a checkout
	 * URL without it — legacy does, and the path carries a literal `null`.
	 */
	slug: string | null;
	/** The add-on's size as WordPress.com words it, e.g. `100GB`. */
	sizeText: string | null;
	/** One month of the add-on: the introductory price if one is running, else full. */
	monthlyPrice: number | null;
	/**
	 * The currency WordPress.com priced this in. No default — assuming one mislabels
	 * every non-USD site.
	 */
	currencyCode: string | null;
};

const EMPTY: Result = { slug: null, sizeText: null, monthlyPrice: null, currencyCode: null };

/**
 * React Query hook exposing the storage add-on being offered.
 *
 * Shared by both consumers in the storage section — the upsell needs the size and
 * price, the popover needs the slug. Legacy leaves that to chance: only its upsell
 * fetches, so its popover's link is built from a `null` default on every site.
 *
 * Deliberately not gated on `useCanQueryWpcom()`: the route only checks
 * `manage_options`. The `enabled` flag below is what keeps it from firing early, since
 * both byte figures come from routes that *are* gated.
 *
 * @param storageUsed  - Bytes of backup storage in use, or null if unknown.
 * @param storageLimit - The plan's storage limit in bytes, or null if unknown.
 * @return The offer, or nulls throughout.
 */
export function useStorageAddonOffer(
	storageUsed: number | null,
	storageLimit: number | null
): Result {
	// Both, not either: a request carrying one figure earns a 400 or, worse, a
	// confidently wrong add-on. See `storage-addon-offer.ts`.
	const enabled = storageUsed !== null && storageLimit !== null;

	const query = useQuery( {
		queryKey: keys.storageAddonOffer( storageUsed, storageLimit ),
		// The assertions are what `enabled` guarantees, and deliberately not
		// backstopped by a runtime check: a guard here would trade a silent-wrong for
		// a silent-nothing, and would make "asks for nothing until both figures are
		// known" pass however the gate is written, since it counts requests.
		queryFn: () => fetchStorageAddonOffer( storageUsed as number, storageLimit as number ),
		enabled,
		staleTime: STORAGE_ADDON_OFFER_STALE_MS,
		// Overrides the client's `retry: 1`: the route's own work is an uncached,
		// blocking hop from the site to WordPress.com's catalogue, and both consumers
		// render without the figure anyway.
		retry: false,
	} );

	const offer = query.data;
	const slug = typeof offer?.slug === 'string' ? offer.slug : null;
	const sizeText = typeof offer?.size_text === 'string' ? offer.size_text : null;

	const pricing = offer?.pricing;
	const fullPrice = typeof pricing?.full_price === 'number' ? pricing.full_price : null;
	const discountPrice = typeof pricing?.discount_price === 'number' ? pricing.discount_price : null;
	const currencyCode = typeof pricing?.currency_code === 'string' ? pricing.currency_code : null;

	// Both halves or neither: an amount cannot be formatted without a currency, and
	// this catalogue's varies by site rather than being implicitly USD.
	if ( ! slug || ! sizeText || fullPrice === null || ! currencyCode ) {
		return { ...EMPTY, slug, sizeText };
	}

	// The lower of the two, and only one is ever rendered. Compared as numbers rather
	// than rendered strings, unlike `gates/promoted-price.tsx` — that rule exists to
	// stop a strikethrough showing the same amount twice, and there is no strikethrough
	// here. Anyone adding one must switch this to the rendered form.
	const monthlyPrice =
		discountPrice !== null && discountPrice > 0 && discountPrice < fullPrice
			? discountPrice
			: fullPrice;

	return { slug, sizeText, monthlyPrice, currencyCode };
}
