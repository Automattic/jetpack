<?php
/**
 * The Ads configuration of the shared WordPress.com proxy.
 *
 * @package automattic/jetpack-ads
 */

namespace Automattic\Jetpack\WordAds;

use Automattic\Jetpack\WPCOM_Proxy\Proxy_Controller;

/**
 * Registers `/jetpack/v4/wordads/proxy/v<version>/<endpoint>` for the WordAds endpoints the
 * Ads widgets read, through the `jetpack-wpcom-proxy` package: allowlist, capability, blog-signed
 * forward and a short cache come from there.
 *
 * @since $$next-version$$
 */
class Api_Proxy_Controller {

	/**
	 * REST namespace of the route.
	 */
	const REST_NAMESPACE = 'jetpack/v4/wordads';

	/**
	 * Endpoint groups the proxy forwards: the earnings and stats reports, read by the same
	 * capability the dashboard asks for the Ads section. The blog token never travels outside
	 * this table.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	const ENDPOINTS = array(
		'wordads' => array(
			'capability' => 'manage_options',
			'pattern'    => '(?:earnings|stats)',
		),
	);

	/**
	 * Transient key prefix of the cached responses.
	 */
	const CACHE_PREFIX = 'jetpack_wordads_proxy_';

	/**
	 * Register the proxy route. Called on `rest_api_init`, so the package class loads on REST
	 * requests only.
	 *
	 * @return void
	 */
	public static function init() {
		( new Proxy_Controller( self::REST_NAMESPACE, self::ENDPOINTS, self::CACHE_PREFIX ) )->register_hooks();
	}

	/**
	 * Register the cache prefix with the Stats package's transient cleanup, which runs from cron.
	 *
	 * @param mixed $prefixes Transient prefixes the cleanup sweeps.
	 * @return mixed
	 */
	public static function register_transient_cleanup_prefix( $prefixes ) {
		if ( is_array( $prefixes ) ) {
			$prefixes[] = self::CACHE_PREFIX;
		}

		return $prefixes;
	}
}
