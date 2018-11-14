<?php

require_once dirname( __FILE__ ) . '/publicize-connections.php';

/**
 * Publicize: List Connection Test Result Data
 *
 * All the same data as the Publicize Connections Endpoint, plus test results.
 *
 * @since 6.8
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Connection_Test_Results extends WPCOM_REST_API_V2_Endpoint_List_Publicize_Connections {
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/connection-test-results';

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
	 * Adds the test results properties to the Connection schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection-test-results',
			'type'       => 'object',
			'properties' => $this->get_connection_schema_properties() + array(
				'test_success' => array(
					'description' => __( 'Did the Publicize Connection test pass?', 'jetpack' ),
					'type'        => 'boolean',
				),
				'test_message' => array(
					'description' => __( 'Publicize Connection success or error message', 'jetpack' ),
					'type'        => 'string',
				),
				'can_refresh'  => array(
					'description' => __( 'Can the current user refresh the Publicize Connection?', 'jetpack' ),
					'type'        => 'boolean',
				),
				'refresh_text' => array(
					'description' => __( 'Message instructing the user to refresh their Connection to the Publicize Service', 'jetpack' ),
					'type'        => 'string',
				),
				'refresh_url'  => array(
					'description' => __( 'URL for refreshing the Connection to the Publicize Service', 'jetpack' ),
					'type'        => 'string',
					'format'      => 'uri',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * @param WP_REST_Request
	 * @see Publicize::get_publicize_conns_test_results()
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		global $publicize;

		$items = $this->get_connections();

		$test_results              = $publicize->get_publicize_conns_test_results();
		$test_results_by_unique_id = array();
		foreach ( $test_results as $test_result ) {
			$test_results_by_unique_id[ $test_result['unique_id'] ] = $test_result;
		}

		$mapping = array(
			'test_success' => 'connectionTestPassed',
			'test_message' => 'connectionTestMessage',
			'can_refresh'  => 'userCanRefresh',
			'refresh_text' => 'refreshText',
			'refresh_url'  => 'refreshURL',
		);

		foreach ( $items as &$item ) {
			$test_result = $test_results_by_unique_id[ $item['id'] ];

			foreach ( $mapping as $field => $test_result_field ) {
				$item[ $field ] = $test_result[ $test_result_field ];
			}
		}

		$response = rest_ensure_response( $items );

		$response->header( 'X-WP-Total', count( $items ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Connection_Test_Results' );
