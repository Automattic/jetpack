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
	 * @return bool
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
	 * Determine if this is a P2 site.
	 * This covers both P2 and P2020 themes.
	 *
	 * @return bool
	 */
	public function is_p2_site() {
		$site_id = $this->get_wpcom_site_id();
		if ( ! $site_id ) {
			return false;
		}
		return str_contains( get_stylesheet(), 'pub/p2' ) || ( function_exists( '\WPForTeams\is_wpforteams_site' ) && \WPForTeams\is_wpforteams_site( $site_id ) );
	}

	/**
	 * Get the current site's WordPress.com ID.
	 *
	 * @return mixed The site's WordPress.com ID.
	 */
	public function get_wpcom_site_id() {
		if ( $this->is_wpcom_simple() ) {
			return get_current_blog_id();
		} elseif ( class_exists( 'Jetpack' ) && \Jetpack::is_connection_ready() ) {
			return \Jetpack_Options::get_option( 'id' );
		}
		return false;
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
		$allowed_sources = array( 'jetpack-manage', 'a8c-for-agencies' );
		if ( isset( $_GET['source'] ) && in_array( $_GET['source'], $allowed_sources, true ) ) {
			return sanitize_key( $_GET['source'] );
		}

		return '';
	}

	/**
	 * Returns a guess of the hosting provider for the current site based on various checks.
	 *
	 * @since 5.0.4 Added $guess parameter.
	 * @since 6.0.0 Removed $guess parameter.
	 *
	 * @return string
	 */
	public function get_known_host_guess() {
		// First, let's check if we can recognize provider manually:
		switch ( true ) {
			case $this->is_woa_site():
				$provider = 'woa';
				break;
			case $this->is_atomic_platform():
				$provider = 'atomic';
				break;
			case $this->is_newspack_site():
				$provider = 'newspack';
				break;
			case $this->is_vip_site():
				$provider = 'vip';
				break;
			case $this->is_wpcom_simple():
			case $this->is_wpcom_platform():
				$provider = 'wpcom';
				break;
			default:
				$provider = 'unknown';
				break;
		}

		return $provider;
	}

	/**
	 * Add public-api.wordpress.com to the safe redirect allowed list - only added when someone allows API access.
	 *
	 * @since 3.0.2 Ported from Jetpack to the Status package.
	 *
	 * To be used with a filter of allowed domains for a redirect.
	 *
	 * @param array $domains Allowed WP.com Environments.
	 *
	 * @return array
	 */
	public static function allow_wpcom_public_api_domain( $domains ) {
		$domains[] = 'public-api.wordpress.com';
		return $domains;
	}
}
