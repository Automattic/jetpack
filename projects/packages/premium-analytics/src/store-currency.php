<?php
/**
 * Store currency script-data wiring.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Configures store currency script data.
 *
 * @return void
 */
function configure_store_currency() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_store_currency_script_data', 20 );
}

/**
 * Injects the WooCommerce store currency into JetpackScriptData, so the dashboard formats
 * store money in it rather than USD. Sites without WooCommerce get no key.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_store_currency_script_data( array $data ): array {
	if ( ! function_exists( 'get_woocommerce_currency' ) || ! function_exists( 'get_woocommerce_currency_symbol' ) ) {
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
