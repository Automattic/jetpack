<?php
/**
 * WP_REST_Help_Center_Fetch_Post file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Fetch_Post.
 */
class WP_REST_Help_Center_Fetch_Post extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Fetch_Post constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
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
				'permission_callback' => '__return_true',
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
				'permission_callback' => '__return_true',
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
		$body             = $this->wpcom_request_client->request(
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
			$body = $this->wpcom_request_client->request(
				'/help/article?post_url=' . $request['post_url']
			);
		} else {
			$alternate_data = $this->get_post_alternate_data( $request['blog_id'], $request['post_id'] );
			if ( is_wp_error( $alternate_data ) ) {
				return $alternate_data;
			}

			$body = $this->wpcom_request_client->request(
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
		$locale                 = Help_Center::determine_iso_639_locale();
		$default_alternate_data = array(
			'post_id' => $post_id,
			'blog_id' => $blog_id,
		);
		if ( $locale === 'en' ) {
			return $default_alternate_data;
		}

		$body = $this->wpcom_request_client->request(
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
