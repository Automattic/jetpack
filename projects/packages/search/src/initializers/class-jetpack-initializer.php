<?php
/**
 * Search initializer for the Jetpack plugin.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Initializer for the main Jetpack plugin. Instantiate to enable Jetpack Search functionality.
 */
class Jetpack_Initializer extends Initializer {
	/**
	 * Initializes either the Classic Search or the Instant Search experience.
	 */
	public static function initialize() {
		if ( static::$initialized ) {
			return;
		}
		static::$initialized = true;

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		// The dashboard has to be initialized outside the module, otherwise which wouldn't load if module disabled.
		( new Dashboard() )->init_hooks();

		// Check whether Jetpack Search should be initialized in the first place .
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

		static::init_cli();

		$module_control = new Module_Control();

		if ( ! $module_control->is_active() ) {
			do_action( 'jetpack_search_abort', 'module_inactive', null );
			return;
		}

		if ( $module_control->is_instant_search_enabled() ) {
			// Enable the instant search experience.
			Instant_Search::initialize( $blog_id );

			// Register instant search configurables as WordPress settings.
			new Settings();

			// Instantiate "Customberg", the live search configuration interface.
			Customberg::instance();

			// Enable configuring instant search within the Customizer.
			if ( class_exists( 'WP_Customize_Manager' ) ) {
				// TODO: Port this class to the package.
				require_once JETPACK__PLUGIN_DIR . 'modules/search/class-jetpack-search-customize.php';
				new \Jetpack_Search_Customize();
			}
		} else {
			// Enable the classic search experience.
			Classic_Search::initialize( $blog_id );
		}

		// registers Jetpack Search widget.
		add_action( 'widgets_init', array( 'Automattic\Jetpack\Search\Jetpack_Initializer', 'jetpack_search_widget_init' ) );

		// Fired when plugin ready.
		do_action( 'jetpack_search_loaded' );
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
		register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
	}

	/**
	 * Ensure jetpack packages depended are configured.
	 */
	public static function ensure_dependecies_configured() {
		$config = new Config();
		// Connection package.
		$config->ensure(
			'connection',
			array(
				'slug'     => JETPACK_SEARCH_PLUGIN__SLUG,
				'name'     => 'Jetpack Search',
				'url_info' => 'https://jetpack.com',
			)
		);
		// Sync package.
		$config->ensure( 'sync' );

		// Identity crisis package.
		$config->ensure( 'identity_crisis' );
	}

	/**
	 * Register jetpack-search CLI if `\CLI` exists.
	 *
	 * @return void
	 */
	public static function init_cli() {
		if ( defined( 'WP_CLI' ) && \WP_CLI ) {
			\WP_CLI::add_command( 'jetpack-search', CLI::class );
		}
	}
}
