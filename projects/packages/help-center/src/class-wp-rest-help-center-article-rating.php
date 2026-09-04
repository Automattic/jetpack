<?php
/**
 * WP_REST_Help_Center_Article_Rating file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Article_Rating.
 *
 * Proxies the "Was this helpful?" rating of a support article to WordPress.com,
 * so wp-admin users get the same per-user rating memory as Calypso users.
 */
class WP_REST_Help_Center_Article_Rating extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Article_Rating constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/article-rating';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_rating' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'blog_id' => array(
						'required' => true,
						'type'     => 'integer',
					),
					'post_id' => array(
						'required' => true,
						'type'     => 'integer',
					),
					'rating'  => array(
						'required' => true,
						'enum'     => array( 1, 2 ),
						'type'     => 'integer',
					),
				),
			)
		);
	}

	/**
	 * Forward the rating to WordPress.com and return the rating on record.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function save_rating( \WP_REST_Request $request ) {
		$body = $this->wpcom_request_client->request(
			'/help/article/rating',
			'2',
			array( 'method' => 'POST' ),
			array(
				'blog_id' => $request['blog_id'],
				'post_id' => $request['post_id'],
				'rating'  => $request['rating'],
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = rest_ensure_response( json_decode( wp_remote_retrieve_body( $body ) ) );

		// Pass the WordPress.com status through so clients see upstream failures as failures.
		$status = (int) wp_remote_retrieve_response_code( $body );
		if ( $status > 0 ) {
			$response->set_status( $status );
		}

		return $response;
	}
}
