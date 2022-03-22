<?php
/**
 * Search initializer for the Jetpack plugin.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Initializer for the main Jetpack plugin. Instantiate to enable Jetpack Search functionality.
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

		$blog_id = Helper::get_wpcom_site_id();
		if ( ! $blog_id ) {
			do_action( 'jetpack_search_abort', 'no_blog_id', null );
			return;
		}

		// registers Jetpack Search widget.
		add_action( 'widgets_init', array( 'Automattic\Jetpack\Search\Jetpack_Initializer', 'jetpack_search_widget_init' ) );

		if ( Options::is_instant_enabled() ) {
			// Enable the instant search experience.
			Instant_Search::initialize( $blog_id );

			// Register instant search configurables as WordPress settings.
			new Settings();

			// Instantiate "Customberg", the live search configuration interface.
			Customberg::instance();

			// Enable configuring instant search within the Customizer.
			if ( class_exists( 'WP_Customize_Manager' ) ) {
				new Customizer();
			}
		} else {
			// Enable the classic search experience.
			Classic_Search::initialize( $blog_id );
		}
	}

	/**
	 * Check if site has been connected.
	 */
	public static function is_connected() {
		return ( new Connection_Manager( Package::SLUG ) )->is_connected();
	}

	/**
	 * Check if search is supported by current plan.
	 */
	public static function is_search_supported() {
		return ( new Plan() )->supports_search();
	}

	/**
	 * Register the widget if Jetpack Search is available and enabled.
	 */
	public static function jetpack_search_widget_init() {
		if (
		! self::is_connected()
		|| ! self::is_search_supported()
		|| ! ( new Module_Control() )->is_active()
		) {
			return;
		}

		// There won't be multiple widgets registered when Search stand alone plugin registers it again.
		// Because the function tests the hash of the class, if they are the same, just register again.
		register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
	}
}
