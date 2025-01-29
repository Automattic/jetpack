<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Adds support for geo-location features.
 *
 * All Jetpack sites can support geo-location features.  Users can tag posts with geo-location data
 * using the UI provided by Calypso.  That information will be included in RSS feeds, meta tags during
 * wp_head, and in the Geo microformat following post content.
 *
 * If your theme declares support for "geo-location", you'll also get a small icon and location label
 * visible to users at the bottom of single posts and pages.
 *
 * To declare support in your theme, call `add_theme_support( 'jetpack-geo-location' )`.
 *
 * Once you've added theme support, you can rely on the standard HTML output generated in the
 * the_content_location_display() method of this class.  Or, you can use the "geo_location_display"
 * filter to generate custom HTML for your particular theme.  Your filter function will receive an
 * the default HTML as its first argument and an array containing the geo-location information as
 * its second argument in the following format:
 *
 * array(
 *     'is_public'    => boolean,
 *     'latitude'     => float,
 *     'longitude'    => float,
 *     'label'        => string,
 *     'is_populated' => boolean
 * )
 *
 * Add your filter with:
 *
 * add_filter( 'jetpack_geo_location_display', 'your_filter_function_name', 10, 2);
 */
class Jetpack_Geo_Location {
	/**
	 * Jetpack_Geo_Location singleton instance.
	 *
	 * @var Jetpack_Geo_Location|null
	 */
	private static $instance;

	/**
	 * Jetpack_Geo_Location instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Geo_Location();
		}

		return self::$instance;
	}

	/**
	 * Jetpack_Geo_Location class constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'wordpress_init' ) );
	}

	/**
	 * Register support for the geo-location feature on pages and posts.  Register the meta
	 * fields managed by this plugin so that they are properly sanitized during save.
	 */
	public function wordpress_init() {
		// Only render location label after post content, if the theme claims to support "geo-location".
		if ( current_theme_supports( 'jetpack-geo-location' ) ) {
			_deprecated_class( 'Jetpack_Geo_Location', '14.3', '' );
		}
	}
}

Jetpack_Geo_Location::init();
