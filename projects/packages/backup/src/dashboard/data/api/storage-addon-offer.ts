import { apiCall, apiPath } from './_helpers';

/**
 * The pricing block `Wpcom_Products::get_product_pricing()` builds.
 *
 * Only the three fields this dashboard reads are declared. The helper
 * returns several more — `is_introductory_offer`, `introductory_offer`,
 * `product_term`, and a `coupon_discount` when a sale coupon is live —
 * none of which are needed to render one monthly figure.
 *
 * `currency_code` is snake_case, and that matters more than it looks.
 * Legacy's upsell reads `addonPricing.currencyCode` off this same
 * object, gets `undefined`, and hands it to `getCurrencyObject`, which
 * falls back to a `$` symbol: verified against the installed
 * `@automattic/number-formatters`, where `getCurrencyObject( 9.95,
 * undefined )` returns `symbol: '$'`. WordPress.com prices this
 * catalogue from where the *site* appears to be, so a Brazilian site is
 * quoted in BRL and shown a dollar sign. Nothing here may assume a
 * currency.
 */
type RawAddonPricing = {
	currency_code?: string;
	/** One month of the add-on, in `currency_code`. See `fetchStorageAddonOffer`. */
	full_price?: number;
	/**
	 * The introductory price, when one is running. Equal to `full_price`
	 * otherwise — the helper seeds it with the full cost and only
	 * overwrites it from `introductory_offer.cost_per_interval`.
	 */
	discount_price?: number;
};

/**
 * Response of `GET /jetpack/v4/site/backup/addon-offer`.
 *
 * `Jetpack_Backup::get_storage_addon_upsell_slug()` picks the add-on
 * that would cover this site's overage, and `size_text` is that slug's
 * entry in a three-key map — so the two arrive together or not at all.
 *
 * Every field is optional because a 200 does not promise a priced
 * answer. `pricing` in particular is `array()` on the PHP side when the
 * slug is missing from the catalogue, which serializes as a JSON `[]`
 * rather than an object; reads below go through optional chaining, so
 * that case yields `undefined` for each field instead of throwing.
 * Legacy's `res.slug && res.pricing && res.size_text` guard does *not*
 * catch it — `[]` is truthy in JavaScript.
 */
export type RawStorageAddonOffer = {
	slug?: string;
	size_text?: string;
	pricing?: RawAddonPricing | null;
} | null;

/**
 * Fetch the storage add-on WordPress.com would sell this site next.
 *
 * Both figures are query args and both are `'required' => true` on the
 * route (`class-jetpack-backup.php`, the `/site/backup/addon-offer`
 * registration), which is why the caller must know both before asking.
 *
 * The two ways of getting that wrong fail differently, and the quieter
 * one is the reason the caller gates rather than trusting the route.
 * Omit an arg and `WP_REST_Request::has_valid_params()` refuses the
 * request with a 400 `rest_missing_callback_param`. Send it *empty* and
 * nothing objects: `required` is satisfied by a param that is merely
 * set, and the declared `'type' => 'numeric'` checks nothing at all —
 * it is not one of WordPress's seven schema types, so
 * `rest_validate_value_from_schema` warns via `_doing_it_wrong` and
 * falls through its switch to `default: $is_valid = true`. The route
 * then compares `''` against the limit and answers with the smallest
 * add-on, which looks exactly like a real offer. Verified against
 * WordPress core, `wp-includes/rest-api.php` and
 * `wp-includes/rest-api/class-wp-rest-request.php`.
 *
 * `apiPath` drops an `undefined` arg and forwards a `null` one as an
 * empty value, so those two mistakes land on opposite sides of that.
 *
 * The three slugs this can return are all `…_monthly`, so the `cost`
 * behind `full_price` is already a monthly figure and needs no term
 * conversion — unlike `/backup-promoted-product-info`, whose product is
 * yearly and whose hook divides by twelve.
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
