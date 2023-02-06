<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Endpoint used to fetch information to connect to a Publicize service.
 *
 * @package automattic/jetpack
 */

/**
 * Publicize: List Publicize Services
 *
 * [
 *   { # Service Object. See schema for more detail.
 *     name:  (string) Service slug
 *     label: (string) Human readable label for the Service
 *     url:   (string) Connect URL
 *   },
 *   ...
 * ]
 *
 * @since 6.8
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Services extends WP_REST_Controller {
	/**
	 * Flag to help WordPress.com decide where it should look for
	 * Publicize data. Ignored for direct requests to Jetpack sites.
	 *
	 * @var bool $wpcom_is_wpcom_only_endpoint
	 */
	public $wpcom_is_wpcom_only_endpoint = true;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/services';

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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Schema for the publicize services endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-service',
			'type'       => 'object',
			'properties' => array(
				'name'  => array(
					'description' => __( 'Alphanumeric identifier for the Jetpack Social service', 'jetpack' ),
					'type'        => 'string',
				),
				'label' => array(
					'description' => __( 'Human readable label for the Jetpack Social service', 'jetpack' ),
					'type'        => 'string',
				),
				'url'   => array(
					'description' => __( 'The URL used to connect to the Jetpack Social service', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Retrieves available Publicize Services.
	 *
	 * @see Publicize::get_available_service_data()
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		global $publicize;

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			/**
			 * We need this because Publicize::get_available_service_data() uses `Jetpack_Keyring_Service_Helper`
			 * and `Jetpack_Keyring_Service_Helper` needs a `sharing` page to be registered.
			 */
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-keyring-service-helper.php';
			Jetpack_Keyring_Service_Helper::register_sharing_page();
		}

		$services_data = $publicize->get_available_service_data();

		$services = array();
		foreach ( $services_data as $service_data ) {
			$services[] = $this->prepare_item_for_response( $service_data, $request );
		}

		$response = rest_ensure_response( $services );
		$response->header( 'X-WP-Total', count( $services ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $service UI service connection data for a specific Publicize service.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return array filtered $service
	 */
	public function prepare_item_for_response( $service, $request ) {
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return $service;
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $service as $field => $value ) {
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

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Services' );
