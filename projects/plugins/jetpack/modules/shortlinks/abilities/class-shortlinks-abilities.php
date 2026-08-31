<?php
/**
 * Jetpack Shortlinks Abilities Registration
 *
 * Registers Jetpack WP.me Shortlinks abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack WP.me Shortlinks abilities with the WordPress Abilities API.
 *
 * Exposes a single read ability that returns wp.me shortlinks for the
 * requested posts and (optionally) the site homepage so AI agents can fetch
 * shareable URLs in bulk through the standard `wp-abilities/v1` REST surface.
 */
class Shortlinks_Abilities extends Registrar {

	/**
	 * Maximum number of post IDs accepted per call.
	 */
	const MAX_POST_IDS = 100;

	/**
	 * Returns the category slug this registrar owns.
	 *
	 * @return string
	 */
	public static function get_category_slug(): string {
		return 'jetpack-shortlinks';
	}

	/**
	 * Returns the category definition passed to wp_register_ability_category().
	 *
	 * @return array
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack WP.me Shortlinks',
			'description' => __( 'Abilities for retrieving wp.me shortlinks for posts, pages, attachments, and the site homepage.', 'jetpack' ),
		);
	}

	/**
	 * Returns the ability specs this registrar owns as a [ slug => spec ] map.
	 *
	 * @return array<string, array>
	 */
	public static function get_abilities(): array {
		$item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'post_id'    => array(
					'type'        => 'integer',
					'description' => __( '0 for the site homepage entry; otherwise the WordPress post ID.', 'jetpack' ),
				),
				'post_title' => array( 'type' => 'string' ),
				'post_type'  => array(
					'type'        => 'string',
					'description' => __( '"blog" for the homepage entry; otherwise the WordPress post type slug (post, page, attachment, or a CPT that supports shortlinks).', 'jetpack' ),
				),
				'shortlink'  => array(
					'type'        => 'string',
					'description' => __( 'The wp.me URL.', 'jetpack' ),
				),
				'target_url' => array(
					'type'        => 'string',
					'description' => __( 'The canonical permalink the shortlink resolves to.', 'jetpack' ),
				),
			),
		);

		return array(
			'jetpack-shortlinks/get-shortlinks' => array(
				'label'               => __( 'Get wp.me shortlinks', 'jetpack' ),
				'description'         => __( 'Return wp.me shortlinks for the given posts and (optionally) the site homepage. Each result is a { post_id, post_title, post_type, shortlink, target_url } object — post_id is 0 for the homepage entry, post_type is "blog". IDs that do not exist, are unreadable to the current user, or belong to a post type without shortlinks support are silently omitted (returns a shorter array, not WP_Error). Caps post_ids at 100 per call. Requires the WP.me Shortlinks Jetpack module (slug: shortlinks) to be active and the site to be connected; an unconnected site returns jetpack_shortlinks_blog_id_unavailable. Use jetpack/get-modules to verify the module is on, jetpack/set-module-status to activate it.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'post_ids'     => array(
							'type'        => 'array',
							'description' => __( 'Up to 100 post IDs to fetch shortlinks for. Order is preserved in the response. Defaults to an empty list.', 'jetpack' ),
							'maxItems'    => self::MAX_POST_IDS,
							'items'       => array(
								'type'    => 'integer',
								'minimum' => 1,
							),
						),
						'include_blog' => array(
							'type'        => 'boolean',
							'description' => __( 'When true, prepend a single entry for the site homepage (post_id 0, post_type "blog") to the response.', 'jetpack' ),
							'default'     => false,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $item_schema,
				),
				'execute_callback'    => array( __CLASS__, 'get_shortlinks' ),
				'permission_callback' => array( __CLASS__, 'can_view_shortlinks' ),
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
	 * Permission check: require edit_posts so only users with content-management
	 * rights may enumerate shortlinks. Per-post read capability is still
	 * enforced inside the execute callback so unreadable IDs are silently
	 * omitted rather than failing the whole call.
	 */
	public static function can_view_shortlinks(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Execute: return wp.me shortlinks for the requested posts and (optionally) the homepage.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function get_shortlinks( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( null === Connection_Manager::get_site_id( true ) ) {
			return new \WP_Error(
				'jetpack_shortlinks_blog_id_unavailable',
				__( 'No Jetpack/WordPress.com blog ID is available for this site. Connect Jetpack before requesting wp.me shortlinks.', 'jetpack' )
			);
		}

		$post_ids = array();
		if ( isset( $input['post_ids'] ) && is_array( $input['post_ids'] ) ) {
			foreach ( $input['post_ids'] as $candidate ) {
				$candidate_id = absint( $candidate );
				if ( $candidate_id > 0 ) {
					$post_ids[] = $candidate_id;
				}
			}
		}
		if ( count( $post_ids ) > self::MAX_POST_IDS ) {
			$post_ids = array_slice( $post_ids, 0, self::MAX_POST_IDS );
		}

		$include_blog = ! empty( $input['include_blog'] );

		$out = array();

		if ( $include_blog ) {
			$blog_shortlink = wp_get_shortlink( 0, 'blog' );
			if ( is_string( $blog_shortlink ) && '' !== $blog_shortlink ) {
				$out[] = array(
					'post_id'    => 0,
					'post_title' => (string) get_bloginfo( 'name' ),
					'post_type'  => 'blog',
					'shortlink'  => $blog_shortlink,
					'target_url' => home_url( '/' ),
				);
			}
		}

		if ( ! empty( $post_ids ) ) {
			_prime_post_caches( $post_ids, false, false );
		}

		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post || ! current_user_can( 'read_post', $post_id ) ) {
				continue;
			}
			$shortlink = wp_get_shortlink( $post_id, 'post' );
			if ( ! is_string( $shortlink ) || '' === $shortlink ) {
				continue;
			}
			$out[] = array(
				'post_id'    => (int) $post->ID,
				'post_title' => (string) $post->post_title,
				'post_type'  => (string) $post->post_type,
				'shortlink'  => $shortlink,
				'target_url' => (string) get_permalink( $post ),
			);
		}

		return $out;
	}
}
