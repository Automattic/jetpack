import { apiCall, apiPath } from './_helpers';

/**
 * The pricing block `Wpcom_Products::get_product_pricing()` builds.
 *
 * Only the three fields this dashboard reads are declared.
 *
 * `currency_code` is snake_case, and that matters: legacy reads `currencyCode` off this
 * same object, gets `undefined`, and `getCurrencyObject` falls back to a `$`. This
 * catalogue is priced from where the *site* appears to be, so nothing may assume USD.
 */
type RawAddonPricing = {
	currency_code?: string;
	/** One month of the add-on, in `currency_code`. See `fetchStorageAddonOffer`. */
	full_price?: number;
	/**
	 * The introductory price when one is running, and `full_price` otherwise.
	 */
	discount_price?: number;
};

/**
 * Response of `GET /jetpack/v4/site/backup/addon-offer`.
 *
 * Every field is optional because a 200 does not promise a priced answer. `pricing` in
 * particular is `array()` on the PHP side when the slug is missing from the catalogue,
 * which serializes as a JSON `[]` — truthy in JavaScript, which is why legacy's
 * `res.slug && res.pricing && res.size_text` guard does not catch it.
 */
export type RawStorageAddonOffer = {
	slug?: string;
	size_text?: string;
	pricing?: RawAddonPricing | null;
} | null;

/**
 * Fetch the storage add-on WordPress.com would sell this site next.
 *
 * Both figures are `required` query args, and the caller must know both before asking.
 * Omitting one earns a 400; sending one *empty* earns something worse — `required` is
 * satisfied by a param that is merely set, and the route's declared `'type' => 'numeric'`
 * is not a WordPress schema type, so it validates nothing and the route answers with the
 * smallest add-on. `apiPath` drops an `undefined` arg and forwards a `null` one empty,
 * so the two mistakes land on opposite sides of that.
 *
 * The three slugs this can return are all `…_monthly`, so `full_price` is already a
 * monthly figure and needs no term conversion.
 *
 * @param storageUsed  - Bytes of backup storage in use.
 * @param storageLimit - The plan's storage limit in bytes.
 * @return WordPress.com's payload, or `null` when it could not be read.
 */
export async function fetchStorageAddonOffer(
	storageUsed: number,
	storageLimit: number
): Promise< RawStorageAddonOffer > {
	return apiCall< RawStorageAddonOffer >( {
		path: apiPath( '/site/backup/addon-offer', {
			storage_size: storageUsed,
			storage_limit: storageLimit,
		} ),
	} );
}
