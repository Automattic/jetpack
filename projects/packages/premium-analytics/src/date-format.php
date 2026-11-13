<?php
/**
 * The locale's default date format, for sites whose own format the dashboard cannot use.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Configures the default date format script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_date_format() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_date_format_script_data', 20 );
}

/**
 * Injects the locale's default date format into JetpackScriptData.
 *
 * The dashboard falls back to it when the site's format lacks a day, month or year. Sent from
 * PHP because core's JavaScript translations do not include this string.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_date_format_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	// phpcs:ignore WordPress.WP.I18n.MissingArgDomain -- Core's own string, the default Settings › General offers.
	$data['premium_analytics']['default_date_format'] = __( 'F j, Y' );

	return $data;
}
