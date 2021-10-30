<?php
/**
 * A hosting provide class for Jetpack.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;

/**
 * Hosting provider class.
 */
class Host {
	/**
	 * Determine if this site is an WordPress.com on Atomic site or not looking first at the 'at_options' option.
	 * As a fallback, check for presence of wpcomsh plugin to determine if a current site has undergone AT.
	 *
	 * @since $$next_version$$
	 *
	 * @return bool
	 */
	public function is_woa_site() {
		$at_options = get_option( 'at_options', array() );
		return $this->is_atomic_platform() && ( ! empty( $at_options ) || Constants::is_true( 'WPCOMSH__PLUGIN_FILE' ) );
	}

	/**
	 * Determine if site is hosted on the Atomic hosting platform.
	 *
	 * @since $$next_version$$
	 *
	 * @return bool;
	 */
	public function is_atomic_platform() {
		return Constants::is_true( 'ATOMIC_SITE_ID' ) && Constants::is_true( 'ATOMIC_CLIENT_ID' );
	}

}
