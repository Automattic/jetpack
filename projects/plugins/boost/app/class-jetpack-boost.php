<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost;

use Automattic\Jetpack\Config as Jetpack_Config;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\CLI;
use Automattic\Jetpack_Boost\Lib\Config;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Viewport;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Modules\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Render_Blocking_JS\Render_Blocking_JS;

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @author     Automattic <support@jetpack.com>
 */
class Jetpack_Boost {

	const MODULES = array(
		Critical_CSS::MODULE_SLUG       => Critical_CSS::class,
		Lazy_Images::MODULE_SLUG        => Lazy_Images::class,
		Render_Blocking_JS::MODULE_SLUG => Render_Blocking_JS::class,
	);

	/**
	 * Default enabled modules.
	 */
	const ENABLED_MODULES_DEFAULT = array();

	/**
	 * Default available modules.
	 */
	const AVAILABLE_MODULES_DEFAULT = array(
		Critical_CSS::MODULE_SLUG,
		Render_Blocking_JS::MODULE_SLUG,
		Lazy_Images::MODULE_SLUG,
	);

	const CURRENT_CONFIG_ID = 'default';

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @var      string $plugin_name The string used to uniquely identify this plugin.
	 */
	private $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @var      string $version The current version of the plugin.
	 */
	private $version;

	/**
	 * The config
	 *
	 * @since    1.0.0
	 * @var      Config|null $config The configuration object
	 */
	private $config;

	/**
	 * Store all plugin module instances here
	 *
	 * @var array
	 */
	private $modules = array();

	/**
	 * The Jetpack Boost Connection manager instance.
	 *
	 * @since    1.0.0
	 * @access   public
	 * @var      Connection $connection The Jetpack Boost Connection manager instance.
	 */
	public $connection;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		$this->version     = JETPACK_BOOST_VERSION;
		$this->plugin_name = 'jetpack-boost';

		$this->connection = new Connection();

		// Require plugin features.
		$this->init_textdomain();

		$this->register_deactivation_hook();

		if ( class_exists( 'WP_CLI' ) ) {
			CLI::register( $this );
		}

		// Initialize the config module separately.
		$this->init_config();

		$this->prepare_modules();

		// Initialize the Admin experience.
		$this->init_admin();

		// Module readiness filter.
		add_action( 'wp_head', array( $this, 'display_meta_field_module_ready' ) );

		add_action( 'init', array( $this, 'initialize_modules' ) );
		add_action( 'init', array( $this, 'init_textdomain' ) );
		add_action( 'init', array( $this, 'register_cache_clear_actions' ) );

		add_action( 'handle_theme_change', array( $this, 'handle_theme_change' ) );

		// Fired when plugin ready.
		do_action( 'jetpack_boost_loaded', $this );
	}

	/**
	 * Register deactivation hook.
	 */
	private function register_deactivation_hook() {
		$plugin_file = trailingslashit( dirname( __DIR__ ) ) . 'jetpack-boost.php';
		register_deactivation_hook( $plugin_file, array( $this, 'deactivate' ) );
	}

	/**
	 * Wipe all cached values.
	 */
	public function clear_cache() {
		do_action( 'jetpack_boost_clear_cache' );
	}

	/**
	 * Plugin deactivation handler. Clear cache, and reset admin notices.
	 */
	public function deactivate() {
		$this->clear_cache();
		Admin::clear_dismissed_notices();
		Critical_CSS::clear_reset_reason();
		Critical_CSS::clear_dismissed_recommendations();
	}

	/**
	 * Plugin uninstallation handler. Delete all settings and cache.
	 */
	public function uninstall() {
		$this->clear_cache();

		delete_option( apply_filters( 'jetpack_boost_options_store_key_name', 'jetpack_boost_config' ) );
	}

	/**
	 * Handlers for clearing module caches go here, so that caches get cleared even if the module is not enabled.
	 */
	public function register_cache_clear_actions() {
		add_action( 'jetpack_boost_clear_cache', array( $this, 'record_clear_cache_event' ) );
	}

	/**
	 * Record the clear cache event.
	 */
	public function record_clear_cache_event() {
		Analytics::record_user_event( 'clear_cache' );
	}

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public function prepare_modules() {
		$available_modules = $this->get_available_modules();

		$forced_disabled_modules = array();

		// Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
		// The parameter is a comma separated value list of module slug.
		if ( ! empty( $_GET['jb-disable-modules'] ) ) {
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$forced_disabled_modules = array_map( 'sanitize_key', explode( ',', $_GET['jb-disable-modules'] ) );
		}

		foreach ( self::MODULES as $module_slug => $module_class ) {
			// Don't register modules that have been forcibly disabled from the url 'jb-disable-modules' query string parameter.
			if ( in_array( $module_slug, $forced_disabled_modules, true ) ) {
				continue;
			}

			// All Jetpack Boost modules should extend Module class.
			if ( ! is_subclass_of( $module_class, Module::class ) ) {
				continue;
			}

			// Don't register modules that aren't available.
			if ( ! in_array( $module_slug, $available_modules, true ) ) {
				continue;
			}

			$module                        = new $module_class();
			$this->modules[ $module_slug ] = $module;
		}

		do_action( 'jetpack_boost_modules_loaded' );
	}

	/**
	 * Initialize modules when WordPress is ready
	 */
	public function initialize_modules() {
		foreach ( $this->modules as $module_slug => $module ) {
			if ( true === $this->get_module_status( $module_slug ) ) {
				$module->initialize();
			}
		}
	}

	/**
	 * Returns the list of available modules.
	 *
	 * @return array The available modules.
	 */
	public function get_available_modules() {
		$available_modules = self::AVAILABLE_MODULES_DEFAULT;

		// Add the Lazy Images module if Jetpack Lazy Images module is enabled.
		if ( Lazy_Images::is_jetpack_lazy_images_module_enabled() ) {
			$available_modules = array_unique( array_merge( self::AVAILABLE_MODULES_DEFAULT, array( Lazy_Images::MODULE_SLUG ) ) );
		}

		return apply_filters(
			'jetpack_boost_modules',
			$available_modules
		);
	}

	/**
	 * Returns an array of active modules.
	 */
	public function get_active_modules() {
		// Cache active modules.
		static $active_modules = null;
		if ( null !== $active_modules ) {
			return $active_modules;
		}

		return array_filter(
			$this->modules,
			function ( $module, $module_slug ) {
				return true === $this->get_module_status( $module_slug );
			},
			ARRAY_FILTER_USE_BOTH
		);
	}

	/**
	 * Returns the status of a given module.
	 *
	 * @param string $module_slug The module's slug.
	 *
	 * @return bool The enablement status of the module.
	 */
	public function get_module_status( $module_slug ) {
		$default_module_status = in_array( $module_slug, self::ENABLED_MODULES_DEFAULT, true );

		return apply_filters( 'jetpack_boost_module_enabled', $default_module_status, $module_slug );
	}

	/**
	 * Check if a module is enabled.
	 *
	 * @param boolean $is_enabled  Default value.
	 * @param string  $module_slug The module we are checking.
	 *
	 * @return mixed|null
	 */
	public function is_module_enabled( $is_enabled, $module_slug ) {
		do_action( 'jetpack_boost_pre_is_module_enabled', $is_enabled, $module_slug );

		return $this->config()->get_value( "$module_slug/enabled", $is_enabled );
	}

	/**
	 * Set status of a module.
	 *
	 * @param boolean $is_enabled  Default value.
	 * @param string  $module_slug The module we are checking.
	 */
	public function set_module_status( $is_enabled, $module_slug ) {
		do_action( 'jetpack_boost_pre_set_module_status', $is_enabled, $module_slug );
		Analytics::record_user_event(
			'set_module_status',
			array(
				'module' => $module_slug,
				'status' => $is_enabled,
			)
		);
		$this->config()->set_value( "$module_slug/enabled", $is_enabled, true );
	}

	/**
	 * Get critical CSS viewport sizes.
	 *
	 * @param mixed $default The default value.
	 *
	 * @return mixed|null
	 */
	public function get_critical_css_viewport_sizes( $default ) {
		return $this->config()->get_value( 'critical-css/settings/viewport_sizes', $default );
	}

	/**
	 * Get critical CSS default viewports.
	 *
	 * @param mixed $default The default value.
	 *
	 * @return mixed|null
	 */
	public function get_critical_css_default_viewports( $default ) {
		return $this->config()->get_value( 'critical-css/settings/default_viewports', $default );
	}

	/**
	 * Get critical CSS ignore rules.
	 *
	 * @param mixed $default The default value.
	 *
	 * @return mixed|null
	 */
	public function get_critical_css_ignore_rules( $default ) {
		return $this->config()->get_value( 'critical-css/settings/css-ignore-rules', $default );
	}

	/**
	 * Returns configuration array.
	 *
	 * @return Config Configuration array.
	 */
	public function config() {
		if ( ! $this->config ) {
			do_action( 'jetpack_boost_pre_get_config' );
			$this->config = Config::get( self::CURRENT_CONFIG_ID ); // under the hood, this actually fetches from an option, not the config cache.
		}

		return apply_filters( 'jetpack_boost_config', $this->config );
	}

	/**
	 * Initialize config system.
	 *
	 * @todo This should be replaced by a proper configuration implementation eventually.
	 */
	public function init_config() {
		add_action( 'switch_blog', array( $this, 'clear_memoized_config' ) );
		add_filter( 'jetpack_boost_module_enabled', array( $this, 'is_module_enabled' ), 0, 2 );
		add_filter( 'jetpack_boost_critical_css_viewport_sizes', array( $this, 'get_critical_css_viewport_sizes' ) );
		add_filter( 'jetpack_boost_critical_css_default_viewports', array( $this, 'get_critical_css_default_viewports' ) );
		add_filter( 'jetpack_boost_critical_css_ignore_rules', array( $this, 'get_critical_css_ignore_rules' ) );
	}

	/**
	 * Clear the memoized config, executed on `switch_blog`
	 */
	public function clear_memoized_config() {
		$this->config = null;
	}

	/**
	 * Returns a default config array.
	 *
	 * @return array Default config.
	 */
	public static function get_default_config_array() {
		return apply_filters(
			'jetpack_boost_config_array',
			array(
				Render_Blocking_JS::MODULE_SLUG => array(
					'enabled' => false,
				),
				Critical_CSS::MODULE_SLUG       => array(
					'enabled'  => false,
					'settings' => array(
						'viewport_sizes'    => Viewport::DEFAULT_VIEWPORT_SIZES,
						'default_viewports' => Viewport::DEFAULT_VIEWPORTS,
						'css-ignore-rules'  => array(
							// TODO: Define if we need any default CSS ignore rules
							// Example regex, exclude all css where there is a url inside.
							'url\(',
						),
					),
				),
				Lazy_Images::MODULE_SLUG        => array(
					'enabled' => false,
				),
			)
		);
	}

	/**
	 * Initialize the admin experience.
	 */
	public function init_admin() {
		if ( ! apply_filters( 'jetpack_boost_connection_bypass', false ) ) {
			$jetpack_config = new Jetpack_Config();
			$jetpack_config->ensure(
				'connection',
				array(
					'slug'     => 'jetpack-boost',
					'name'     => 'Jetpack Boost',
					'url_info' => '', // Optional, URL of the plugin.
				)
			);
		}

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( __FILE__ ) . 'admin/class-admin.php';

		new Admin( $this );
	}

	/**
	 * Loads the textdomain.
	 */
	public function init_textdomain() {
		load_plugin_textdomain(
			'jetpack-boost',
			false,
			JETPACK_BOOST_DIR_PATH . '/languages/'
		);
	}

	/**
	 * Registers the `jetpack_boost_url_ready` filter which allows modules to provide their readiness status.
	 */
	public function display_meta_field_module_ready() {
		?>
		<meta name="jetpack-boost-ready" content="<?php echo apply_filters( 'jetpack_boost_url_ready', true ) ? 'true' : 'false'; ?>" />
		<?php
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @return    string    The name of the plugin.
	 * @since     1.0.0
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return    string    The version number of the plugin.
	 * @since     1.0.0
	 */
	public function get_version() {
		return $this->version;
	}

	/**
	 * Returns a list of admin notices to show. Asks each module to provide admin notices the user needs to see.
	 *
	 * @return \Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		$all_notices = array();

		foreach ( $this->get_active_modules() as $module ) {
			$module_notices = $module->get_admin_notices();

			if ( ! empty( $module_notices ) ) {
				$all_notices = array_merge( $all_notices, $module_notices );
			}
		}

		return $all_notices;
	}

	/**
	 * Handle an environment change to set the correct status to the Critical CSS request.
	 * This is done here so even if the Critical CSS module is switched off we can
	 * still capture the change of environment event and flag Critical CSS for a rebuild.
	 */
	public function handle_theme_change() {
		Admin::clear_dismissed_notice( Regenerate_Admin_Notice::SLUG );
		\update_option( Critical_CSS::RESET_REASON_STORAGE_KEY, Regenerate_Admin_Notice::REASON_THEME_CHANGE, false );
	}
}
