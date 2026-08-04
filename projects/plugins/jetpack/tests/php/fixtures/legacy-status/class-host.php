<?php
/**
 * Legacy Status Host fixture from before jetpack-status 6.2.0.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;

/**
 * Minimal legacy Host implementation.
 *
 * Deliberately does not implement is_pressable().
 */
class Host {
	/**
	 * Determine whether the site is hosted on the Atomic platform.
	 *
	 * @return bool
	 */
	public function is_atomic_platform() {
		return Constants::is_true( 'ATOMIC_SITE_ID' ) && Constants::is_true( 'ATOMIC_CLIENT_ID' );
	}
}
