<?php
/**
 * A site status class for Jetpack.
 *
 * @package jetpack-site-status
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants;

/**
 * Class Automattic\Jetpack\Site_Status
 *
 * Used to retrieve information about the current status of the site.
 */
class Site_Status {
	/**
	 * Is Jetpack in development (offline) mode?
	 */
	public static function is_development_mode() {
		$development_mode = false;
		$site_url         = site_url();

		if ( defined( 'JETPACK_DEV_DEBUG' ) ) {
			$development_mode = JETPACK_DEV_DEBUG;
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
}
