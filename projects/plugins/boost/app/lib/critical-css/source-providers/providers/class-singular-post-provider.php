<?php
/**
 * Critical CSS Provider for singular posts.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

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
	const MAX_URLS = 10;

	/**
	 * Minimum number of posts to have Critical CSS generated in order for the whole process to be successful.
	 *
	 * @var integer
	 */
	const MIN_SUCCESS_URLS = 5;

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_critical_source_urls( $context_posts = array() ) {
		$links              = array();
		$context_post_types = wp_list_pluck( $context_posts, 'post_type' );

		$post_types = self::get_post_types();
		if ( ! empty( $context_post_types ) ) {
			$post_types = array_intersect( $post_types, $context_post_types );
		}
		foreach ( $post_types as $post_type ) {
			$query = self::post_type_query( $post_type );

			foreach ( $query->posts as $post ) {
				$url = get_permalink( $post );
				if ( ! empty( $url ) ) {
					$links[ $post_type ][] = $url;
				}
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

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_edit_url( $_provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		return null;
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
		$post_types = get_post_types(
			array(
				'public' => true,
			),
			'objects'
		);
		unset( $post_types['attachment'] );

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		$provider_post_types = array();
		// Generate a name => name array for backwards compatibility.
		foreach ( $post_types as $post_type ) {
			$provider_post_types[ $post_type->name ] = $post_type->name;
		}

		/**
		 * Filters the post types used for Critical CSS
		 *
		 * @param array $post_types The array of post types to be used
		 *
		 * @since   1.0.0
		 */
		return apply_filters(
			'jetpack_boost_critical_css_post_types_singular',
			apply_filters_deprecated(
				'jetpack_boost_critical_css_post_types',
				array(
					$provider_post_types,
				),
				'3.4.0',
				'jetpack_boost_critical_css_post_types_singular'
			),
			$post_types
		);
	}

	/**
	 * Create a new WP_Query to gather sample posts.
	 *
	 * @param string $post_type post type.
	 *
	 * @return \WP_Query
	 */
	public static function post_type_query( $post_type ) {
		/**
		 * Filters the WP_Query parameters used to gather sample posts
		 *
		 * @param array $args The arguments that will be used by WP_Query
		 *
		 * @since   1.0.0
		 */
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
