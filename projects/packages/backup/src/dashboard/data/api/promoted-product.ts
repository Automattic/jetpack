import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/backup-promoted-product-info`.
 *
 * One entry from WordPress.com's public product catalogue, forwarded
 * verbatim. Two things about it are easy to assume wrongly:
 *
 * `cost` is the price of a full term, and the promoted product is a
 * yearly one — so it is roughly twelve times the figure this screen
 * shows.
 *
 * `currency_code` is chosen by WordPress.com from where the *site*
 * appears to be, not from the reader's locale or any site setting, so
 * neither the currency nor the magnitude of the amount can be assumed.
 * Nothing here may be formatted with a hardcoded symbol.
 *
 * Fields are optional because a 200 does not promise a priced entry.
 * The route refuses the two shapes that used to be fatal — an
 * undecodable body, and the promoted slug missing from the catalogue —
 * but not an entry that carries no price.
 */
export type RawPromotedProduct = {
	cost?: number;
	currency_code?: string;
	introductory_offer?: {
		cost_per_interval?: number;
		interval_unit?: string;
		interval_count?: number;
	} | null;
} | null;

/**
 * Fetch the Backup product currently being promoted.
 *
 * @return The catalogue entry, or `null` when it could not be read.
 */
export async function fetchPromotedProduct(): Promise< RawPromotedProduct > {
	return apiCall< RawPromotedProduct >( { path: apiPath( '/backup-promoted-product-info' ) } );
}
