<?php
/**
 * Jetpack Related Posts Abilities Registration
 *
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_RelatedPosts;
use WP_Error;

/**
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 *
 * Exposes related-post lookups through the standard `wp-abilities/v1` REST
 * surface. Display-settings management is intentionally not exposed: classic
 * themes consume the `relatedposts` option only when an off-by-default filter
 * is enabled, and block themes ignore it altogether (rendering is controlled
 * per-instance by the Jetpack Related Posts block in templates) — so an agent
 * editing those values would be writing data nothing reads.
 */
class Related_Posts_Abilities extends Registrar {

	// Mirrors the cap the upstream Related Posts ES query enforces; raising it
	// here would be silently truncated downstream.
	private const MAX_SIZE = 20;

	private const DEFAULT_SIZE = 3;

	/**
	 * Returns the category slug this registrar owns.
	 */
	public static function get_category_slug(): string {
		return 'jetpack-related-posts';
	}

	/**
	 * Returns the category definition passed to wp_register_ability_category().
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Related Posts',
			'description' => __( 'Abilities for reading related posts.', 'jetpack' ),
		);
	}

	/**
	 * Returns the abilities this registrar owns as a [ slug => spec ] map.
	 */
	public static function get_abilities(): array {
		$related_post_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'        => array( 'type' => 'integer' ),
				'url'       => array( 'type' => 'string' ),
				'title'     => array( 'type' => 'string' ),
				'excerpt'   => array( 'type' => 'string' ),
				'date'      => array( 'type' => 'string' ),
				'post_type' => array( 'type' => 'string' ),
				'format'    => array( 'type' => array( 'string', 'null' ) ),
			),
		);

		return array(
			'jetpack-related-posts/get-related-posts' => array(
				'label'               => __( 'Get related posts', 'jetpack' ),
				'description'         => __( 'Return related posts for a single post as an array of { id, url, title, excerpt, date, post_type, format }. The caller must be able to edit the source post (edit_post capability); unauthorized requests return jetpack_related_posts_forbidden. Backed by Elasticsearch via the Jetpack connection: when Related Posts is disabled, the post is unknown, or the ES backend is unreachable, the array is empty (not an error). Use per_page to control the result count (1..20, default 20); the underlying Elasticsearch query is hard-capped at 20, so values above 20 are rejected by the input schema and pagination beyond the first 20 results is not supported. The legacy "size" alias is accepted for backward compatibility and defaults to 3 when no per_page is supplied. Read-only and idempotent. Use jetpack-modules/get-modules to confirm the related-posts module is active.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id' ),
					'properties'           => array(
						'post_id'          => array(
							'type'        => 'integer',
							'description' => __( 'WordPress post ID to find related posts for. Must reference an existing post.', 'jetpack' ),
							'minimum'     => 1,
						),
						'per_page'         => array(
							'type'        => 'integer',
							'description' => __( 'Maximum number of related posts to return per call. Must be between 1 and 20 — the Elasticsearch backend hard-caps results at 20, so larger values are not supported and pagination past the first 20 results is unavailable. Defaults to 20.', 'jetpack' ),
							'minimum'     => 1,
							'maximum'     => self::MAX_SIZE,
							'default'     => self::MAX_SIZE,
						),
						'size'             => array(
							'type'        => 'integer',
							'description' => __( 'Deprecated alias for per_page. Defaults to 3 when per_page is omitted. Capped at 20.', 'jetpack' ),
							'minimum'     => 1,
							'maximum'     => self::MAX_SIZE,
							'default'     => self::DEFAULT_SIZE,
						),
						'post_type'        => array(
							'type'        => 'string',
							'description' => __( 'Restrict matches to a single post type slug (e.g. "post", "page"). Defaults to the source post\'s type.', 'jetpack' ),
							'minLength'   => 1,
						),
						'exclude_post_ids' => array(
							'type'        => 'array',
							'description' => __( 'Post IDs to exclude from the result.', 'jetpack' ),
							'items'       => array(
								'type'    => 'integer',
								'minimum' => 1,
							),
							'default'     => array(),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $related_post_schema,
				),
				'execute_callback'    => array( __CLASS__, 'get_related_posts' ),
				'permission_callback' => array( __CLASS__, 'can_view_related_posts' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),
		);
	}

	/**
	 * Permission gate for the ability menu.
	 *
	 * Returns true if the caller can edit any post — keeps the ability listed
	 * for agents that have at least one editable post. The actual per-post
	 * authorization runs inside `get_related_posts()` once the source post_id
	 * is known, mirroring the existing /wpcom/v2/related-posts/{id} endpoint.
	 */
	public static function can_view_related_posts(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Execute: return related posts for a given post.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error Array of related-post summaries, or WP_Error on validation failure.
	 */
	public static function get_related_posts( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$post_id = isset( $input['post_id'] ) ? (int) $input['post_id'] : 0;
		if ( $post_id <= 0 ) {
			return new WP_Error(
				'jetpack_related_posts_missing_post_id',
				__( 'A post_id is required to fetch related posts.', 'jetpack' )
			);
		}

		$post = get_post( $post_id );
		if ( null === $post || empty( $post->ID ) ) {
			return new WP_Error(
				'jetpack_related_posts_invalid_post_id',
				__( 'Unknown post ID. Verify the post exists and is accessible.', 'jetpack' )
			);
		}

		// Match the per-post gate the existing /wpcom/v2/related-posts/{id}
		// endpoint uses: the broad `edit_posts` cap on permission_callback lets
		// the ability appear in the agent menu, but the actual lookup is
		// authorized only when the caller can edit this specific post.
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'jetpack_related_posts_forbidden',
				__( 'You are not allowed to fetch related posts for this post.', 'jetpack' )
			);
		}

		if ( isset( $input['per_page'] ) && is_int( $input['per_page'] ) ) {
			// per_page wins when both are supplied; schema enforces the 1..MAX_SIZE
			// range, the clamp here is defense in depth for direct callers that
			// bypass schema validation.
			$size = max( 1, min( self::MAX_SIZE, $input['per_page'] ) );
		} elseif ( isset( $input['size'] ) && is_int( $input['size'] ) ) {
			$size = max( 1, min( self::MAX_SIZE, $input['size'] ) );
		} else {
			$size = self::DEFAULT_SIZE;
		}

		$args = array( 'size' => $size );

		if ( isset( $input['post_type'] ) && is_string( $input['post_type'] ) && '' !== $input['post_type'] ) {
			$args['post_type'] = $input['post_type'];
		}

		if ( isset( $input['exclude_post_ids'] ) && is_array( $input['exclude_post_ids'] ) ) {
			$args['exclude_post_ids'] = array_values(
				array_filter(
					array_map( 'intval', $input['exclude_post_ids'] ),
					static function ( $id ) {
						return $id > 0;
					}
				)
			);
		}

		$results = self::related_posts_instance()->get_for_post_id( $post->ID, $args );
		if ( ! is_array( $results ) || array() === $results ) {
			return array();
		}

		// Prime the post cache once so `get_post_type()` inside summarize_related_post
		// doesn't trigger N individual lookups when the cache is cold.
		_prime_post_caches( wp_list_pluck( $results, 'id' ), false, false );

		$out = array();
		foreach ( $results as $related ) {
			$out[] = self::summarize_related_post( $related );
		}
		return $out;
	}

	/**
	 * Returns the Jetpack Related Posts raw instance, loading the class file lazily
	 * when it has not been included by the module's own load action yet.
	 *
	 * @return \Jetpack_RelatedPosts
	 */
	private static function related_posts_instance() {
		if ( ! class_exists( Jetpack_RelatedPosts::class, false ) ) {
			require_once __DIR__ . '/../jetpack-related-posts.php';
		}
		return Jetpack_RelatedPosts::init_raw();
	}

	/**
	 * Reduce the rich Related Posts result to a high-signal summary.
	 *
	 * @param array $related Single related-post entry from get_for_post_id().
	 * @return array
	 */
	private static function summarize_related_post( array $related ): array {
		$id = isset( $related['id'] ) ? (int) $related['id'] : 0;

		return array(
			'id'        => $id,
			'url'       => isset( $related['url'] ) ? (string) $related['url'] : '',
			'title'     => isset( $related['title'] ) ? (string) $related['title'] : '',
			'excerpt'   => isset( $related['excerpt'] ) ? (string) $related['excerpt'] : '',
			'date'      => isset( $related['date'] ) ? (string) $related['date'] : '',
			'post_type' => $id > 0 ? (string) get_post_type( $id ) : '',
			'format'    => isset( $related['format'] ) && '' !== $related['format'] ? (string) $related['format'] : null,
		);
	}
}
