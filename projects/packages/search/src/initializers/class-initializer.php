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
	 * Store the instance.
	 *
	 * @var Initializer
	 */
	protected static $instance;

	/**
	 * WPCOM blog ID
	 *
	 * @var int
	 */
	protected $blog_id;

	/**
	 * Initialize and get instance
	 */
	public static function instance() {
		if ( is_null( static::$instance ) ) {
			static::$instance = new static();
			static::$instance->init();
		}
		return static::$instance;
	}

	/**
	 * Initialize the search package.
	 */
	protected function init() {
		if ( ! apply_filters( 'jetpack_search_initialize', true ) ) {
			do_action( 'jetpack_search_abort', 'filter', null );
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

		$this->blog_id = apply_filters( 'jetpack_search_initializer_blog_id', Helper::get_wpcom_site_id() );
		if ( ! $this->blog_id ) {
			do_action( 'jetpack_search_abort', 'no_blog_id', null );
			return;
		}

		$this->init_search_package();

		// Set up package version hook.
		add_filter( 'jetpack_package_versions', array( Package::class, 'send_version_to_tracker' ) );

		// Fired when plugin ready.
		do_action( 'jetpack_search_loaded' );
	}

	/**
	 * Check if site has been connected.
	 */
	public function is_connected() {
		return ( new Connection_Manager( Package::SLUG ) )->is_connected();
	}

	/**
	 * Check if search is supported by current plan.
	 */
	public function is_search_supported() {
		return ( new Plan() )->supports_search();
	}

	/**
	 * Register the widget if Jetpack Search is available and enabled.
	 */
	public function jetpack_search_widget_init() {
		register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
	}

	/**
	 * Init functionality required for connection.
	 */
	protected function init_before_connection() {
		if ( apply_filters( 'jetpack_search_init_rest_api', true ) ) {
			// Set up Search API endpoints.
			add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		}

		// The dashboard has to be initialized before connection.
		if ( apply_filters( 'jetpack_search_add_dashboard', true ) ) {
			( new Dashboard() )->init_hooks();
		}
	}

	/**
	 * Init the search package.
	 */
	protected function init_search_package() {
		// We could possible provide CLI to enable search/instant search, so init them regardless whehter the module is active or not.
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
		if ( apply_filters( 'jetpack_search_init_instant_search', true ) ) {
			// Enable the instant search experience.
			Instant_Search::initialize( $this->blog_id );
		}

		if ( apply_filters( 'jetpack_search_init_instant_search_settings', true ) ) {
			// Register instant search configurables as WordPress settings.
			new Settings();
		}

		if ( apply_filters( 'jetpack_search_init_instant_search_customberg', true ) ) {
			// Instantiate "Customberg", the live search configuration interface.
			Customberg::instance();
		}

		// Enable configuring instant search within the Customizer.
		if ( apply_filters( 'jetpack_search_init_instant_search_customize', true ) && class_exists( 'WP_Customize_Manager' ) ) {
			new Customizer();
		}
	}

	/**
	 * Init Classic Search.
	 */
	protected function init_classic_search() {
		if ( apply_filters( 'jetpack_search_init_classic_search', true ) ) {
			Classic_Search::initialize( $this->blog_id );
		}
	}

	/**
	 * Register jetpack-search CLI if `\CLI` exists.
	 *
	 * @return void
	 */
	protected function init_cli() {
		if ( apply_filters( 'jetpack_search_init_cli', true ) && defined( 'WP_CLI' ) && \WP_CLI ) {
			\WP_CLI::add_command( 'jetpack-search', CLI::class );
		}
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
