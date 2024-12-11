<?php
/**
 * Publicize Services class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Rest_Endpoints\Services_Controller;
use Automattic\Jetpack\Status\Host;

/**
 * Publicize Services class.
 */
class Services {

	const SERVICES_TRANSIENT = 'jetpack_social_services_list';

	/**
	 * Get all services.
	 *
	 * @param array $args Arguments
	 *                - 'clear_cache': bool Whether to clear the cache.
	 * @return array
	 */
	public static function get_all( $args = array() ) {

		$is_wpcom = ( new Host() )->is_wpcom_simple();

		if ( $is_wpcom ) {
			// We don't need to cache services for simple sites.
			return Services_Controller::get_supported_services();
		}

		$clear_cache = $args['clear_cache'] ?? false;

		if ( $clear_cache ) {
			self::clear_transient();
		}

		$services = get_transient( self::SERVICES_TRANSIENT );

		// This can be an empty array, so we need to check for false.
		if ( false === $services ) {
			$services = self::fetch_and_cache_services();
		}

		return $services;
	}

	/**
	 * Fetch services from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_services() {
		$services = Services_Controller::get_supported_services();

		if ( ! empty( $services ) ) {
			set_transient( self::SERVICES_TRANSIENT, $services, HOUR_IN_SECONDS * 4 );
		}

		return $services;
	}

	/**
	 * Delete the transient.
	 */
	protected static function clear_transient() {
		delete_transient( self::SERVICES_TRANSIENT );
	}
}
