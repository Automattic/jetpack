<?php
/**
 * Legacy Status Host fixture matching jetpack-status 6.1.5.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;

/**
 * Legacy Host implementation with the complete public method surface from
 * jetpack-status 6.1.5.
 *
 * Method bodies are deliberately self-contained so fixture behavior cannot
 * fail because WordPress or another Status class has not been loaded. The
 * is_pressable() method is deliberately absent because it was added in 6.2.0.
 */
class Host {
	/**
	 * Determine whether the site is a WordPress.com Atomic site.
	 *
	 * @return bool
	 */
	public function is_woa_site() {
		return $this->is_atomic_platform() && Constants::is_true( 'WPCOMSH__PLUGIN_FILE' );
	}

	/**
	 * Determine whether the site is hosted on the Atomic platform.
	 *
	 * @return bool
	 */
	public function is_atomic_platform() {
		return Constants::is_true( 'ATOMIC_SITE_ID' ) && Constants::is_true( 'ATOMIC_CLIENT_ID' );
	}

	/**
	 * Determine whether this is a Newspack site.
	 *
	 * @return bool
	 */
	public function is_newspack_site() {
		return Constants::is_defined( 'NEWSPACK_PLUGIN_FILE' );
	}

	/**
	 * Determine whether this is a VIP-hosted site.
	 *
	 * @return bool
	 */
	public function is_vip_site() {
		return Constants::is_true( 'WPCOM_IS_VIP_ENV' );
	}

	/**
	 * Determine whether this is a WordPress.com Simple site.
	 *
	 * @return bool
	 */
	public function is_wpcom_simple() {
		return Constants::is_true( 'IS_WPCOM' );
	}

	/**
	 * Determine whether this is a WordPress.com site.
	 *
	 * @return bool
	 */
	public function is_wpcom_platform() {
		return $this->is_wpcom_simple() || $this->is_woa_site();
	}

	/**
	 * Determine whether this is a P2 site.
	 *
	 * @return bool
	 */
	public function is_p2_site() {
		return false;
	}

	/**
	 * Get the current site's WordPress.com ID.
	 *
	 * @return false
	 */
	public function get_wpcom_site_id() {
		return false;
	}

	/**
	 * Add WordPress.com environments to a list of allowed domains.
	 *
	 * @param array $domains Allowed domains.
	 * @return array
	 */
	public static function allow_wpcom_environments( $domains ) {
		$domains[] = 'wordpress.com';
		$domains[] = 'jetpack.wordpress.com';
		$domains[] = 'wpcalypso.wordpress.com';
		$domains[] = 'horizon.wordpress.com';
		$domains[] = 'calypso.localhost';
		return $domains;
	}

	/**
	 * Get the configured Calypso environment.
	 *
	 * @return string
	 */
	public function get_calypso_env() {
		return '';
	}

	/**
	 * Get the source query parameter.
	 *
	 * @return string
	 */
	public function get_source_query() {
		return '';
	}

	/**
	 * Guess the current hosting provider.
	 *
	 * @return string
	 */
	public function get_known_host_guess() {
		switch ( true ) {
			case $this->is_woa_site():
				return 'woa';
			case $this->is_atomic_platform():
				return 'atomic';
			case $this->is_newspack_site():
				return 'newspack';
			case $this->is_vip_site():
				return 'vip';
			case $this->is_wpcom_simple():
			case $this->is_wpcom_platform():
				return 'wpcom';
			default:
				return 'unknown';
		}
	}

	/**
	 * Add the WordPress.com public API to a list of allowed domains.
	 *
	 * @param array $domains Allowed domains.
	 * @return array
	 */
	public static function allow_wpcom_public_api_domain( $domains ) {
		$domains[] = 'public-api.wordpress.com';
		return $domains;
	}
}
