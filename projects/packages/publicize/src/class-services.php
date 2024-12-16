<?php
/**
 * Publicize Services class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Publicize Services class.
 */
class Services {

	const SERVICES_TRANSIENT = 'jetpack_social_services_list';

	/**
	 * Get all services.
	 *
	 * @param bool $force_refresh Whether to force a refresh of the services.
	 * @return array
	 */
	public static function get_all( $force_refresh = false ) {
		if ( defined( 'IS_WPCOM' ) && constant( 'IS_WPCOM' ) ) {
			if ( function_exists( 'require_lib' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check.
				require_lib( 'external-connections' );
			}

			// @phan-suppress-next-line PhanUndeclaredClassMethod - We are here because we are on WPCOM.
			$external_connections = \WPCOM_External_Connections::init();
			$services             = array_values( $external_connections->get_external_services_list( 'publicize', get_current_blog_id() ) );

			return $services;
		}

		// Checking the cache.
		$services = get_transient( self::SERVICES_TRANSIENT );
		if ( false !== $services && ! $force_refresh ) {
			return $services;
		}

		return self::fetch_and_cache_services();
	}

	/**
	 * Fetch services from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_services() {
		// Fetch the services.
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}
		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			return array();
		}
		$body = json_decode( wp_remote_retrieve_body( $response ) );

		$services = $body->services ?? array();

		$formatted_services = array_values(
			array_filter(
				(array) $services,
				function ( $service ) {
					return isset( $service->type ) && 'publicize' === $service->type;
				}
			)
		);

		if ( ! empty( $formatted_services ) ) {
			set_transient( self::SERVICES_TRANSIENT, $formatted_services, DAY_IN_SECONDS );
		}

		return $formatted_services;
	}
}
