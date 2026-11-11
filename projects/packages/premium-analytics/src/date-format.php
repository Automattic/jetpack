<?php
/**
 * The date format the dashboard derives its dates from.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Configures the date format script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_date_format() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_date_format_script_data', 20 );
}

/**
 * The site's `date_format` when it is one of the choices on Settings › General, else the
 * locale's default.
 *
 * The dashboard drops the day or year from this format for its shorter forms, which a
 * custom format such as `d/m` survives only as an ambiguous `02`.
 *
 * @since $$next-version$$
 *
 * @return string A PHP date format.
 */
function dashboard_date_format(): string {
	// phpcs:ignore WordPress.WP.I18n.MissingArgDomain -- Core's own string, the same one Settings › General lists.
	$locale_default = __( 'F j, Y' );

	/** This filter is documented in wp-admin/options-general.php */
	$presets     = apply_filters( 'date_formats', array( $locale_default, 'Y-m-d', 'm/d/Y', 'd/m/Y', 'd.m.Y' ) );
	$site_format = get_option( 'date_format' );

	return is_array( $presets ) && in_array( $site_format, $presets, true ) ? $site_format : $locale_default;
}

/**
 * Injects the dashboard's date format into JetpackScriptData.
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

	$data['premium_analytics']['date_format'] = dashboard_date_format();

	return $data;
}
