<?php
/**
 * Jetpack Related Posts Abilities Registration
 *
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack_Options;
use Jetpack_RelatedPosts;
use WP_Error;

/**
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 *
 * Exposes related-post lookups and the display-settings surface so AI agents
 * can read and update Related Posts through the standard `wp-abilities/v1`
 * REST surface.
 */
class Related_Posts_Abilities extends Registrar {

	// Mirrors the cap the upstream Related Posts ES query enforces; raising it
	// here would be silently truncated downstream.
	private const MAX_SIZE = 20;

	private const DEFAULT_SIZE = 3;

	private const OPTION_KEY = 'relatedposts';

	private const LAYOUTS = array( 'grid', 'list' );

	private const EDITABLE_FIELDS = array(
		'enabled',
		'show_headline',
		'show_thumbnails',
		'show_date',
		'show_context',
		'layout',
		'headline',
		'size',
	);

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
			'description' => __( 'Abilities for reading related posts and managing Related Posts display settings.', 'jetpack' ),
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

		$settings_schema = array(
			'type'       => 'object',
			'properties' => array(
				'enabled'         => array( 'type' => 'boolean' ),
				'show_headline'   => array( 'type' => 'boolean' ),
				'show_thumbnails' => array( 'type' => 'boolean' ),
				'show_date'       => array( 'type' => 'boolean' ),
				'show_context'    => array( 'type' => 'boolean' ),
				'layout'          => array(
					'type' => 'string',
					'enum' => self::LAYOUTS,
				),
				'headline'        => array( 'type' => 'string' ),
				'size'            => array( 'type' => 'integer' ),
			),
		);

		return array(
			'jetpack-related-posts/get-related-posts' => array(
				'label'               => __( 'Get related posts', 'jetpack' ),
				'description'         => __( 'Return related posts for a single post as an array of { id, url, title, excerpt, date, post_type, format }. The caller must be able to edit the source post (edit_post capability); unauthorized requests return jetpack_related_posts_forbidden. Backed by Elasticsearch via the Jetpack connection: when Related Posts is disabled, the post is unknown, or the ES backend is unreachable, the array is empty (not an error). Read-only and idempotent. Use jetpack-related-posts/get-settings to inspect the display configuration; use jetpack-modules/get-modules to confirm the related-posts module is active.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id' ),
					'properties'           => array(
						'post_id'          => array(
							'type'        => 'integer',
							'description' => __( 'WordPress post ID to find related posts for. Must reference an existing post.', 'jetpack' ),
							'minimum'     => 1,
						),
						'size'             => array(
							'type'        => 'integer',
							'description' => __( 'Maximum number of related posts to return. Defaults to 3, capped at 20.', 'jetpack' ),
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
				),
			),

			'jetpack-related-posts/get-settings'      => array(
				'label'               => __( 'Get Related Posts settings', 'jetpack' ),
				'description'         => __( 'Return the current Related Posts display settings as an object with enabled, show_headline, show_thumbnails, show_date, show_context, layout ("grid"|"list"), headline, and size. Read-only and idempotent. Pair with jetpack-related-posts/update-settings to change values; module activation itself is managed via jetpack-modules/set-module-status.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => $settings_schema,
				'execute_callback'    => array( __CLASS__, 'get_settings' ),
				'permission_callback' => array( __CLASS__, 'can_view_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-related-posts/update-settings'   => array(
				'label'               => __( 'Update Related Posts settings', 'jetpack' ),
				'description'         => __( 'Update one or more Related Posts display settings. Pass any subset of enabled, show_headline, show_thumbnails, show_date, show_context, layout, headline, size — omitted fields keep their current value. Idempotent: when no field differs from the current value, the call is a no-op and returns changed=false with an empty changed_fields array. Returns { settings, changed, changed_fields }. Does not toggle the related-posts module itself; use jetpack-modules/set-module-status for that.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'enabled'         => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to display related posts after single-post content.', 'jetpack' ),
						),
						'show_headline'   => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to render a headline above the related-posts list.', 'jetpack' ),
						),
						'show_thumbnails' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to render a thumbnail image for each related post.', 'jetpack' ),
						),
						'show_date'       => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to render the publish date for each related post.', 'jetpack' ),
						),
						'show_context'    => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to render category/tag context for each related post.', 'jetpack' ),
						),
						'layout'          => array(
							'type'        => 'string',
							'description' => __( 'Layout used to render the related-posts list.', 'jetpack' ),
							'enum'        => self::LAYOUTS,
						),
						'headline'        => array(
							'type'        => 'string',
							'description' => __( 'Headline rendered above the related-posts list when show_headline is true.', 'jetpack' ),
							'maxLength'   => 200,
						),
						'size'            => array(
							'type'        => 'integer',
							'description' => __( 'Default number of related posts to render. Must be between 1 and 20.', 'jetpack' ),
							'minimum'     => 1,
							'maximum'     => self::MAX_SIZE,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'settings'       => $settings_schema,
						'changed'        => array( 'type' => 'boolean' ),
						'changed_fields' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'update_settings' ),
				'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
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
	 * Permission check for reading the settings overview.
	 */
	public static function can_view_settings(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Permission check for updating the settings overview.
	 */
	public static function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
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

		$size = isset( $input['size'] ) && is_int( $input['size'] ) ? $input['size'] : self::DEFAULT_SIZE;
		$size = max( 1, min( self::MAX_SIZE, $size ) );

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
	 * Execute: return the current Related Posts settings.
	 *
	 * @param array|null $input Unused.
	 * @return array
	 */
	public static function get_settings( $input = null ) {
		unset( $input );
		return self::normalize_settings( Jetpack_Options::get_option( self::OPTION_KEY, array() ) );
	}

	/**
	 * Execute: declarative settings update. Idempotent.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function update_settings( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$updates = array_intersect_key( $input, array_flip( self::EDITABLE_FIELDS ) );
		if ( array() === $updates ) {
			return new WP_Error(
				'jetpack_related_posts_missing_field',
				__( 'Provide at least one editable field (enabled, show_headline, show_thumbnails, show_date, show_context, layout, headline, size).', 'jetpack' )
			);
		}

		if ( isset( $updates['layout'] )
			&& ! ( is_string( $updates['layout'] ) && in_array( $updates['layout'], self::LAYOUTS, true ) )
		) {
			return new WP_Error(
				'jetpack_related_posts_invalid_layout',
				__( 'The "layout" field must be either "grid" or "list".', 'jetpack' )
			);
		}

		if ( isset( $updates['size'] )
			&& ( ! is_int( $updates['size'] ) || $updates['size'] < 1 || $updates['size'] > self::MAX_SIZE )
		) {
			return new WP_Error(
				'jetpack_related_posts_invalid_size',
				sprintf(
					/* translators: %d: maximum size value. */
					__( 'The "size" field must be an integer between 1 and %d.', 'jetpack' ),
					self::MAX_SIZE
				)
			);
		}

		if ( isset( $updates['headline'] ) && ! is_string( $updates['headline'] ) ) {
			return new WP_Error(
				'jetpack_related_posts_invalid_headline',
				__( 'The "headline" field must be a string.', 'jetpack' )
			);
		}

		foreach ( array( 'enabled', 'show_headline', 'show_thumbnails', 'show_date', 'show_context' ) as $bool_field ) {
			if ( isset( $updates[ $bool_field ] ) ) {
				if ( ! is_bool( $updates[ $bool_field ] ) ) {
					return new WP_Error(
						'jetpack_related_posts_invalid_' . $bool_field,
						sprintf(
							/* translators: %s: input field name. */
							__( 'The "%s" field must be a boolean.', 'jetpack' ),
							$bool_field
						)
					);
				}
			}
		}

		$current = self::normalize_settings( Jetpack_Options::get_option( self::OPTION_KEY, array() ) );
		$merged  = array_merge( $current, $updates );

		$changed_fields = array();
		foreach ( $updates as $field => $value ) {
			if ( ! array_key_exists( $field, $current ) || $current[ $field ] !== $value ) {
				$changed_fields[] = $field;
			}
		}

		if ( array() === $changed_fields ) {
			return array(
				'settings'       => $current,
				'changed'        => false,
				'changed_fields' => array(),
			);
		}

		$saved = Jetpack_Options::update_option( self::OPTION_KEY, $merged );
		if ( ! $saved ) {
			return new WP_Error(
				'jetpack_related_posts_data_unavailable',
				__( 'Unable to save Related Posts settings. Try again or verify the site is connected to Jetpack.', 'jetpack' )
			);
		}

		return array(
			'settings'       => $merged,
			'changed'        => true,
			'changed_fields' => $changed_fields,
		);
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

	/**
	 * Coerce a raw Related Posts options array into the canonical
	 * agent-facing shape with stable types and sensible defaults.
	 *
	 * Mirrors the defaulting in `Jetpack_RelatedPosts::get_options()` without
	 * instantiating the full module class (which would attach admin/frontend
	 * hooks) and without using `init_raw()` (whose `get_options()` is a stub
	 * that only exposes `enabled`).
	 *
	 * @param array|mixed $options Raw options array (possibly from the DB).
	 * @return array
	 */
	private static function normalize_settings( $options ): array {
		$options = is_array( $options ) ? $options : array();

		$layout = isset( $options['layout'] ) && in_array( $options['layout'], self::LAYOUTS, true )
			? $options['layout']
			: 'grid';

		$size = isset( $options['size'] ) && (int) $options['size'] >= 1 ? (int) $options['size'] : self::DEFAULT_SIZE;

		return array(
			'enabled'         => ! empty( $options['enabled'] ),
			'show_headline'   => ! empty( $options['show_headline'] ),
			'show_thumbnails' => ! empty( $options['show_thumbnails'] ),
			'show_date'       => ! empty( $options['show_date'] ),
			'show_context'    => ! empty( $options['show_context'] ),
			'layout'          => $layout,
			'headline'        => isset( $options['headline'] ) ? (string) $options['headline'] : __( 'Related', 'jetpack' ),
			'size'            => $size,
		);
	}
}
