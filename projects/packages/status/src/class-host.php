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
	 * Determine if this site is an WordPress.com on Atomic site or not by looking for presence of the wpcomsh plugin.
	 *
	 * @since 1.9.0
	 *
	 * @return bool
	 */
	public function is_woa_site() {
		$ret = Cache::get( 'is_woa_site' );
		if ( null === $ret ) {
			$ret = $this->is_atomic_platform() && Constants::is_true( 'WPCOMSH__PLUGIN_FILE' );
			Cache::set( 'is_woa_site', $ret );
		}
		return $ret;
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

	/**
	 * Determine if this is a Simple platform site.
	 *
	 * @return bool
	 */
	public function is_wpcom_simple() {
		return Constants::is_defined( 'IS_WPCOM' ) && true === Constants::get_constant( 'IS_WPCOM' );
	}

	/**
	 * Determine if this is a WordPress.com site.
	 *
	 * Includes both Simple and WoA platforms.
	 *
	 * @return bool
	 */
	public function is_wpcom_platform() {
		return $this->is_wpcom_simple() || $this->is_woa_site();
	}

	/**
	 * Add all wordpress.com environments to the safe redirect allowed list.
	 *
	 * To be used with a filter of allowed domains for a redirect.
	 *
	 * @param array $domains Allowed WP.com Environments.
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
	 * Return Calypso environment value; used for developing Jetpack and pairing
	 * it with different Calypso environments, such as localhost.
	 *
	 * @since 1.18.0
	 *
	 * @return string Calypso environment
	 */
	public function get_calypso_env() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Nonce is not required; only used for changing environments.
		if ( isset( $_GET['calypso_env'] ) ) {
			return sanitize_key( $_GET['calypso_env'] );
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		if ( getenv( 'CALYPSO_ENV' ) ) {
			return sanitize_key( getenv( 'CALYPSO_ENV' ) );
		}

		if ( defined( 'CALYPSO_ENV' ) && CALYPSO_ENV ) {
			return sanitize_key( CALYPSO_ENV );
		}

		return '';
	}

	/**
	 * Return source query param value from the URL if exists in the allowed sources list.
	 *
	 * @return string "source" query param value
	 */
	public function get_source_query() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$allowed_sources = array( 'jetpack-manage' );
		if ( isset( $_GET['source'] ) && in_array( $_GET['source'], $allowed_sources, true ) ) {
			return sanitize_key( $_GET['source'] );
		}

		return '';
	}
}
