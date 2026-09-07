<?php
/**
 * Supported content post type discovery for Jetpack SEO.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Discovers the post types Jetpack SEO can list and edit via core REST.
 */
class Post_Types {

	/**
	 * Post types that are REST-visible but not content surfaces for SEO.
	 *
	 * @var string[]
	 */
	const EXCLUDED_POST_TYPES = array( 'attachment' );

	/**
	 * Return supported post type slugs.
	 *
	 * @return string[]
	 */
	public static function get_supported_content_types() {
		return array_keys( self::get_supported_content_type_objects() );
	}

	/**
	 * Return supported post type options for the Content tab.
	 *
	 * @return array<int,array{slug:string,label:string}>
	 */
	public static function get_supported_content_type_options() {
		$options = array();

		foreach ( self::get_supported_content_type_objects() as $post_type ) {
			$options[] = array(
				'slug'  => $post_type->name,
				'label' => wp_strip_all_tags( $post_type->label ),
			);
		}

		return $options;
	}

	/**
	 * Return supported post type objects keyed by slug.
	 *
	 * Supported means public, UI-visible, and REST-enabled so the SEO dashboard
	 * can both display and save the post through core-data. Attachments are
	 * excluded because their REST endpoint is media-specific, not an editable
	 * content surface for the SEO Content tab.
	 *
	 * @return \WP_Post_Type[]
	 */
	public static function get_supported_content_type_objects() {
		$post_types = get_post_types(
			array(
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			),
			'objects'
		);

		foreach ( self::EXCLUDED_POST_TYPES as $post_type ) {
			unset( $post_types[ $post_type ] );
		}

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		uasort( $post_types, array( __CLASS__, 'sort_post_type_objects' ) );

		return $post_types;
	}

	/**
	 * Sort core content types first, then custom types alphabetically by label.
	 *
	 * @param \WP_Post_Type $a First post type object.
	 * @param \WP_Post_Type $b Second post type object.
	 * @return int
	 */
	private static function sort_post_type_objects( $a, $b ) {
		$preferred = array(
			'post' => 0,
			'page' => 1,
		);

		$a_rank = $preferred[ $a->name ] ?? 99;
		$b_rank = $preferred[ $b->name ] ?? 99;

		if ( $a_rank !== $b_rank ) {
			return $a_rank - $b_rank;
		}

		return strcasecmp( $a->label, $b->label );
	}
}
