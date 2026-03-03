<?php
/**
 * Jetpack Related Posts Abilities Registration
 *
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

/**
 * Class Related_Posts_Abilities
 *
 * Registers Jetpack Related Posts abilities with the WordPress Abilities API.
 * Provides abilities for discovering related posts programmatically.
 */
class Related_Posts_Abilities {

	/**
	 * The category slug for related posts abilities.
	 *
	 * @var string
	 */
	const CATEGORY_SLUG = 'jetpack-related-posts';

	/**
	 * Initialize the abilities registration.
	 *
	 * @return void
	 */
	public static function init() {
		// Register category
		if ( did_action( 'wp_abilities_api_categories_init' ) ) {
			self::register_category();
		} else {
			add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		}

		// Register abilities
		if ( did_action( 'wp_abilities_api_init' ) ) {
			self::register_abilities();
		} else {
			add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ) );
		}
	}

	/**
	 * Register the Jetpack Related Posts ability category.
	 *
	 * @return void
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY_SLUG,
			array(
				// "Jetpack Related Posts" is a product name and should not be translated.
				'label'       => 'Jetpack Related Posts',
				'description' => __( 'Abilities for discovering related posts.', 'jetpack' ),
			)
		);
	}

	/**
	 * Register all Jetpack Related Posts abilities.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		self::register_get_related_ability();
	}

	/**
	 * Register ability to get related posts.
	 *
	 * @return void
	 */
	private static function register_get_related_ability() {
		wp_register_ability(
			'jetpack/get-related-posts',
			array(
				'label'               => __( 'Get related posts', 'jetpack' ),
				'description'         => __( 'Find posts related to a given post. Returns related post data including title, URL, excerpt, date, author, and contextual relevance. Uses Elasticsearch via the WordPress.com API.', 'jetpack' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id' ),
					'properties'           => array(
						'post_id' => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the post to find related posts for.', 'jetpack' ),
						),
						'count'   => array(
							'type'        => 'integer',
							'description' => __( 'Number of related posts to return (1-10).', 'jetpack' ),
							'default'     => 3,
							'minimum'     => 1,
							'maximum'     => 10,
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_related_posts' ),
				'permission_callback' => array( __CLASS__, 'can_edit_posts' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Check if user can edit posts.
	 *
	 * @return bool
	 */
	public static function can_edit_posts() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get related posts callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of related posts or WP_Error on failure.
	 */
	public static function get_related_posts( $args ) {
		// Validate post_id is provided
		if ( ! isset( $args['post_id'] ) ) {
			return new \WP_Error(
				'missing_post_id',
				__( 'The post_id parameter is required.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$post_id = absint( $args['post_id'] );

		// Validate post exists
		$post = get_post( $post_id );
		if ( ! $post ) {
			return new \WP_Error(
				'post_not_found',
				__( 'The specified post does not exist.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		// Clamp count between 1 and 10
		$count = isset( $args['count'] ) ? absint( $args['count'] ) : 3;
		$count = max( 1, min( 10, $count ) );

		// Get related posts using the raw API (skips DOM/asset/hook side effects)
		$raw_instance  = \Jetpack_RelatedPosts::init_raw();
		$raw_hits      = $raw_instance->get_for_post_id( $post_id, array( 'size' => $count ) );
		$related_posts = array();

		// Enrich each hit with full post data
		foreach ( $raw_hits as $index => $hit ) {
			$related_post_data = $raw_instance->get_related_post_data_for_post(
				$hit['id'],
				$index,
				$post_id
			);

			// Build the response with requested fields
			$related_post = array(
				'id'      => $related_post_data['id'],
				'title'   => $related_post_data['title'],
				'url'     => $related_post_data['url'],
				'excerpt' => $related_post_data['excerpt'],
				'date'    => $related_post_data['date'],
			);

			// Include optional fields if available
			if ( ! empty( $related_post_data['author'] ) ) {
				$related_post['author'] = $related_post_data['author'];
			}
			if ( ! empty( $related_post_data['context'] ) ) {
				$related_post['context'] = $related_post_data['context'];
			}

			$related_posts[] = $related_post;
		}

		$result = array(
			'post_id'       => $post_id,
			'related_posts' => $related_posts,
		);

		// Add helpful message if no results
		if ( empty( $related_posts ) ) {
			$result['message'] = __( 'No related posts found. This may occur if posts have not been synced to the WordPress.com API yet, or if there are not enough published posts to find related content.', 'jetpack' );
		}

		return $result;
	}
}
