<?php
/**
 * Provides taxonomy support for critical CSS
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

/**
 * Class Taxonomy_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class Taxonomy_Provider extends Provider {

	/**
	 * Provider name.
	 *
	 * @var string
	 */
	protected static $name = 'taxonomy';

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
		$results = array();

		$taxonomies = self::get_available_taxonomies();
		if ( ! empty( $context_posts ) ) {
			$context_post_types = array_unique( wp_list_pluck( $context_posts, 'post_type' ) );
			$context_taxonomies = get_object_taxonomies( $context_post_types, 'names' );
			$taxonomies         = array_intersect( $taxonomies, $context_taxonomies );
		}

		foreach ( $taxonomies as $taxonomy ) {
			$terms = self::get_terms( $taxonomy );

			if ( ! $terms ) {
				continue;
			}

			foreach ( $terms as $term ) {
				$url = get_term_link( $term, $taxonomy );
				if ( ! is_wp_error( $url ) && ! empty( $url ) ) {
					$results[ $taxonomy ][] = $url;
				}
			}
		}

		return $results;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( ! is_category() && ! is_tax() ) {
			return array();
		}

		if ( ! get_queried_object() ) {
			return array();
		}

		// For example: "taxonomy_category".
		return array( self::$name . '_' . get_queried_object()->taxonomy );
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_keys() {
		return array_keys(
			array_filter(
				self::get_available_taxonomies(),
				function ( $taxonomy ) {
					return ! empty( Taxonomy_Provider::get_terms( $taxonomy ) );
				}
			)
		);
	}

	// phpcs:ignore
	/** @inheritdoc */
	public static function describe_key( $provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		$taxonomy = substr( $provider_key, strlen( static::$name ) + 1 );

		switch ( $taxonomy ) {
			case 'category':
				return __( 'Category view', 'jetpack-boost' );

			default:
				return __( 'View for custom taxonomy', 'jetpack-boost' );
		}
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_edit_url( $_provider_key ) { // phpcs:ignore Generic.Commenting.DocComment.MissingShort
		return null;
	}

	/**
	 * Which taxonomies should Critical CSS be generated for.
	 *
	 * @return array
	 */
	public static function get_available_taxonomies() {
		$taxonomies = get_taxonomies(
			array(
				'public'       => true,
				'show_in_rest' => true,
			),
			'objects'
		);

		$taxonomies = array_filter( $taxonomies, 'is_taxonomy_viewable' );

		$provider_taxonomies = array();
		// Generate a name => name array for backwards compatibility.
		foreach ( $taxonomies as $taxonomy ) {
			$provider_taxonomies[ $taxonomy->name ] = $taxonomy->name;
		}

		return $provider_taxonomies;
	}

	/**
	 * Get a couple sample terms for a taxonomy.
	 *
	 * @param string $taxonomy Taxonomy.
	 *
	 * @return array
	 */
	public static function get_terms( $taxonomy ) {
		/**
		 * Filters the WP_Term_Query args to get a sample of terms for a taxonomy
		 *
		 * @param array $args The arguments that will be used by WP_Term_Query
		 *
		 * @since   1.0.0
		 */
		$args = apply_filters(
			'jetpack_boost_critical_css_terms_query',
			array(
				'fields'                 => 'ids',
				'taxonomy'               => $taxonomy,
				'orderby'                => 'term_order',
				'number'                 => static::MAX_URLS,
				'hide_empty'             => true,
				'hierarchical'           => false,
				'update_term_meta_cache' => false,
			)
		);

		return ( new \WP_Term_Query( $args ) )->terms;
	}

	// phpcs:ignore Generic.Commenting.DocComment.MissingShort
	/** @inheritdoc */
	public static function get_success_ratio() {
		return static::MIN_SUCCESS_URLS / static::MAX_URLS;
	}
}
