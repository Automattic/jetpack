<?php
/**
 * Publicize Services class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\REST_API\Proxy_Requests;
use WP_REST_Request;

/**
 * Publicize Services class.
 */
class Services {

	const SERVICES_TRANSIENT = 'jetpack_social_services_list_v2';

	/**
	 * Get the available publicize services. Meant to be called directly only on WPCOM.
	 *
	 * @return array
	 */
	public static function wpcom_get_all() {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'external-connections' );

		$external_connections = \WPCOM_External_Connections::init();

		$services = $external_connections->get_external_services_list( 'publicize', get_current_blog_id() );

		$items = array();

		foreach ( $services as $service ) {
			// Set the fields as per the schema in Services_Controller.
			$items[] = array(
				'id'          => $service['ID'],
				'description' => $service['description'],
				'label'       => $service['label'],
				'status'      => $service['status'] ?? 'ok',
				'supports'    => array(
					'additional_users'      => $service['multiple_external_user_ID_support'],
					'additional_users_only' => $service['external_users_only'],
				),
				'url'         => $service['connect_URL'],
			);
		}

		return $items;
	}

	/**
	 * Get all services.
	 *
	 * @param array $args Arguments
	 *                - 'ignore_cache': bool Whether to ignore the cache and fetch the connections from the API.
	 * @return array
	 */
	public static function get_all( $args = array() ) {

		if ( Publicize_Utils::is_wpcom() ) {
			$services = self::wpcom_get_all();
		} else {

			$ignore_cache = $args['ignore_cache'] ?? false;

			$services = get_transient( self::SERVICES_TRANSIENT );

			if ( $ignore_cache || false === $services ) {
				$services = self::fetch_and_cache_services();
			}
			// This is here for backwards compatibility
			// TODO Remove this array_map() call after April 2025 release of Jetpack.
			return array_map(
				function ( $service ) {
					global $publicize;

					return array_merge(
						$service,
						array(
							'ID'                  => $service['id'],
							'connect_URL'         => $publicize->connect_url( $service['id'], 'connect' ),
							'external_users_only' => $service['supports']['additional_users_only'],
							'multiple_external_user_ID_support' => $service['supports']['additional_users'],
						)
					);
				},
				$services
			);
		}

		return $services;
	}

	/**
	 * Fetch services from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_services() {
		$proxy = new Proxy_Requests( 'publicize/services' );

		$request = new WP_REST_Request( 'GET' );

		$response = $proxy->proxy_request_to_wpcom_as_user( $request );

		if ( is_wp_error( $response ) ) {
			// @todo log error.
			return array();
		}

		if ( is_array( $response ) ) {
			/**
			 * Let us set the connect URL to null.
			 *
			 * Reason:
			 * We do not want to cache the connect URL, as it's user-specific,
			 * but the services are for all users.
			 * The intention is to get the connect URL on demand via an API call when needed.
			 */
			$services = array_map(
				function ( $service ) {
					return array_merge(
						$service,
						array(
							'url' => null,
						)
					);
				},
				$response
			);

			if ( ! set_transient( self::SERVICES_TRANSIENT, $services, DAY_IN_SECONDS ) ) {
				// If the transient has beeen set in another request, the call to set_transient can fail.
				// If so, we can delete the transient and try again.
				self::clear_cache();

				set_transient( self::SERVICES_TRANSIENT, $services, DAY_IN_SECONDS );
			}
		}

		return $response;
	}

	/**
	 * Clear the services cache.
	 */
	public static function clear_cache() {
		delete_transient( self::SERVICES_TRANSIENT );
	}
}
