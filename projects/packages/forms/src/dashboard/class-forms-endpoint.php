<?php
/**
 * Jetpack Forms dashboard REST endpoints (Forms list).
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use WP_Query;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * REST API endpoints for the Forms dashboard.
 */
class Forms_Endpoint {
	const REST_NAMESPACE = 'jetpack-forms/v1';

	/**
	 * Initialize the endpoint.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/forms',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_forms' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'page'     => array(
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					),
					'per_page' => array(
						'type'              => 'integer',
						'default'           => 20,
						'sanitize_callback' => 'absint',
					),
					'search'   => array(
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Permissions check.
	 *
	 * @return bool
	 */
	public static function permissions_check() {
		return current_user_can( 'edit_pages' );
	}

	/**
	 * Returns a paginated list of reusable forms (`jetpack_form` posts), including entry counts.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function get_forms( WP_REST_Request $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
		$search   = $request->get_param( 'search' );

		$args = array(
			'post_type'      => Contact_Form::POST_TYPE,
			// Include all "normal" statuses but exclude trash (handled in a future PR).
			'post_status'    => array( 'publish', 'draft', 'pending', 'future', 'private' ),
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'modified',
			'order'          => 'DESC',
		);

		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		$query = new WP_Query( $args );
		$items = array();

		foreach ( $query->posts as $post ) {
			// Count entries associated with this form via feedback.post_parent.
			$entries_query = new WP_Query(
				array(
					'post_type'      => Feedback::POST_TYPE,
					'post_status'    => array( 'publish', 'draft', 'spam', 'trash', 'jp-temp-feedback' ),
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'post_parent'    => $post->ID,
				)
			);

			$items[] = array(
				'id'           => $post->ID,
				'title'        => get_the_title( $post ),
				'status'       => $post->post_status,
				'modified'     => $post->post_modified,
				'entriesCount' => (int) $entries_query->found_posts,
				'editUrl'      => get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return rest_ensure_response(
			array(
				'items'       => $items,
				'totalItems'  => (int) $query->found_posts,
				'totalPages'  => (int) $query->max_num_pages,
				'currentPage' => $page,
			)
		);
	}
}
