<?php
/**
 * The per-post Likes switch in the REST API.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

use Automattic\Jetpack\Sharing_Likes\Settings\Likes_Options;

/**
 * Whether Like buttons show on a given post, as a REST field on every public post type.
 *
 * The post meta only records a choice that contradicts the sitewide default, so a
 * post without it follows whatever that default is at the time.
 */
final class Post_Likes_Switch {

	/**
	 * REST field the block editor reads and writes.
	 */
	public const FIELD = 'jetpack_likes_enabled';

	/**
	 * Post meta overriding the sitewide default: '1' forces Likes on, '0' forces them off.
	 */
	public const META_KEY = 'switch_like_status';

	/**
	 * Post type support the block editor checks before offering the switch.
	 */
	public const POST_TYPE_SUPPORT = 'jetpack-post-likes';

	/**
	 * Register the field whenever the REST API starts. Safe to call more than once.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_field' ) );
		// Theme-dependent CPTs (portfolios, testimonials) register earlier on this same hook.
		add_action( 'restapi_theme_init', array( __CLASS__, 'register_rest_field' ), 20 );
	}

	/**
	 * Add the field and the post type support to every public post type.
	 */
	public static function register_rest_field(): void {
		foreach ( get_post_types( array( 'public' => true ) ) as $post_type ) {
			register_rest_field(
				$post_type,
				self::FIELD,
				array(
					'get_callback'    => array( __CLASS__, 'get_value' ),
					'update_callback' => array( __CLASS__, 'update_value' ),
					'schema'          => array(
						'description' => __( 'Are Likes enabled?', 'jetpack-sharing-likes' ),
						'type'        => 'boolean',
					),
				)
			);

			add_post_type_support( $post_type, self::POST_TYPE_SUPPORT );
		}
	}

	/**
	 * Whether Likes show on the post. Null for a meta value that is neither '0' nor '1'.
	 *
	 * @param array $post Post data as the REST API prepared it.
	 */
	public static function get_value( array $post ): ?bool {
		if ( ! isset( $post['id'] ) ) {
			return false;
		}

		$switched = get_post_meta( $post['id'], self::META_KEY, true );

		if ( '' === $switched ) {
			return Likes_Options::likes_enabled_sitewide();
		}

		if ( '0' === $switched ) {
			return false;
		}

		if ( '1' === $switched ) {
			return true;
		}

		return null;
	}

	/**
	 * Store the choice for the post, or clear it where it matches the sitewide default.
	 *
	 * @param bool     $enable      Whether Likes should show on the post.
	 * @param \WP_Post $post_object The post being updated.
	 *
	 * @return int|bool What `update_post_meta()` or `delete_post_meta()` returned.
	 */
	public static function update_value( $enable, $post_object ) {
		if ( $enable !== Likes_Options::likes_enabled_sitewide() ) {
			return update_post_meta( $post_object->ID, self::META_KEY, $enable ? 1 : 0 );
		}

		return delete_post_meta( $post_object->ID, self::META_KEY );
	}
}
