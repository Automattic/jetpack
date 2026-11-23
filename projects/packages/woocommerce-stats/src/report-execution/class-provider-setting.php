<?php
/**
 * The site's choice of report providers.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The registered providers a `provider=auto` request may use, in order of preference.
 *
 * @internal Not a stable contract yet: the format may change before a settings UI exists.
 *
 * @since 0.5.0
 */
class Provider_Setting {

	/**
	 * Option holding the provider names, as a list or comma-separated. Write it with autoload off: only report requests read it.
	 */
	const OPTION = 'jetpack_woocommerce_stats_report_providers';

	/**
	 * Filter overriding the option.
	 */
	const FILTER = 'jetpack_woocommerce_stats_report_providers';

	/**
	 * Provider of a site without a setting, and of a request that names none.
	 */
	const DEFAULT_PROVIDER = 'wpcom';

	/**
	 * Provider names to try, in order, for a `provider=auto` request; the default provider when the site has no setting.
	 *
	 * @return non-empty-array<string>
	 */
	public static function get_providers() {
		/**
		 * Filters the providers a store report requested with `provider=auto` may use, in order of
		 * preference. Experimental: the format may change before a settings UI exists.
		 *
		 * @since 0.5.0
		 *
		 * @param string[]|string $providers Registered provider names, such as `wpcom` or `local`, as a list or comma-separated.
		 */
		$providers = apply_filters( self::FILTER, get_option( self::OPTION, array() ) );
		$names     = array();
		if ( is_array( $providers ) || is_string( $providers ) ) {
			$names = array_values( array_unique( array_filter( array_map( 'trim', array_filter( wp_parse_list( $providers ), 'is_string' ) ) ) ) );
		}

		return $names ? $names : array( self::DEFAULT_PROVIDER );
	}
}
