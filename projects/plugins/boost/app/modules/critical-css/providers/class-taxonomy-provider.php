<?php //phpcs:ignoreFile Squiz.Commenting.VariableComment.Missing,Generic.Commenting.DocComment.MissingShort,Squiz.Commenting.FunctionComment.MissingParamTag
/**
 * Provides taxonomy support for critical CSS
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers;

/**
 * Class Taxonomy_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class Taxonomy_Provider extends Provider {

	protected static $name = 'taxonomy';

	const MAX_URLS         = 20;
	const MIN_SUCCESS_URLS = 10;

	/** @inheritdoc */
	public static function get_critical_source_urls() {
		$results = array();

		$taxonomies = self::get_available_taxonomies();

		foreach ( $taxonomies as $taxonomy ) {
			$terms = self::get_terms( $taxonomy );

			if ( ! $terms ) {
				continue;
			}

			foreach ( $terms as $term ) {
				$results[ $taxonomy ][] = get_term_link( $term, $taxonomy );
			}
		}

		return $results;
	}

	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( ! is_category() && ! is_tax() ) {
			return array();
		}

		// For example: "taxonomy_category".
		return array( self::$name . '_' . get_queried_object()->taxonomy );
	}

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

	/** @inheritdoc */
	public static function describe_key( $key ) {
		$taxonomy = substr( $key, strlen( static::$name ) + 1 );

		switch ( $taxonomy ) {
			case 'category':
				return __( 'Category view', 'jetpack-boost' );

			default:
				return __( 'View for custom taxonomy', 'jetpack-boost' );
		}
	}

	/**
	 * Which taxonomies should Critical CSS be generated for?
	 *
	 * @return array
	 */
	public static function get_available_taxonomies() {
		$taxonomies = get_taxonomies(
			array(
				'public'       => true,
				'show_in_rest' => true,
			),
			'names'
		);

		return array_filter( $taxonomies, 'is_taxonomy_viewable' );
	}

	/**
	 * Get a couple sample terms for a taxonomy.
	 *
	 * @param $taxonomy
	 *
	 * @return array
	 */
	public static function get_terms( $taxonomy ) {
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

	/** @inheritdoc */
	public static function get_success_ratio() {
		return static::MIN_SUCCESS_URLS / static::MAX_URLS;
	}
}
