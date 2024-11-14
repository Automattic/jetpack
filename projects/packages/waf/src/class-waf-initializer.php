<?php
/**
 * Class use to initialize the WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf_Runtime\Runner as Waf_Runtime_Runner;
use WP_Error;
use WP_Upgrader;

/**
 * Initializes the module
 */
class Waf_Initializer {
	const WAF_MODULE_NAME              = 'waf';
	const MODE_OPTION_NAME             = 'jetpack_waf_mode';
	const SHARE_DATA_OPTION_NAME       = 'jetpack_waf_share_data';
	const SHARE_DEBUG_DATA_OPTION_NAME = 'jetpack_waf_share_debug_data';

	/**
	 * Option for storing whether or not the WAF files are potentially out of date.
	 *
	 * @var string NEEDS_UPDATE_OPTION_NAME
	 */
	const NEEDS_UPDATE_OPTION_NAME = 'jetpack_waf_needs_update';

	/**
	 * Initializes the configurations needed for the waf module.
	 *
	 * @return void
	 */
	public static function initialize() {
		// Do not run in unsupported environments
		add_action( 'jetpack_get_available_modules', __CLASS__ . '::remove_module_on_unsupported_environments' );
		add_action( 'jetpack_get_available_standalone_modules', __CLASS__ . '::remove_standalone_module_on_unsupported_environments' );

		( new Waf_Constants() )->initialize_constants();

		// Ensure backwards compatibility
		Waf_Compatibility::add_compatibility_hooks();

		// Register REST routes
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		// Update the WAF after installing or upgrading a relevant Jetpack plugin
		add_action( 'upgrader_process_complete', __CLASS__ . '::update_waf_after_plugin_upgrade', 10, 2 );

		Waf_Rules_Manager::add_hooks();

		// Check for compatibility updates
		add_action( 'admin_init', __CLASS__ . '::check_for_updates' );

		Waf_Rules_Manager::schedule_rules_cron();

		// WAF activation/deactivation hooks
		add_action( 'jetpack_activate_module_waf', __CLASS__ . '::on_waf_activation' );
		add_action( 'jetpack_deactivate_module_waf', __CLASS__ . '::on_waf_deactivation' );

		// Brute force protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_protect', __CLASS__ . '::on_brute_force_protection_activation' );
		add_action( 'jetpack_deactivate_module_protect', __CLASS__ . '::on_brute_force_protection_deactivation' );

		// Run brute force protection
		Brute_Force_Protection::initialize();

		// Run the WAF
		if ( self::is_supported_environment() ) {
			Waf_Runtime_Runner::run();
		}
	}

	/**
	 * Determines if the WAF is supported in the current environment.
	 *
	 * @since 0.8.0
	 * @return bool
	 */
	public static function is_supported_environment() {
		// Do not run when killswitch is enabled
		if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
			return false;
		}

		if ( defined( 'IS_ATOMIC_JN' ) && IS_ATOMIC_JN ) {
			return true;
		}

		// Do not run in the WPCOM context
		if ( ( new Host() )->is_wpcom_simple() ) {
			return false;
		}

		// Do not run on the Atomic platform
		if ( ( new Host() )->is_atomic_platform() ) {
			return false;
		}

		// Do not run on the VIP platform
		if ( ( new Host() )->is_vip_site() ) {
			return false;
		}

		return true;
	}

	/**
	 * Determines if the WAF module is enabled on the site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// if ABSPATH is defined, then WordPress has already been instantiated,
		// so we can check to see if the waf module is activated.
		if ( defined( 'ABSPATH' ) ) {
			return ( new Modules() )->is_active( self::WAF_MODULE_NAME );
		}

		return true;
	}

	/**
	 * Enables the WAF module on the site.
	 *
	 * @return bool
	 */
	public static function enable() {
		return ( new Modules() )->activate( self::WAF_MODULE_NAME, false, false );
	}

	/**
	 * Activate the WAF on module activation.
	 *
	 * @return bool|WP_Error True if the WAF activation is successful, WP_Error otherwise.
	 */
	public static function on_waf_activation() {
		try {
			self::activate();
			( new Waf_Standalone_Bootstrap() )->generate();
		} catch ( Waf_Exception $e ) {
			return $e->get_wp_error();
		}

		return true;
	}

	/**
	 * Activates the WAF by generating the rules script and setting the version
	 *
	 * @throws Waf_Exception If the firewall mode is invalid.
	 * @throws Waf_Exception If the activation fails.
	 *
	 * @return void
	 */
	public static function activate() {
		$version = get_option( Waf_Rules_Manager::VERSION_OPTION_NAME );
		if ( ! $version ) {
			add_option( Waf_Rules_Manager::VERSION_OPTION_NAME, Waf_Rules_Manager::RULES_VERSION );
		}

		add_option( self::MODE_OPTION_NAME, 'normal' );
		add_option( Waf_Settings::AUTOMATIC_RULES_ENABLED_OPTION_NAME, false );
		add_option( self::SHARE_DATA_OPTION_NAME, true );

		Waf_Rules_Manager::generate_automatic_rules();
		Waf_Rules_Manager::generate_ip_rules();
		Waf_Rules_Manager::generate_rules();

		Waf_Blocklog_Manager::create_blocklog_table();
	}

	/**
	 * Disabled the WAF module on the site.
	 *
	 * @return bool
	 */
	public static function disable() {
		return ( new Modules() )->deactivate( self::WAF_MODULE_NAME );
	}

	/**
	 * Deactivate the WAF on module deactivation.
	 *
	 * @return bool|WP_Error True if the WAF deactivation is successful, WP_Error otherwise.
	 */
	public static function on_waf_deactivation() {
		try {
			self::deactivate();
		} catch ( Waf_Exception $e ) {
			return $e->get_wp_error();
		}

		return true;
	}

	/**
	 * Deactivates the WAF by deleting the relevant options and emptying rules file.
	 *
	 * @throws File_System_Exception If file writing fails.
	 *
	 * @return void
	 */
	public static function deactivate() {
		delete_option( self::MODE_OPTION_NAME );
		delete_option( Waf_Rules_Manager::VERSION_OPTION_NAME );

		$Filesystem = new Waf_Filesystem();
		$fs         = $Filesystem->initialize_filesystem();

		$Constants  = new Waf_Constants();
		$entrypoint = $Constants->get( $Constants::ENTRYPOINT_CONSTANT );

		// If the rules file doesn't exist, there's nothing else to do.
		if ( ! $fs->exists( $Filesystem->get_path( $entrypoint ) ) ) {
			return;
		}

		// Empty the rules entrypoint file.
		if ( ! $fs->put_contents( $Filesystem->get_path( $entrypoint ), "<?php\n" ) ) {
			throw new File_System_Exception( 'Failed to empty rules.php file.' );
		}
	}

	/**
	 * Activate the Brute force protection on module activation.
	 *
	 * @return bool True if the Brute force protection activation is successful
	 */
	public static function on_brute_force_protection_activation() {
		$brute_force_protection = Brute_Force_Protection::instance();
		$brute_force_protection->on_activation();

		return true;
	}

	/**
	 * Deactivate the Brute force protection on module deactivation.
	 *
	 * @return bool True if the Brute force protection deactivation is successful.
	 */
	public static function on_brute_force_protection_deactivation() {
		$brute_force_protection = Brute_Force_Protection::instance();
		$brute_force_protection->on_deactivation();

		return true;
	}

	/**
	 * Updates the WAF after upgrader process is complete.
	 *
	 * @param WP_Upgrader $upgrader    WP_Upgrader instance. In other contexts this might be a Theme_Upgrader, Plugin_Upgrader, Core_Upgrade, or Language_Pack_Upgrader instance.
	 * @param array       $hook_extra  Array of bulk item update data.
	 *
	 * @return void
	 */
	public static function update_waf_after_plugin_upgrade( $upgrader, $hook_extra ) {
		$jetpack_text_domains_with_waf = array( 'jetpack', 'jetpack-protect' );
		$jetpack_plugins_with_waf      = array( 'jetpack/jetpack.php', 'jetpack-protect/jetpack-protect.php' );

		// Only run on upgrades affecting plugins
		if ( 'plugin' !== $hook_extra['type'] ) {
			return;
		}

		// Only run on updates and installations
		if ( 'update' !== $hook_extra['action'] && 'install' !== $hook_extra['action'] ) {
			return;
		}

		// Only run when Jetpack plugins were affected
		if ( 'update' === $hook_extra['action'] &&
			! empty( $hook_extra['plugins'] ) &&
			empty( array_intersect( $jetpack_plugins_with_waf, $hook_extra['plugins'] ) )
		) {
			return;
		}
		if ( 'install' === $hook_extra['action'] &&
			! empty( $upgrader->new_plugin_data['TextDomain'] ) &&
			empty( in_array( $upgrader->new_plugin_data['TextDomain'], $jetpack_text_domains_with_waf, true ) )
		) {
			return;
		}

		update_option( self::NEEDS_UPDATE_OPTION_NAME, true );
	}

	/**
	 * Check for WAF update
	 *
	 * Updates the WAF when the "needs update" option is enabled.
	 *
	 * @return bool|WP_Error True if the WAF is up-to-date or was sucessfully updated, WP_Error if the update failed.
	 */
	public static function check_for_updates() {
		if ( ! get_option( self::NEEDS_UPDATE_OPTION_NAME ) ) {
			return true;
		}

		Waf_Compatibility::run_compatibility_migrations();

		if ( ! self::is_supported_environment() ) {
			return true;
		}

		try {
			Waf_Rules_Manager::generate_ip_rules();
			Waf_Rules_Manager::generate_rules();
			( new Waf_Standalone_Bootstrap() )->generate();
			update_option( self::NEEDS_UPDATE_OPTION_NAME, false );
		} catch ( Waf_Exception $e ) {
			return $e->get_wp_error();
		}
	}

	/**
	 * Handle updates to the WAF
	 *
	 * @return void
	 */
	public static function update_waf() {
		Waf_Rules_Manager::update_rules_if_changed();

		// Re-generate the standalone bootstrap file on every update
		// TODO: We may consider only doing this when the WAF version changes
		( new Waf_Standalone_Bootstrap() )->generate();
	}

	/**
	 * Disables the WAF module when on an unsupported platform in Jetpack.
	 *
	 * @param array $modules Filterable value for `jetpack_get_available_modules`.
	 *
	 * @return array Array of module slugs.
	 */
	public static function remove_module_on_unsupported_environments( $modules ) {
		if ( ! self::is_supported_environment() ) {
			// WAF should never be available on unsupported platforms.
			unset( $modules['waf'] );
		}

		return $modules;
	}

	/**
	 * Disables the WAF module when on an unsupported platform in a standalone plugin.
	 *
	 * @param array $modules Filterable value for `jetpack_get_available_standalone_modules`.
	 *
	 * @return array Array of module slugs.
	 */
	public static function remove_standalone_module_on_unsupported_environments( $modules ) {
		if ( ! self::is_supported_environment() ) {
			// WAF should never be available on unsupported platforms.
			$modules = array_filter(
				$modules,
				function ( $module ) {
					return $module !== 'waf';
				}
			);

		}

		return $modules;
	}
}
