<?php
/**
 * Critical CSS Provider for singular posts.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers;

/**
 * Class Singular_Post_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class Singular_Post_Provider extends Provider {

	/**
	 * Provider name.
	 *
	 * @var string
	 */
	protected static $name = 'singular';

	/**
	 * Max number of posts to query.
	 *
	 * @var integer
	 */
	const MAX_URLS = 20;

	/**
	 * Minimum number of posts to have Critical CSS generated in order for the whole process to be successful.
	 *
	 * @var integer
	 */
	const MIN_SUCCESS_URLS = 10;

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_critical_source_urls() {
		$links = array();
		foreach ( self::get_post_types() as $post_type ) {
			$query = self::post_type_query( $post_type );

			foreach ( $query->posts as $post ) {
				$links[ $post_type ][] = get_permalink( $post );
			}
		}

		return $links;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( ! is_singular() ) {
			return array();
		}

		// For example: "singular_post".
		return array( self::$name . '_' . get_post_type() );
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_keys() {
		return array_keys( self::get_post_types() );
	}

	// phpcs:ignore
	/** @inheritdoc */
	public static function describe_key( $provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		$post_type = substr( $provider_key, strlen( static::$name ) + 1 );

		switch ( $post_type ) {
			case 'post':
				return __( 'Single post view', 'jetpack-boost' );

			case 'page':
				return __( 'Single page view', 'jetpack-boost' );

			case 'product':
				return __( 'Single product view', 'jetpack-boost' );

			default:
				return __( 'Custom post type', 'jetpack-boost' );
		}
	}

	/**
	 * Get post types that need Critical CSS.
	 *
	 * @return mixed|void
	 */
	public static function get_post_types() {
		$post_types = get_post_types( array( 'public' => true ) );
		unset( $post_types['attachment'] );

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		return apply_filters( 'jetpack_boost_critical_css_post_types', $post_types );
	}

	/**
	 * Create a new WP_Query to gather sample posts.
	 *
	 * @param string $post_type post type.
	 *
	 * @return \WP_Query
	 */
	public static function post_type_query( $post_type ) {
		$args = apply_filters(
			'jetpack_boost_critical_css_post_type_query',
			array(
				'orderby'                => 'ID',
				'post_type'              => $post_type,
				'posts_per_page'         => static::MAX_URLS, // phpcs:disable WordPress.WP.PostsPerPage.posts_per_page_posts_per_page
				'post_status'            => array( 'publish' ),
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
			)
		);

		return new \WP_Query( $args );
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_success_ratio() {
		return static::MIN_SUCCESS_URLS / static::MAX_URLS;
	}
}
