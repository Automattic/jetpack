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

	/**
	 * Returns an array of nameservers for the current site.
	 *
	 * @param string $domain The domain of the site to check.
	 * @return array
	 */
	public function get_nameserver_dns_records( $domain ) {
		if ( ! function_exists( 'dns_get_record' ) ) {
			return array();
		}

		$dns_records = dns_get_record( $domain, DNS_NS ); // Fetches the DNS records of type NS (Name Server)
		$nameservers = array();
		foreach ( $dns_records as $record ) {
			if ( isset( $record['target'] ) ) {
				$nameservers[] = $record['target']; // Adds the nameserver to the array
			}
		}

		return $nameservers; // Returns an array of nameserver names
	}

	/**
	 * Given a DNS entry, will return a hosting provider if one can be determined. Otherwise, will return 'unknown'.
	 * Sourced from: fbhepr%2Skers%2Sjcpbz%2Sjc%2Qpbagrag%2Syvo%2Subfgvat%2Qcebivqre%2Sanzrfreiref.cuc-og
	 *
	 * @param string $domain The domain of the site to check.
	 * @return string The hosting provider of 'unknown'.
	 */
	public function get_hosting_provider_by_nameserver( $domain ) {
		$known_nameservers = array(
			'bluehost'     => array(
				'.bluehost.com',
			),
			'dreamhost'    => array(
				'.dreamhost.com',
			),
			'mediatemple'  => array(
				'.mediatemple.net',
			),
			'xserver'      => array(
				'.xserver.jp',
			),
			'namecheap'    => array(
				'.namecheaphosting.com',
			),
			'hostmonster'  => array(
				'.hostmonster.com',
			),
			'justhost'     => array(
				'.justhost.com',
			),
			'digitalocean' => array(
				'.digitalocean.com',
			),
			'one'          => array(
				'.one.com',
			),
			'hostpapa'     => array(
				'.hostpapa.com',
			),
			'siteground'   => array(
				'.sgcloud.net',
				'.sgedu.site',
				'.sgsrv1.com',
				'.sgvps.net',
				'.siteground.biz',
				'.siteground.net',
				'.siteground.eu',
			),
			'inmotion'     => array(
				'.inmotionhosting.com',
			),
			'ionos'        => array(
				'.ui-dns.org',
				'.ui-dns.de',
				'.ui-dns.biz',
				'.ui-dns.com',
			),
		);

		$dns_records = $this->get_nameserver_dns_records( $domain );
		$dns_records = array_map( 'strtolower', $dns_records );

		foreach ( $known_nameservers as $host => $ns_patterns ) {
			foreach ( $ns_patterns as $ns_pattern ) {
				foreach ( $dns_records as $record ) {
					if ( false !== strpos( $record, $ns_pattern ) ) {
						return $host;
					}
				}
			}
		}

		return 'unknown';
	}

	/**
	 * Returns a guess of the hosting provider for the current site based on various checks.
	 *
	 * @return string
	 */
	public function get_known_host_guess() {
		$host = Cache::get( 'host_guess' );

		if ( null !== $host ) {
			return $host;
		}

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

		// Second, let's check if we can recognize provider by nameservers:
		$domain = isset( $_SERVER['SERVER_NAME'] ) ? sanitize_text_field( wp_unslash( $_SERVER['SERVER_NAME'] ) ) : '';
		if ( $provider === 'unknown' && ! empty( $domain ) ) {
			$provider = $this->get_hosting_provider_by_nameserver( $domain );
		}

		Cache::set( 'host_guess', $provider );
		return $provider;
	}
}
