<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Global-namespace fakes for the WordPress.com store surface that
 * Jetpack_AI_Hub\get_plan_info() reads on Simple. Loaded only inside a
 * separate-process test so the definitions cannot leak into other tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- the fixture mirrors two store surfaces that ship together.

/**
 * Fake of the WordPress.com purchases lookup, in the Simple store-row shape
 * (active rows only, ISO8601 dates, `user_allows_auto_renew`, no
 * product_name): a non-plan purchase, a superseded plan row, and the plan.
 *
 * @return object[]
 */
function wpcom_get_site_purchases() {
	return array(
		(object) array(
			'product_type' => 'search',
			'product_id'   => '9',
		),
		(object) array(
			'product_type'           => 'bundle',
			'product_id'             => '1009',
			'expiry_date'            => '2026-10-01T00:00:00+00:00',
			'user_allows_auto_renew' => true,
		),
		(object) array(
			'product_type'           => 'bundle',
			'product_id'             => '1008',
			'expiry_date'            => '2027-08-30T00:00:00+00:00',
			'user_allows_auto_renew' => false,
		),
	);
}

/**
 * Fake of the WordPress.com store product list, naming the plan products.
 */
class Store_Product_List {
	/**
	 * Products keyed by product id, as the real cache returns them.
	 *
	 * @return array
	 */
	public static function get_from_cache() {
		return array(
			1008 => array( 'product_name' => 'WordPress.com Business' ),
			1009 => array( 'product_name' => 'WordPress.com Personal' ),
		);
	}
}
