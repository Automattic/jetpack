<?php
/**
 * Local Jetpack-side REST endpoint for the Posts to Podcast feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards `wp.apiFetch` calls from the wp-admin Create tab to the wpcom-side
 * endpoint as the current user (the upstream endpoint requires user identity).
 */
class Posts_To_Podcast_Endpoint extends WP_REST_Controller {

	const SUPPORTED_LENGTHS       = array( 'short', 'medium', 'long' );
	const SUPPORTED_VOICE_PRESETS = array( 'witty', 'earnest', 'professional' );

	/**
	 * Wire up routes if the feature is enabled for this site.
	 */
	public static function init() {
		if ( ! Posts_To_Podcast_Helper::is_enabled() ) {
			return;
		}

		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Register the GET (feature info), POST (enqueue), and job-status routes.
	 */
	public function register_routes() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'posts-to-podcast';

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_feature_info' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enqueue_generation' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'window'      => array(
							'type'        => 'object',
							'required'    => false,
							'description' => __( 'Either { unit: days|weeks|months, n: <positive int> } or { from, to } as ISO-8601 dates. Required when postIds is omitted.', 'jetpack-podcast' ),
						),
						'postIds'     => array(
							'type'        => 'array',
							'required'    => false,
							'items'       => array( 'type' => 'integer' ),
							'description' => __( 'Explicit list of published post IDs to draw from. Required when window is omitted.', 'jetpack-podcast' ),
						),
						'length'      => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => self::SUPPORTED_LENGTHS,
							'description' => __( 'Length preset id.', 'jetpack-podcast' ),
						),
						'voicePreset' => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => self::SUPPORTED_VOICE_PRESETS,
							'description' => __( 'Voice preset id.', 'jetpack-podcast' ),
						),
						'prompt'      => array(
							'type'        => 'string',
							'required'    => false,
							'description' => __( 'Optional free-form instructions appended to the generation prompt.', 'jetpack-podcast' ),
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/jobs/(?P<job_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_job_status' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'job_id' => array(
							'type'     => 'integer',
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/episodes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_episodes' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'page'     => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 5,
							'minimum' => 1,
							'maximum' => 50,
						),
					),
				),
			)
		);
	}

	/**
	 * Return posts that embed a `jetpack/podcast-episode` block — the surface
	 * this feature creates on success — newest first. Drafts and published
	 * posts only; trashed/auto-drafts are excluded.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response
	 */
	public function read_episodes( WP_REST_Request $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = max( 1, min( 50, (int) $request->get_param( 'per_page' ) ) );

		$query = new \WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => array( 'draft', 'publish' ),
				'posts_per_page'         => $per_page,
				'paged'                  => $page,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_term_cache' => false,
				'meta_query'             => array(
					array(
						'key'     => 'posts_to_podcast_metadata',
						'compare' => 'EXISTS',
					),
				),
			)
		);

		$items = array();
		foreach ( $query->posts as $post ) {
			$raw_meta = get_post_meta( $post->ID, 'posts_to_podcast_metadata', true );
			$meta     = is_string( $raw_meta ) ? json_decode( $raw_meta, true ) : null;
			$audio    = ( is_array( $meta ) && isset( $meta['audio'] ) && is_array( $meta['audio'] ) ) ? $meta['audio'] : array();
			$title    = wp_strip_all_tags(
				html_entity_decode( (string) get_the_title( $post ), ENT_QUOTES | ENT_HTML5, 'UTF-8' )
			);
			if ( '' === trim( $title ) ) {
				// translators: Fallback shown in the Generated podcasts list when a draft has an empty title.
				$title = __( '(no title)', 'jetpack-podcast' );
			}

			$items[] = array(
				'id'        => $post->ID,
				'title'     => $title,
				'status'    => $post->post_status,
				'date'      => mysql2date( 'c', $post->post_date_gmt, false ),
				'editUrl'   => get_edit_post_link( $post->ID, 'raw' ),
				'mediaUrl'  => isset( $audio['url'] ) ? esc_url_raw( (string) $audio['url'] ) : '',
				'mediaType' => 'audio',
				'mediaMime' => isset( $audio['mimeType'] ) ? (string) $audio['mimeType'] : '',
				'duration'  => isset( $audio['durationSeconds'] ) ? (int) round( (float) $audio['durationSeconds'] ) : 0,
			);
		}

		$total       = (int) $query->found_posts;
		$total_pages = $per_page > 0 ? (int) ceil( $total / $per_page ) : 0;

		return rest_ensure_response(
			array(
				'items'      => $items,
				'total'      => $total,
				'page'       => $page,
				'perPage'    => $per_page,
				'totalPages' => $total_pages,
			)
		);
	}

	/**
	 * Forward GET to the wpcom-side endpoint and return feature info
	 * (remaining credits, plan, supported presets).
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_feature_info() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast', $blog_id ),
			'2',
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 15,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Forward POST to the wpcom-side endpoint and return the queued job descriptor.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function enqueue_generation( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$body_payload = array(
			'length'      => $request->get_param( 'length' ),
			'voicePreset' => $request->get_param( 'voicePreset' ),
		);

		$window = $request->get_param( 'window' );
		if ( null !== $window ) {
			$body_payload['window'] = $window;
		}

		$post_ids = $request->get_param( 'postIds' );
		if ( is_array( $post_ids ) && ! empty( $post_ids ) ) {
			$body_payload['postIds'] = array_values( array_map( 'intval', $post_ids ) );
		}

		$prompt = $request->get_param( 'prompt' );
		if ( is_string( $prompt ) && '' !== $prompt ) {
			$body_payload['prompt'] = $prompt;
		}

		if ( ! isset( $body_payload['window'] ) && ! isset( $body_payload['postIds'] ) ) {
			return new WP_Error( 'missing-source', __( 'One of window or postIds is required.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast', $blog_id ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 30,
			),
			wp_json_encode( $body_payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Forward GET to the wpcom-side polling endpoint and return the job record.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_job_status( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$job_id = (int) $request['job_id'];

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast/jobs/%d', $blog_id, $job_id ),
			'2',
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 15,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Relay an upstream Connection\Client response back to the local REST client.
	 * Preserves the upstream HTTP status code so 202/4xx/5xx mappings flow through.
	 *
	 * @param array|\WP_Error $response The raw response from Client::wpcom_json_api_request_as_user.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function relay_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code    = (int) wp_remote_retrieve_response_code( $response );
		$body    = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );

		$rest_response = rest_ensure_response( null === $decoded ? $body : $decoded );
		if ( $code >= 100 && $code < 600 ) {
			$rest_response->set_status( $code );
		}
		return $rest_response;
	}
}
