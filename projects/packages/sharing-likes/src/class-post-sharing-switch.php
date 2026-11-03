<?php
/**
 * The per-post Sharing switch in the REST API.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

/**
 * Whether sharing buttons show on a given post, as a REST field on every public post type.
 *
 * A post can only opt out: without the meta it follows the sitewide setting, and it
 * cannot turn sharing on where that setting has it off.
 */
final class Post_Sharing_Switch {

	/**
	 * REST field the block editor reads and writes.
	 */
	public const FIELD = 'jetpack_sharing_enabled';

	/**
	 * Post meta that, when set, turns sharing buttons off on the post.
	 */
	public const META_KEY = 'sharing_disabled';

	/**
	 * Post type support the block editor checks before offering the switch.
	 */
	public const POST_TYPE_SUPPORT = 'jetpack-sharing-buttons';

	/**
	 * Register the field whenever the REST API starts. Safe to call more than once.
	 */
	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_field' ) );
		// Why this hook, at 20: see Post_Likes_Switch::init().
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
						'description' => __( 'Are sharing buttons enabled?', 'jetpack-sharing-likes' ),
						'type'        => 'boolean',
					),
				)
			);

			add_post_type_support( $post_type, self::POST_TYPE_SUPPORT );
		}
	}

	/**
	 * Whether sharing buttons may show on the post.
	 *
	 * @param array $post Post data as the REST API prepared it.
	 */
	public static function get_value( array $post ): bool {
		if ( ! isset( $post['id'] ) ) {
			return false;
		}

		return ! get_post_meta( $post['id'], self::META_KEY, true );
	}

	/**
	 * Clear the opt-out when enabling, set it when disabling.
	 *
	 * @param bool     $enable      Whether sharing buttons should show on the post.
	 * @param \WP_Post $post_object The post being updated.
	 *
	 * @return int|bool What `update_post_meta()` or `delete_post_meta()` returned.
	 */
	public static function update_value( $enable, $post_object ) {
		if ( $enable ) {
			return delete_post_meta( $post_object->ID, self::META_KEY );
		}

		return update_post_meta( $post_object->ID, self::META_KEY, true );
	}
}
