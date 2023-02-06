<?php
/**
 * The Post ID provider class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

/**
 * Class Post_ID_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class Post_ID_Provider extends Provider {

	/**
	 * Post Ids storage key.
	 *
	 * @var string
	 */
	const STORAGE_KEY = 'jetpack_boost_critical_css_post_ids';

	/**
	 * Provider name.
	 *
	 * @var string
	 */
	protected static $name = 'post_id';

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_critical_source_urls( $context_posts = array() ) {
		$results          = array();
		$query            = self::get_posts();
		$context_post_ids = wp_list_pluck( $context_posts, 'ID' );

		if ( false === $query ) {
			return array();
		}

		foreach ( $query->posts as $post ) {
			if ( empty( $context_post_ids ) || in_array( $post->ID, $context_post_ids, true ) ) {
				$results[ $post->ID ] = array( get_permalink( $post ) );
			}
		}

		return $results;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( ! is_singular() ) {
			return array();
		}

		// For example: "post_id_123".
		return array( self::$name . '_' . get_the_ID() );
	}

	// phpcs:ignore
	/** @inheritdoc */
	public static function describe_key( $provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		return $provider_key;
	}

	/**
	 * Returns a key that can be used to identify the current page, if any exists.
	 *
	 * @return string|null
	 */
	public static function get_current_page_key() {
		$keys = static::get_current_storage_keys();

		if ( count( $keys ) > 0 ) {
			return $keys[0];
		} else {
			return null;
		}
	}

	/**
	 * Get post ids.
	 *
	 * @return array
	 */
	public static function get_post_ids() {
		// Store the IDs somewhere.
		return get_option( self::STORAGE_KEY, array() );
	}

	/**
	 * Add post id to storage.
	 *
	 * @param int $post_id Post Id.
	 *
	 * @return bool
	 */
	public static function add_post_id( $post_id ) {
		$post_ids = static::get_post_ids();

		if ( in_array( $post_id, $post_ids, true ) ) {
			return false;
		}

		$post_ids[] = (int) $post_id;

		return update_option( self::STORAGE_KEY, $post_ids );
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_keys() {
		return self::get_post_ids();
	}

	/**
	 * Create a new WP_Query to gather sample posts.
	 *
	 * @return false|\WP_Query
	 */
	public static function get_posts() {
		$ids = self::get_post_ids();

		if ( ! $ids ) {
			return false;
		}

		return new \WP_Query(
			array(
				'post__in'               => $ids,
				'posts_per_page'         => count( $ids ), // phpcs:disable WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'post_status'            => array( 'publish' ),
				'post_type'              => 'any',
				'no_found_rows'          => true,
				'ignore_sticky_posts'    => true,
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
			)
		);
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_success_ratio() {
		return 1;
	}
}
