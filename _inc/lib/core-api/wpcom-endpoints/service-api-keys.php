<?php

use Automattic\Jetpack\Connection\Client;

/*
 * Service API Keys: Exposes 3rd party api keys that are used on a site.
 *
 * [
 *   { # Availabilty Object. See schema for more detail.
 *      code:            (string) Displays success if the operation was successfully executed and an error code if it was not
 *      service:         (string) The name of the service in question
 *      service_api_key: (string) The API key used by the service empty if one is not set yet
 *      message:         (string) User friendly message
 *   },
 *   ...
 * ]
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Service_API_Keys extends WP_REST_Controller {

	function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'service-api-keys';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/service-api-keys/(?P<service>[a-z\-_]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_service_api_key' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_service_api_key' ),
					'permission_callback' => array( __CLASS__, 'edit_others_posts_check' ),
					'args'                => array(
						'service_api_key' => array(
							'required' => true,
							'type'     => 'text',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_service_api_key' ),
					'permission_callback' => array( __CLASS__, 'edit_others_posts_check' ),
				),
			)
		);
	}

	public static function edit_others_posts_check() {
		if ( current_user_can( 'edit_others_posts' ) ) {
			return true;
		}

		$user_permissions_error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack'
		);

		return new WP_Error( 'invalid_user_permission_edit_others_posts', $user_permissions_error_msg, rest_authorization_required_code() );
	}

	/**
	 * Return the available Gutenberg extensions schema
	 *
	 * @return array Service API Key schema
	 */
	public function get_public_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'service-api-keys',
			'type'       => 'object',
			'properties' => array(
				'code'          => array(
					'description' => __( 'Displays success if the operation was successfully executed and an error code if it was not', 'jetpack' ),
					'type'        => 'string',
				),
				'service' => array(
					'description' => __( 'The name of the service in question', 'jetpack' ),
					'type'        => 'string',
				),
				'service_api_key'          => array(
					'description' => __( 'The API key used by the service. Empty if none has been set yet', 'jetpack' ),
					'type'        => 'string',
				),
				'message'          => array(
					'description' => __( 'User friendly message', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get third party plugin API keys.
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function get_service_api_key( $request ) {
		$service = self::validate_service_api_service( $request['service'] );
		if ( ! $service ) {
			return self::service_api_invalid_service_response();
		}

		switch ( $service ) {
			case 'mapbox':
				$mapbox                 = self::get_service_api_key_mapbox();
				$service_api_key        = $mapbox['key'];
				$service_api_key_source = $mapbox['source'];
				break;
			default:
				$option                 = self::key_for_api_service( $service );
				$service_api_key        = Jetpack_Options::get_option( $option, '' );
				$service_api_key_source = 'site';
		};

		$message = esc_html__( 'API key retrieved successfully.', 'jetpack' );

		return array(
			'code'                   => 'success',
			'service'                => $service,
			'service_api_key'        => $service_api_key,
			'service_api_key_source' => $service_api_key_source,
			'message'                => $message,
		);
	}

	/**
	 * Update third party plugin API keys.
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function update_service_api_key( $request ) {
		$service = self::validate_service_api_service( $request['service'] );
		if ( ! $service ) {
			return self::service_api_invalid_service_response();
		}
		$json_params = $request->get_json_params();
		$params     = ! empty( $json_params ) ? $json_params : $request->get_body_params();
		$service_api_key    = trim( $params['service_api_key'] );
		$option     = self::key_for_api_service( $service );

		$validation = self::validate_service_api_key( $service_api_key, $service, $params );
		if ( ! $validation['status'] ) {
			return new WP_Error( 'invalid_key', esc_html__( 'Invalid API Key', 'jetpack' ), array( 'status' => 404 ) );
		}
		$message = esc_html__( 'API key updated successfully.', 'jetpack' );
		Jetpack_Options::update_option( $option, $service_api_key );
		return array(
			'code'            => 'success',
			'service'         => $service,
			'service_api_key' => Jetpack_Options::get_option( $option, '' ),
			'message'         => $message,
		);
	}

	/**
	 * Delete a third party plugin API key.
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function delete_service_api_key( $request ) {
		$service = self::validate_service_api_service( $request['service'] );
		if ( ! $service ) {
			return self::service_api_invalid_service_response();
		}
		$option = self::key_for_api_service( $service );
		Jetpack_Options::delete_option( $option );
		$message = esc_html__( 'API key deleted successfully.', 'jetpack' );
		return array(
			'code'            => 'success',
			'service'         => $service,
			'service_api_key' => Jetpack_Options::get_option( $option, '' ),
			'message'         => $message,
		);
	}

	/**
	 * Validate the service provided in /service-api-keys/ endpoints.
	 * To add a service to these endpoints, add the service name to $valid_services
	 * and add '{service name}_api_key' to the non-compact return array in get_option_names(),
	 * in class-jetpack-options.php
	 *
	 * @param string $service The service the API key is for.
	 * @return string Returns the service name if valid, null if invalid.
	 */
	public static function validate_service_api_service( $service = null ) {
		$valid_services = array(
			'mapbox',
		);
		return in_array( $service, $valid_services, true ) ? $service : null;
	}

	/**
	 * Error response for invalid service API key requests with an invalid service.
	 */
	public static function service_api_invalid_service_response() {
		return new WP_Error(
			'invalid_service',
			esc_html__( 'Invalid Service', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Validate API Key
	 *
	 * @param string $key The API key to be validated.
	 * @param string $service The service the API key is for.
	 */
	public static function validate_service_api_key( $key = null, $service = null ) {
		$validation = false;
		switch ( $service ) {
			case 'mapbox':
				$validation = self::validate_service_api_key_mapbox( $key );
				break;
		}
		return $validation;
	}

	/**
	 * Validate Mapbox API key
	 * Based loosely on https://github.com/mapbox/geocoding-example/blob/master/php/MapboxTest.php
	 *
	 * @param string $key The API key to be validated.
	 */
	public static function validate_service_api_key_mapbox( $key ) {
		$status          = true;
		$msg             = null;
		$mapbox_url      = sprintf(
			'https://api.mapbox.com?%s',
			$key
		);
		$mapbox_response = wp_safe_remote_get( esc_url_raw( $mapbox_url ) );
		$mapbox_body     = wp_remote_retrieve_body( $mapbox_response );
		if ( '{"api":"mapbox"}' !== $mapbox_body ) {
			$status = false;
			$msg    = esc_html__( 'Can\'t connect to Mapbox', 'jetpack' );
			return array(
				'status'        => $status,
				'error_message' => $msg,
			);
		}
		$mapbox_geocode_url      = esc_url_raw(
			sprintf(
				'https://api.mapbox.com/geocoding/v5/mapbox.places/%s.json?access_token=%s',
				'1+broadway+new+york+ny+usa',
				$key
			)
		);
		$mapbox_geocode_response = wp_safe_remote_get( esc_url_raw( $mapbox_geocode_url ) );
		$mapbox_geocode_body     = wp_remote_retrieve_body( $mapbox_geocode_response );
		$mapbox_geocode_json     = json_decode( $mapbox_geocode_body );
		if ( isset( $mapbox_geocode_json->message ) && ! isset( $mapbox_geocode_json->query ) ) {
			$status = false;
			$msg    = $mapbox_geocode_json->message;
		}
		return array(
			'status'        => $status,
			'error_message' => $msg,
		);
	}

	/**
	 * Get the site's own Mapbox API key if set, or the WordPress.com's one otherwise.
	 *
	 * @return array An array containing the key (if any) and its source ("site" or "wpcom").
	 */
	public static function get_service_api_key_mapbox() {
		// If the site provides its own Mapbox API key, return it.
		$service_api_key = Jetpack_Options::get_option( self::key_for_api_service( 'mapbox' ) );
		if ( $service_api_key ) {
			return self::format_api_key( $service_api_key );
		}

		// If the site is not WordPress.com, return an empty API key.
		$site_id = self::get_wpcom_site_id();
		if ( ( ! self::is_wpcom() && ! jetpack_is_atomic_site() ) || ! $site_id ) {
			return self::format_api_key();
		}

		// If there is a cached token, return it.
		$transient_key = 'wpcom_mapbox_access_token';
		$cached_token  = get_transient( $transient_key );
		if ( ! $cached_token ) {
			return self::format_api_key( $cached_token, 'wpcom' );
		}

		// Otherwise retrieve a WordPress.com token.
		$request_url = 'https://public-api.wordpress.com/wpcom/v2/sites/' . $site_id . '/mapbox';
		$response    = wp_remote_get( esc_url_raw( $request_url ) );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return self::format_api_key();
		}

		$response_body             = json_decode( wp_remote_retrieve_body( $response ) );
		$wpcom_mapbox_access_token = $response_body->wpcom_mapbox_access_token;

		// Cache the WordPress.com token for an hour.
		set_transient( $transient_key, $wpcom_mapbox_access_token, 3600 );
		return self::format_api_key( $wpcom_mapbox_access_token, 'wpcom' );
	}

	/**
	 * Format an API key and its source into an array.
	 *
	 * @param string $key The API key.
	 * @param string $source The key's source ("site" or "wpcom").
	 * @return array
	 */
	private static function format_api_key( $key = '', $source = 'site' ) {
		return array(
			'key'    => $key,
			'source' => $source,
		);
	}

	/**
	 * Check if we're in WordPress.com.
	 *
	 * @return bool
	 */
	private static function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}

	/**
	 * Get the current site's WordPress.com ID.
	 *
	 * @return mixed The site's WordPress.com ID or an empty string.
	 */
	private static function get_wpcom_site_id() {
		if ( self::is_wpcom() ) {
			return get_current_blog_id();
		} elseif ( method_exists( 'Jetpack', 'is_active' ) && Jetpack::is_active() ) {
			return Jetpack_Options::get_option( 'id' );
		}
		return false;
	}

	/**
	 * Create site option key for service
	 *
	 * @param string $service The service  to create key for.
	 */
	private static function key_for_api_service( $service ) {
		return $service . '_api_key';
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Service_API_Keys' );
