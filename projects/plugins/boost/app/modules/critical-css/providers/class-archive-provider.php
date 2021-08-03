<?php //phpcs:ignoreFile Squiz.Commenting.VariableComment.Missing,Generic.Commenting.DocComment.MissingShort,Squiz.Commenting.FunctionComment.MissingParamTag
/**
 * Archive provider class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers;

/**
 * Class Archive_Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
class Archive_Provider extends Provider {

	protected static $name = 'archive';

	/** @inheritdoc */
	public static function get_critical_source_urls() {
		$links = array();

		foreach ( self::get_post_types() as $post_type ) {
			$links[ $post_type ][] = get_post_type_archive_link( $post_type );
		}

		return $links;
	}

	/** @inheritdoc */
	public static function get_current_storage_keys() {
		if ( ! is_archive() ) {
			return array();
		}

		// For example: "archive_post".
		return array( self::$name . '_' . get_post_type() );
	}

	/** @inheritdoc */
	public static function get_keys() {
		return self::get_post_types();
	}

	/** @inheritdoc */
	public static function describe_key( $key ) {
		$post_type = substr( $key, strlen( static::$name ) + 1 );

		switch ( $post_type ) {
			case 'post':
				return __( 'Post archive view', 'jetpack-boost' );

			case 'page':
				return __( 'Page archive view', 'jetpack-boost' );

			default:
				return __( 'Archive page for custom post type', 'jetpack-boost' );
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
				'public'      => true,
				'has_archive' => true,
			)
		);
		unset( $post_types['attachment'] );

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		return apply_filters( 'jetpack_boost_critical_css_post_types', $post_types );
	}

	/** @inheritdoc */
	public static function get_success_ratio() {
		return 1;
	}
}
