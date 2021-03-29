<?php
/**
 * joltw - To be named. jetpack#19212
 * Jetpack interface for calling atomic-auth-proxy on wpcom.
 *
 * @package automattic/jetpack
 * @since ???
 */

use Automattic\Jetpack\Connection\Client;

/**
 * joltw - Call wpcom atomic-auth-proxy from jetpack.
 *
 * @since ???
 */
class WPCOM_REST_API_V2_Endpoint_Joltw extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'joltw';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route($this->namespace, '/' . $this->rest_base . '/file(?P<path>/.+)?', [
			[
				'show_in_index' => false,
				'methods' => WP_REST_Server::READABLE,
				'callback' => [ $this, 'fetch_remote_media_file' ],
				'permission_callback' => [ $this, 'permission_check' ],
				'args' => [],
			],
		] );
	}

	public function permission_check( WP_REST_Request $request ) {
		return true;
		/*
		return (
			$this->is_requested_by_trusted_client() &&
			$this->is_site_accessible_by_current_user() &&
			$this->is_atomic_site() &&
			$this->is_active_site()
		);
		 */
	}

	public function fetch_remote_media_file( WP_REST_Request $request ) {
		$query_parameters = $request->get_query_params();
		if ( isset( $query_parameters['path'] ) ) {
			$path = $query_parameters['path'];
			unset( $query_parameters['path'] );
		} else {
			$path = $request->get_param( 'path' );
		}

		// 	'https://public-api.wordpress.com/wpcom/v2/sites/testsitemmrtag.wordpress.com/atomic-auth-proxy/file/wp-content/uploads/2021/03/drone-4.jpg?resize=214%2C214'
		$site_id = 190440205; // testsitemmrtag.wordpress.com
		$file_path = 'wp-content/uploads/2021/03/drone-4.jpg?resize=214%2C214';
		$endpoint = sprintf( '/sites/%d/atomic-auth-proxy/file/', $site_id ) . $file_path;
		/* return ['this' => 'works']; */

		//$abc = Client::wpcom_json_api_request_as_blog( 
		$abc = Client::wpcom_json_api_request_as_user( 
			$endpoint, 
			'2', 
			array(), //$args, 
			null,
			'wpcom' 
		); 
		return ['this' => 'works2', 'abc' => $abc];

		/*
		$remote_file_url = $this->build_remote_file_url(
			$path,
			$query_parameters
		);
		if ( is_wp_error( $remote_file_url ) ) {
			return $remote_file_url;
		}

		$cookies = $this->cached_fetch_read_access_cookies();
		if ( is_wp_error( $cookies ) ) {
			return $cookies;
		}

		$result = $this->stream_remote_file_to_browser( $request->get_method(), $remote_file_url, $cookies );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		die();
		*/
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Joltw' );
