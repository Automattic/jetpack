<?php

/**
 */
class WPCOM_REST_API_V2_Endpoint_Options extends WP_REST_Controller {
	/**
	 * Flag to help WordPress.com decide where it should look for
	 * Publicize data. Ignored for direct requests to Jetpack sites.
	 *
	 * @var bool $wpcom_is_wpcom_only_endpoint
	 */
	public $wpcom_is_wpcom_only_endpoint = true;

	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'options';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_option' ),
 				  'permission_callback' => array( $this, 'permission_check' ),
				),
		#		'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function permission_check() {
		return true; #current_user_can( 'manage_options' );
	}

	public function update_option( $request ) {
		// $service = self::validate_service_api_service( $request['service'] );
		// if ( ! $service ) {
		// 	return self::service_api_invalid_service_response();
		// }
		// $json_params = $request->get_json_params();
		// $params     = ! empty( $json_params ) ? $json_params : $request->get_body_params();
		// $service_api_key    = trim( $params['service_api_key'] );
		// $option     = self::key_for_api_service( $service );
		// $validation = self::validate_service_api_key( $service_api_key, $service, $params );
		// if ( ! $validation['status'] ) {
		// 	return new WP_Error( 'invalid_key', esc_html__( 'Invalid API Key', 'jetpack' ), array( 'status' => 404 ) );
		// }
		$option = 'wpcom_site_type';
	  $message = esc_html__( 'API key updated successfully.', 'jetpack' );
		Jetpack_Options::update_option( $option, 'LALA' );
		return array(
			'code'            => 'success',
			'option'          => $option,
			'option_value'    => Jetpack_Options::get_option( $option, '' ),
			'message'         => $message,
		);
	}


	/**
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		$items = array();

		foreach ( $this->get_connections() as $item ) {
			$items[] = $this->prepare_item_for_response( $item, $request );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', count( $items ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $connection
	 * @param WP_REST_Request $request
	 * @return array filtered $connection
	 */
	public function prepare_item_for_response( $connection, $request ) {
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return $connection;
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $connection as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return $response_data;
	}

	/**
	 * Verify that user can access Publicize data
	 *
	 * @return true|WP_Error
	 */
	public function get_items_permission_check() {
		global $publicize;

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Publicize data on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Options' );
