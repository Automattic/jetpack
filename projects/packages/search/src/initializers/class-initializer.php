<?php
/**
 * Initializer base class.
 *
 * @package    @automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WP_Error;
/**
 * Base class for the initializer pattern.
 */
class Initializer {
	/**
	 * WPCOM blog ID
	 *
	 * @var int
	 */
	protected $blog_id;

	/**
	 * Initialize
	 */
	public static function init() {
		( new static() )->do_init();
	}

	/**
	 * Initialize the search package.
	 */
	public function do_init() {
		// Set up package version hook.
		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package::send_version_to_tracker' );

		if ( ! apply_filters( 'jetpack_search_initialize', true ) ) {
			do_action( 'jetpack_search_abort', 'jetpack_search_initialize_filter', null );
			return;
		}

		$this->init_before_connection();

		// Check whether Jetpack Search should be initialized in the first place .
		if ( ! $this->is_connected() || ! $this->is_search_supported() ) {
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

		$this->blog_id = Helper::get_wpcom_site_id();
		if ( ! $this->blog_id ) {
			do_action( 'jetpack_search_abort', 'no_blog_id', null );
			return;
		}

		$this->init_search_package();

		// Fired when the package loading is done.
		do_action( 'jetpack_search_loaded' );
	}

	/**
	 * Init functionality required for connection.
	 */
	protected function init_before_connection() {
		// Set up Search API endpoints.
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		// The dashboard has to be initialized before connection.
		( new Dashboard() )->init_hooks();
	}

	/**
	 * Init the search package.
	 */
	protected function init_search_package() {
		// We could provide CLI to enable search/instant search, so init them regardless of whether the module is active or not.
		$this->init_cli();

		$module_control = new Module_Control();

		if ( ! $module_control->is_active() ) {
			do_action( 'jetpack_search_abort', 'module_inactive', null );
			return;
		}

		if ( $module_control->is_instant_search_enabled() ) {
			// Enable Instant search experience.
			$this->init_instant_search( $this->blog_id );
		} else {
			// Enable the classic search experience.
			$this->init_classic_search( $this->blog_id );
		}

		// registers Jetpack Search widget.
		add_action( 'widgets_init', array( $this, 'jetpack_search_widget_init' ) );
	}

	/**
	 * Init Instant Search and its dependencies.
	 */
	protected function init_instant_search() {
		if ( ! apply_filters( 'jetpack_search_init_instant_search', true ) ) {
			do_action( 'jetpack_search_abort', 'jetpack_search_init_instant_search_filter', null );
		}

		// Enable the instant search experience.
		Instant_Search::initialize( $this->blog_id );
		// Register instant search configurables as WordPress settings.
		new Settings();
		// Instantiate "Customberg", the live search configuration interface.
		Customberg::instance();
		// Enable configuring instant search within the Customizer.
		// Not need to check existence of `WP_Customize_Manager`, because which is not loaded all the time.
		new Customizer();
	}

	/**
	 * Init Classic Search.
	 */
	protected function init_classic_search() {
		if ( ! apply_filters( 'jetpack_search_init_classic_search', true ) ) {
			do_action( 'jetpack_search_abort', 'jetpack_search_init_classic_search_filter', null );
			return;
		}
		Classic_Search::initialize( $this->blog_id );
	}

	/**
	 * Register jetpack-search CLI if `\CLI` exists.
	 *
	 * @return void
	 */
	protected function init_cli() {
		if ( defined( 'WP_CLI' ) && \WP_CLI ) {
			\WP_CLI::add_command( 'jetpack-search', __NAMESPACE__ . '\CLI' );
		}
	}

	/**
	 * Register the widget if Jetpack Search is available and enabled.
	 */
	public function jetpack_search_widget_init() {
		register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
	}

	/**
	 * Check if site has been connected.
	 */
	protected function is_connected() {
		return ( new Connection_Manager( Package::SLUG ) )->is_connected();
	}

	/**
	 * Check if search is supported by current plan.
	 */
	protected function is_search_supported() {
		return ( new Plan() )->supports_search();
	}

	/**
	 * Perform necessary initialization steps for classic and instant search in the constructor.
	 *
	 * @deprecated
	 */
	public static function initialize() {
		return new WP_Error(
			'invalid-method',
			/* translators: %s: Method name. */
			sprintf( __( "Method '%s' not implemented. Must be overridden in subclass.", 'jetpack-search-pkg' ), __METHOD__ ),
			array( 'status' => 405 )
		);
	}
}
