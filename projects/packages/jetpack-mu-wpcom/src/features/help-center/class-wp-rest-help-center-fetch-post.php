<?php
/**
 * WP_REST_Help_Center_Fetch_Post file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Class WP_REST_Help_Center_Fetch_Post.
 */
class WP_REST_Help_Center_Fetch_Post extends \WP_REST_Controller {
	/**
	 * WP_REST_Help_Center_Fetch_Post constructor.
	 */
	public function __construct() {
		$this->namespace = 'help-center';
		$this->rest_base = 'fetch-post';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_post' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'blog_id'  => array(
						'type' => 'number',
					),
					'post_id'  => array(
						'type' => 'number',
					),
					'post_url' => array(
						'type' => 'string',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/articles',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_blog_post_articles' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'blog_id'  => array(
						'type'     => 'number',
						'required' => true,
					),
					'post_ids' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'string',
						),
					),
				),
			)
		);
	}

	/**
	 * Should return blog post articles.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function get_blog_post_articles( \WP_REST_Request $request ) {
		$query_parameters = array(
			'blog_id'  => $request['blog_id'],
			'post_ids' => $request['post_ids'],
		);
		$body             = Client::wpcom_json_api_request_as_user(
			'/help/articles?' . http_build_query( $query_parameters )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Should return the post.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function get_post( \WP_REST_Request $request ) {
		if ( isset( $request['post_url'] ) ) {
			$body = Client::wpcom_json_api_request_as_user(
				'/help/article?post_url=' . $request['post_url']
			);
		} else {
			$alternate_data = $this->get_post_alternate_data( $request['blog_id'], $request['post_id'] );
			if ( is_wp_error( $alternate_data ) ) {
				return $alternate_data;
			}

			$body = Client::wpcom_json_api_request_as_user(
				'/help/article/' . $alternate_data['blog_id'] . '/' . $alternate_data['post_id']
			);
		}

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Get the alternate data of the post according to the locale.
	 *
	 * @param int $blog_id The blog ID.
	 * @param int $post_id The post ID.
	 *
	 * @return array The alternate data.
	 */
	public function get_post_alternate_data( $blog_id, $post_id ) {
		$locale                 = Common\determine_iso_639_locale();
		$default_alternate_data = array(
			'post_id' => $post_id,
			'blog_id' => $blog_id,
		);
		if ( $locale === 'en' ) {
			return $default_alternate_data;
		}

		$body = Client::wpcom_json_api_request_as_user(
			"/support/alternates/$blog_id/posts/$post_id",
			'1.1',
			array(),
			null,
			'rest'
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ), true );
		if ( ! array_key_exists( $locale, $response ) ) {
			return $default_alternate_data;
		}

		$alternate_data = $response[ $locale ];
		return array(
			'blog_id' => $alternate_data['blog_id'],
			'post_id' => $alternate_data['page_id'],
		);
	}
}
