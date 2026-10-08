<?php
/**
 * The store currency the dashboard formats money in.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

/**
 * Hands the WooCommerce store currency to the dashboard's money formatter, which otherwise prints USD.
 *
 * @since $$next-version$$
 */
class Store_Currency {

	/**
	 * Hook the script data filter.
	 *
	 * Priority 20: the dashboard's sync status tracker replaces `premium_analytics` at 10.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Add the store currency code and symbol as `premium_analytics.store_currency`.
	 *
	 * @param array $data The script data passed by the assets package.
	 * @return array The script data, unchanged without WooCommerce.
	 */
	public static function add_script_data( $data ) {
		if ( ! is_array( $data ) || ! function_exists( 'get_woocommerce_currency' ) || ! function_exists( 'get_woocommerce_currency_symbol' ) ) {
			return $data;
		}

		if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
			$data['premium_analytics'] = array();
		}

		$code = get_woocommerce_currency();

		// Decoded the way WooCommerce's own `wc_currency_settings` does, since symbols are stored as entities.
		$data['premium_analytics']['store_currency'] = array(
			'code'   => $code,
			'symbol' => html_entity_decode( get_woocommerce_currency_symbol( $code ), ENT_QUOTES ),
		);

		return $data;
	}
}
