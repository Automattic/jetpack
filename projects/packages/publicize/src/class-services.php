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

	const SERVICES_TRANSIENT = 'jetpack_social_available_services_list';

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
	 * @param bool $force_refresh Whether to force a refresh of the services.
	 * @return array
	 */
	public static function get_all( $force_refresh = false ) {
		if ( defined( 'IS_WPCOM' ) && constant( 'IS_WPCOM' ) ) {
			if ( function_exists( 'require_lib' ) ) {
				require_lib( 'external-connections' );
			}

			$external_connections = \WPCOM_External_Connections::init();
			$services             = array_values( $external_connections->get_external_services_list( 'publicize', get_current_blog_id() ) );

			return $services;
		}

		// Checking the cache.
		$services = get_transient( self::SERVICES_TRANSIENT );
		if ( false === $services || $force_refresh ) {
			$services = self::fetch_and_cache_services();
		}

		return array_map(
			function ( $service ) {
				global $publicize;

				return array_merge(
					$service,
					array(
						'connect_URL' => $publicize->connect_url( $service['ID'], 'connect' ),
					)
				);
			},
			$services
		);
	}

	/**
	 * Fetch services from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_services() {
		$proxy = new Proxy_Requests( 'external-services' );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/external-services' );

		$request->set_param( 'type', 'publicize' );

		$response = $proxy->proxy_request_to_wpcom_as_user( $request );

		if ( is_wp_error( $response ) ) {
			// @todo log error.
			return array();
		}

		$services = array_values( $response['services'] );

		if ( ! empty( $services ) ) {
			set_transient( self::SERVICES_TRANSIENT, $services, DAY_IN_SECONDS );
		}

		return $services;
	}
}
