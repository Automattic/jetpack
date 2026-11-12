<?php
/**
 * The configuration the dashboard's error reporter reads.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Whether the dashboard reports its own uncaught JavaScript errors on this site.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function is_error_reporting_enabled(): bool {
	$host = new Host();

	return $host->is_wpcom_simple() || $host->is_woa_site();
}

/**
 * Stands the wp-admin error reporter down on the dashboard screen, where the dashboard reports
 * for itself.
 *
 * The jetpack-mu-wpcom reporter sends every window error of every admin screen to the same
 * endpoint, with the full URL and an unredacted stack. Both reporters on one screen file every
 * error twice.
 *
 * @since $$next-version$$
 *
 * @param bool $delegated Whether another reporter already owns the screen.
 * @return bool
 */
function delegate_wp_admin_error_reporting( $delegated ): bool {
	return is_error_reporting_enabled() ? true : (bool) $delegated;
}

/**
 * Adds the error reporting gate, package version and script origins to JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function add_error_reporting_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$origins = array( trailingslashit( Assets::normalize_path( plugins_url( '../build/', __FILE__ ) ) ) );

	// Packages add their origin when the widget type registry hydrates.
	if ( function_exists( __NAMESPACE__ . '\\get_answering_widget_type_registry' ) ) {
		get_answering_widget_type_registry();
	}

	/**
	 * Filters the URL prefixes that mark a stack frame as Premium Analytics code.
	 *
	 * Packages that ship their own build for the dashboard add its base URL here.
	 *
	 * @since $$next-version$$
	 *
	 * @param string[] $origins Absolute URL prefixes, each ending in a slash.
	 */
	$filtered = apply_filters( 'jetpack_premium_analytics_error_reporting_script_origins', $origins );

	$data['premium_analytics']['error_reporting'] = array(
		'enabled'        => is_error_reporting_enabled(),
		'version'        => Analytics::PACKAGE_VERSION,
		'script_origins' => sanitize_error_reporting_origins( $filtered, $origins[0] ),
	);

	return $data;
}

/**
 * Keeps the package's own origin first and drops what a filter must not be able to publish.
 *
 * An origin with no host, `/` or `https://` among them, would match every stack line of that shape,
 * so every error would look like dashboard code.
 *
 * @since $$next-version$$
 *
 * @param mixed  $filtered The filter result, which can be anything.
 * @param string $own      The package's own build origin.
 * @return string[] Absolute URL prefixes, each ending in a slash.
 */
function sanitize_error_reporting_origins( $filtered, string $own ): array {
	$origins = array( $own );

	if ( is_array( $filtered ) ) {
		foreach ( $filtered as $origin ) {
			if ( ! is_string( $origin ) || $origin === '' ) {
				continue;
			}

			$origin_host = wp_parse_url( $origin, PHP_URL_HOST );
			if ( ! is_string( $origin_host ) || $origin_host === '' ) {
				continue;
			}

			$origins[] = trailingslashit( $origin );
		}
	}

	return array_values( array_unique( $origins ) );
}
