<?php
/**
 * Class use to initialize the WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use WP_Error;
use WP_Upgrader;

/**
 * Initializes the module
 */
class Waf_Initializer {

	/**
	 * Option for storing whether the WAF files are potentially out of date.
	 *
	 * @var string NEEDS_UPDATE_OPTION_NAME
	 */
	const NEEDS_UPDATE_OPTION_NAME = 'jetpack_waf_needs_update';

	/**
	 * Initializes the configurations needed for the waf module.
	 *
	 * @return void
	 */
	public static function init() {
		// Do not run in unsupported environments
		add_action( 'jetpack_get_available_modules', __CLASS__ . '::remove_module_on_unsupported_environments' );
		add_action( 'jetpack_get_available_standalone_modules', __CLASS__ . '::remove_standalone_module_on_unsupported_environments' );

		// Ensure backwards compatibility
		Waf_Compatibility::add_compatibility_hooks();

		// Register REST routes
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		// Update the WAF after installing or upgrading a relevant Jetpack plugin
		add_action( 'upgrader_process_complete', __CLASS__ . '::update_waf_after_plugin_upgrade', 10, 2 );

		// Check for compatibility updates
		add_action( 'admin_init', __CLASS__ . '::check_for_updates' );

		// WAF activation/deactivation hooks
		add_action( 'jetpack_activate_module_waf', __CLASS__ . '::on_waf_activation' );
		add_action( 'jetpack_deactivate_module_waf', __CLASS__ . '::on_waf_deactivation' );

		// Brute force protection activation/deactivation hooks
		add_action( 'jetpack_activate_module_protect', __CLASS__ . '::on_brute_force_protection_activation' );
		add_action( 'jetpack_deactivate_module_protect', __CLASS__ . '::on_brute_force_protection_deactivation' );

		// Run brute force protection
		Brute_Force_Protection::initialize();

		// Run the WAF
		if ( Waf_Runner::is_supported_environment() ) {
			Waf_Runner::initialize();
		}
	}

	/**
	 * Activate the WAF on module activation.
	 *
	 * @return bool|WP_Error True if the WAF activation is successful, WP_Error otherwise.
	 */
	public static function on_waf_activation() {
		update_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		add_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME, false );

		try {
			Waf_Runner::activate();
			( new Waf_Standalone_Bootstrap() )->generate();
		} catch ( Waf_Exception $e ) {
			return $e->get_wp_error();
		}

		return true;
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
	 * Deactivate the WAF on module deactivation.
	 *
	 * @return bool|WP_Error True if the WAF deactivation is successful, WP_Error otherwise.
	 */
	public static function on_waf_deactivation() {
		try {
			Waf_Runner::deactivate();
		} catch ( Waf_Exception $e ) {
			return $e->get_wp_error();
		}

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

		$hook_extra['type']    = $hook_extra['type'] ?? null;
		$hook_extra['action']  = $hook_extra['action'] ?? null;
		$hook_extra['plugins'] = $hook_extra['plugins'] ?? array();

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
			empty( in_array( $upgrader->new_plugin_data['TextDomain'] ?? null, $jetpack_text_domains_with_waf, true ) )
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
		if ( get_option( self::NEEDS_UPDATE_OPTION_NAME ) ) {
			if ( Waf_Runner::is_supported_environment() ) {
				// Compatiblity patch for cases where an outdated WAF_Constants class has been
				// autoloaded by the standalone bootstrap execution at the beginning of the current request.
				if ( ! method_exists( Waf_Constants::class, 'define_mode' ) ) {
					try {
						( new Waf_Standalone_Bootstrap() )->generate();
					} catch ( Waf_Exception $e ) {
						return $e->get_wp_error();
					}
				}

				Waf_Compatibility::run_compatibility_migrations();

				try {
					Waf_Rules_Manager::generate_ip_rules();
					Waf_Rules_Manager::generate_rules();
					( new Waf_Standalone_Bootstrap() )->generate();
				} catch ( Waf_Exception $e ) {
					return $e->get_wp_error();
				}
			} else {
				// If the site doesn't support the request firewall,
				// just migrate the IP allow list used by brute force protection.
				Waf_Compatibility::migrate_brute_force_protection_ip_allow_list();
			}

			update_option( self::NEEDS_UPDATE_OPTION_NAME, false );
		}

		return true;
	}

	/**
	 * Disables the WAF module when on an unsupported platform in Jetpack.
	 *
	 * @param array $modules Filterable value for `jetpack_get_available_modules`.
	 *
	 * @return array Array of module slugs.
	 */
	public static function remove_module_on_unsupported_environments( $modules ) {
		if ( ! Waf_Runner::is_supported_environment() ) {
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
		if ( ! Waf_Runner::is_supported_environment() ) {
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
