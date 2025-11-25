<?php
/**
 * REST endpoints for Jetpack Forms dashboard (Forms list and stats).
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Forms\ContactForm\Feedback;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Forms_Endpoint
 *
 * Provides custom REST API endpoints for the Jetpack Forms dashboard.
 */
class Forms_Endpoint {

	const REST_NAMESPACE = 'jetpack-forms/v1';

	/**
	 * Initialize the REST API endpoints.
	 *
	 * @return void
	 */
	public static function init() {
		add_action(
			'rest_api_init',
			array( __CLASS__, 'register_routes' )
		);
	}

	/**
	 * Registers REST API routes.
	 *
	 * @return void
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

		register_rest_route(
			self::REST_NAMESPACE,
			'/forms/(?P<form_id>[A-Za-z0-9_-]+)/stats',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_form_stats' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'form_id' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Basic permissions check for Forms dashboard routes.
	 *
	 * @return bool
	 */
	public static function permissions_check() {
		return current_user_can( 'edit_pages' );
	}

	/**
	 * Returns a paginated list of synced patterns used as managed forms.
	 *
	 * @param WP_REST_Request $request The REST request.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_forms( WP_REST_Request $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
		$search   = $request->get_param( 'search' );

		$args = array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'modified',
			'order'          => 'DESC',
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_pattern_category',
					'field'    => 'slug',
					'terms'    => 'jetpack-forms',
				),
			),
		);

		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		$query = new WP_Query( $args );

		$items = array();

		foreach ( $query->posts as $post ) {
			// Determine the canonical form_id for this shared form by inspecting the pattern content.
			$form_id = null;
			$blocks  = parse_blocks( $post->post_content );

			$find_form_id = function ( $block ) use ( &$find_form_id, &$form_id ) {
				if ( isset( $block['blockName'] ) && 'jetpack/contact-form' === $block['blockName'] ) {
					if ( ! empty( $block['attrs']['jetpackFormId'] ) && is_string( $block['attrs']['jetpackFormId'] ) ) {
						$form_id = $block['attrs']['jetpackFormId'];
						return;
					}
				}
				if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
					foreach ( $block['innerBlocks'] as $inner_block ) {
						if ( null === $form_id ) {
							$find_form_id( $inner_block );
						}
					}
				}
			};

			foreach ( $blocks as $block ) {
				if ( null !== $form_id ) {
					break;
				}
				$find_form_id( $block );
			}

			// Fallback to the wp_block ID if no form_id attribute is found.
			if ( null === $form_id ) {
				$form_id = (string) $post->ID;
			}

			// Count responses associated with this form (via form_id meta).
			$responses_query = new WP_Query(
				array(
					'post_type'      => Feedback::POST_TYPE,
					'post_status'    => array( 'publish', 'draft', 'spam', 'trash', 'jp-temp-feedback' ),
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'meta_query'     => array(
						array(
							'key'   => '_jetpack_form_id',
							'value' => $form_id,
						),
					),
				)
			);

			$items[] = array(
				'id'             => $post->ID,
				'title'          => get_the_title( $post ),
				'modified'       => $post->post_modified,
				'formId'         => $form_id,
				'responsesCount' => (int) $responses_query->found_posts,
			);
		}

		$response = array(
			'items'       => $items,
			'totalItems'  => (int) $query->found_posts,
			'totalPages'  => (int) $query->max_num_pages,
			'currentPage' => $page,
		);

		return rest_ensure_response( $response );
	}

	/**
	 * Returns basic statistics for a given form, based on stored feedback entries.
	 *
	 * @param WP_REST_Request $request The REST request.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_form_stats( WP_REST_Request $request ) {
		$form_id = $request->get_param( 'form_id' );

		if ( empty( $form_id ) ) {
			return new WP_REST_Response(
				array(
					'message' => __( 'Missing form_id parameter.', 'jetpack-forms' ),
				),
				400
			);
		}

		$form_id = sanitize_text_field( wp_unslash( $form_id ) );

		$base_args = array(
			'post_type'      => Feedback::POST_TYPE,
			'post_status'    => array( 'publish', 'draft', 'spam', 'trash', 'jp-temp-feedback' ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array(
					'key'   => '_jetpack_form_id',
					'value' => $form_id,
				),
			),
		);

		$total_query = new WP_Query( $base_args );
		$total       = (int) $total_query->found_posts;

		$last_7_days_query = new WP_Query(
			array_merge(
				$base_args,
				array(
					'date_query' => array(
						array(
							'column' => 'post_date_gmt',
							'after'  => '7 days ago',
						),
					),
				)
			)
		);

		$last_7_days = (int) $last_7_days_query->found_posts;

		$stats = array(
			'total_responses'       => $total,
			'responses_last_7_days' => $last_7_days,
		);

		return rest_ensure_response( $stats );
	}
}
