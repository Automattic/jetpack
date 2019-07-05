<?php
/**
 * A status class for Jetpack.
 *
 * @package jetpack-status
 */

namespace Automattic\Jetpack;

/**
 * Class Automattic\Jetpack\Status
 *
 * Used to retrieve information about the current status of Jetpack and the site overall.
 */
class Status {
	/**
	 * Is Jetpack in development (offline) mode?
	 *
	 * @return bool Whether Jetpack's development mode is active.
	 */
	public function is_development_mode() {
		$development_mode = false;
		$site_url         = site_url();

		if ( defined( '\\JETPACK_DEV_DEBUG' ) ) {
			$development_mode = constant( '\\JETPACK_DEV_DEBUG' );
		} elseif ( $site_url ) {
			$development_mode = false === strpos( $site_url, '.' );
		}

		/**
		 * Filters Jetpack's development mode.
		 *
		 * @see https://jetpack.com/support/development-mode/
		 *
		 * @since 2.2.1
		 *
		 * @param bool $development_mode Is Jetpack's development mode active.
		 */
		$development_mode = (bool) apply_filters( 'jetpack_development_mode', $development_mode );

		return $development_mode;
	}

	/**
	 * Whether this is a system with a multiple networks.
	 * Implemented since there is no core is_multi_network function.
	 * Right now there is no way to tell which network is the dominant network on the system.
	 *
	 * @return boolean
	 */
	public function is_multi_network() {
		global $wpdb;

		// if we don't have a multi site setup no need to do any more
		if ( ! is_multisite() ) {
			return false;
		}

		$num_sites = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->site}" );
		if ( $num_sites > 1 ) {
			return true;
		}

		return false;
	}
}
