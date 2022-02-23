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
	 * @since 1.9.0
	 *
	 * @return bool
	 */
	public function is_woa_site() {
		$at_options = get_option( 'at_options', array() );
		return $this->is_atomic_platform() && ( ! empty( $at_options ) || Constants::is_true( 'WPCOMSH__PLUGIN_FILE' ) );
	}

	/**
	 * Determine if the site is hosted on the Atomic hosting platform.
	 *
	 * @since 1.9.0
	 *
	 * @return bool;
	 */
	public function is_atomic_platform() {
		return Constants::is_true( 'ATOMIC_SITE_ID' ) && Constants::is_true( 'ATOMIC_CLIENT_ID' );
	}

	/**
	 * Determine if this is a Newspack site.
	 *
	 * @return bool
	 */
	public function is_newspack_site() {
		return Constants::is_defined( 'NEWSPACK_PLUGIN_FILE' );
	}

	/**
	 * Determine if this is a VIP-hosted site.
	 *
	 * @return bool
	 */
	public function is_vip_site() {
		return Constants::is_defined( 'WPCOM_IS_VIP_ENV' ) && true === Constants::get_constant( 'WPCOM_IS_VIP_ENV' );
	}
}
