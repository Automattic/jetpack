<?php
/**
 * Search initializer for the Jetpack plugin.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Initializer for the main Jetpack plugin.
 * Instantiate this initializer to enable Jetpack Search functionality.
 */
class Jetpack_Initializer extends Initializer {
	/**
	 * Initializes either the Classic Search or the Instant Search experience.
	 */
	public static function initialize() {
		// Check whether Jetpack Search should be initialized in the first place.
		if ( ! self::is_connected() || ! self::is_search_supported() ) {
			/**
			 * Fires when the Jetpack Search fails and would fallback to MySQL.
			 *
			 * @since Jetpack 7.9.0
			 * @param string $reason Reason for Search fallback.
			 * @param mixed  $data   Data associated with the request, such as attempted search parameters.
			 */
			do_action( 'jetpack_search_abort', 'inactive', null );
			return;
		}

		$blog_id = \Jetpack::get_option( 'id' );
		if ( ! $blog_id ) {
			do_action( 'jetpack_search_abort', 'no_blog_id', null );
			return;
		}

		// TODO: Port the search widget to package for milestone 2.
		require_once JETPACK__PLUGIN_DIR . 'modules/widgets/search.php';

		if ( Options::is_instant_enabled() ) {
			// Enable the instant search experience.
			Instant_Search::instance( $blog_id );

			// TODO: Port the settings class to the package.
			// Register instant search configurables as WordPress settings.
			require_once JETPACK__PLUGIN_DIR . 'modules/search/class-jetpack-search-settings.php';
			new \Jetpack_Search_Settings();

			// TODO: Port the Customberg class to the package.
			// Instantiate "Customberg", the live search configuration interface.
			require_once JETPACK__PLUGIN_DIR . 'modules/search/class-jetpack-search-customberg.php';
			\Automattic\Jetpack\Search\Jetpack_Search_Customberg::instance();

			// Enable configuring instant search within the Customizer.
			if ( class_exists( 'WP_Customize_Manager' ) ) {
				// TODO: Port this class to the package.
				require_once JETPACK__PLUGIN_DIR . 'modules/search/class-jetpack-search-customize.php';
				new \Jetpack_Search_Customize();
			}
		} else {
			// Enable the classic search experience.
			Classic_Search::instance( $blog_id );
		}
	}

	/**
	 * Check if site has been connected.
	 */
	public static function is_connected() {
		return \Jetpack::is_connection_ready();
	}

	/**
	 * Check if search is supported by current plan.
	 */
	public static function is_search_supported() {
		if ( method_exists( 'Jetpack_Plan', 'supports' ) ) {
			return \Jetpack_Plan::supports( 'search' );
		}
		return false;
	}
}
