<?php
/**
 * The Publicize Connections Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Publicize\Publicize;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Connections Controller class.
 */
class Connections_Controller extends Base_Controller {

	/**
	 * The API version.
	 *
	 * @var string
	 */
	protected $version = 'v2';

	/**
	 * The base API path.
	 *
	 * @var string
	 */
	protected $base_api_path = 'wpcom';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/connections';

		$this->allow_requests_as_blog = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'test_connections' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to test connections.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$deprecated_fields = array(
			'id'                   => array(
				'type'        => 'string',
				'description' => __( 'Unique identifier for the Jetpack Social connection.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'connection_id'
				),
			),
			'username'             => array(
				'type'        => 'string',
				'description' => __( 'Username of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'external_handle'
				),
			),
			'profile_display_name' => array(
				'type'        => 'string',
				'description' => __( 'The name to display in the profile of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'display_name'
				),
			),
			'global'               => array(
				'type'        => 'boolean',
				'description' => __( 'Is this connection available to all users?', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'shared'
				),
			),
		);

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => array_merge(
				$deprecated_fields,
				self::get_the_item_schema()
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get the schema for the connection item.
	 *
	 * @return array
	 */
	public static function get_the_item_schema() {
		return array(
			'connection_id'   => array(
				'type'        => 'string',
				'description' => __( 'Connection ID of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'display_name'    => array(
				'type'        => 'string',
				'description' => __( 'Display name of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'external_handle' => array(
				'type'        => 'string',
				'description' => __( 'The external handle or username of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'external_id'     => array(
				'type'        => 'string',
				'description' => __( 'The external ID of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'profile_link'    => array(
				'type'        => 'string',
				'description' => __( 'Profile link of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'profile_picture' => array(
				'type'        => 'string',
				'description' => __( 'URL of the profile picture of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'service_label'   => array(
				'type'        => 'string',
				'description' => __( 'Human-readable label for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
			),
			'service_name'    => array(
				'type'        => 'string',
				'description' => __( 'Alphanumeric identifier for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
			),
			'shared'          => array(
				'type'        => 'boolean',
				'description' => __( 'Whether the connection is shared with other users.', 'jetpack-publicize-pkg' ),
			),
			'status'          => array(
				'type'        => 'string',
				'description' => __( 'The connection status.', 'jetpack-publicize-pkg' ),
				'enum'        => array(
					'ok',
					'broken',
				),
			),
			'user_id'         => array(
				'type'        => 'integer',
				'description' => __( 'ID of the user the connection belongs to. It is the user ID on wordpress.com', 'jetpack-publicize-pkg' ),
			),
		);
	}

	/**
	 * Get all connections. Meant to be called directly only on WPCOM.
	 *
	 * @param array $args Arguments
	 *                    - 'test_connections': bool Whether to run connection tests.
	 *                    - 'scope': enum('site', 'user') Which connections to include.
	 *
	 * @return array
	 */
	private static function wpcom_get_connections( $args = array() ) {
		/**
		 * Publicize instance.
		 */
		global $publicize;

		$items = array();

		$run_tests = $args['test_connections'] ?? false;

		$test_results = $run_tests ? self::get_connections_test_status() : array();

		// If a (Jetpack) blog request, return all the connections for that site.
		if ( self::is_authorized_blog_request() ) {
			$service_connections = $publicize->get_all_connections_for_blog_id( get_current_blog_id() );
		} else {
			$service_connections = (array) $publicize->get_services( 'connected' );
		}

		foreach ( $service_connections as $service_name => $connections ) {
			foreach ( $connections as $connection ) {

				$connection_id = $publicize->get_connection_id( $connection );

				$connection_meta = $publicize->get_connection_meta( $connection );
				$connection_data = $connection_meta['connection_data'];

				$items[] = array(
					'connection_id'        => $connection_id,
					'display_name'         => $publicize->get_display_name( $service_name, $connection ),
					'external_handle'      => $publicize->get_external_handle( $service_name, $connection ),
					'external_id'          => $connection_meta['external_id'] ?? '',
					'profile_link'         => $publicize->get_profile_link( $service_name, $connection ),
					'profile_picture'      => $publicize->get_profile_picture( $connection ),
					'service_label'        => Publicize::get_service_label( $service_name ),
					'service_name'         => $service_name,
					'shared'               => ! $connection_data['user_id'],
					'status'               => $test_results[ $connection_id ] ?? null,
					'user_id'              => (int) $connection_data['user_id'],

					// Deprecated fields.
					'id'                   => (string) $publicize->get_connection_unique_id( $connection ),
					'username'             => $publicize->get_username( $service_name, $connection ),
					'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
					// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
					'global'               => 0 == $connection_data['user_id'],

				);
			}
		}

		return $items;
	}

	/**
	 * Get a list of publicize connections.
	 *
	 * @param array $args Arguments.
	 *
	 * @see Automattic\Jetpack\Publicize\REST_API\Connections_Controller::get_all_connections()
	 *
	 * @return array
	 */
	public static function get_connections( $args = array() ) {
		if ( self::is_wpcom() ) {
			return self::wpcom_get_connections( $args );
		}

		// Since we are inside a static method, we can't use $this->proxy_request_to_wpcom().
		// So, lets us so an internal REST request.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/publicize/connections' );
		$request->set_param( 'test_connections', $args['test_connections'] ?? false );

		$context = ( $args['scope'] ?? '' ) === 'site' ? 'blog' : 'user';
		if ( ! defined( 'JETPACK_SOCIAL_REST_REQUEST_CONTEXT' ) ) {
			define( 'JETPACK_SOCIAL_REST_REQUEST_CONTEXT', $context );
		}
		$response = rest_do_request( $request );

		if ( $response->is_error() || is_wp_error( $response ) ) {
			// TODO log error.
			return array();
		}

		return $response->get_data();
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( self::is_wpcom() ) {
			$args = array( 'test_connections' => $request->get_param( 'test_connections' ) );

			$connections = self::wpcom_get_connections( $args );
		} else {
			// If this request was fired internally, we should have the constant defined.
			$context = defined( 'JETPACK_SOCIAL_REST_REQUEST_CONTEXT' ) ? JETPACK_SOCIAL_REST_REQUEST_CONTEXT : 'user';

			$connections = $this->proxy_request_to_wpcom( $request, '', $context );
		}

		if ( is_wp_error( $connections ) ) {
			return $connections;
		}

		$items = array();

		foreach ( $connections as $item ) {
			$data = $this->prepare_item_for_response( $item, $request );

			$items[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}

	/**
	 * Get the connections test status.
	 *
	 * @return array
	 */
	protected static function get_connections_test_status() {
		/**
		 * Publicize instance.
		 *
		 * @var \Automattic\Jetpack\Publicize\Publicize $publicize
		 */
		global $publicize;

		$test_results = $publicize->get_publicize_conns_test_results();

		$test_results_map = array();

		foreach ( $test_results as $test_result ) {
			// Compare to `true` because the API returns a 'must_reauth' for LinkedIn.
			$test_results_map[ $test_result['connectionID'] ] = true === $test_result['connectionTestPassed'] ? 'ok' : 'broken';
		}

		return $test_results_map;
	}
}
