<?php
/**
 * WP_REST_Help_Center_Search file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Search.
 */
class WP_REST_Help_Center_Search extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Search constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/search';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_results' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'query'   => array(
						'type' => 'string',
					),
					'locale'  => array(
						'type'    => 'string',
						'default' => 'en',
					),
					'section' => array(
						'type' => 'string',
					),
				),
			)
		);
	}

	/**
	 * Should return the search results
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function get_search_results( \WP_REST_Request $request ) {
		$query   = $request['query'];
		$locale  = $request['locale'];
		$section = $request['section'];
		$source  = $request['source'];

		$query_parameters = array(
			'query'  => $query,
			'locale' => $locale,
		);

		if ( ! empty( $section ) ) {
			$query_parameters['section'] = $section;
		}

		if ( ! empty( $source ) ) {
			$query_parameters['source'] = $source;
		}

		$body = $this->wpcom_request_client->request(
			'/help/search?' . http_build_query( $query_parameters )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
