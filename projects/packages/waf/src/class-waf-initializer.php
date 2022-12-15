<?php
/**
 * Class use to initialize the WAF module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Initializes the module
 */
class Waf_Initializer {
	/**
	 * Initializes the configurations needed for the waf module.
	 *
	 * @return void
	 */
	public static function init() {
		// Do not run in unsupported environments
		if ( ! Waf_Runner::is_supported_environment() ) {
			return;
		}

		// Update the WAF after installing or upgrading a relevant Jetpack plugin
		add_action( 'upgrader_post_install', __CLASS__ . '::update_waf_after_plugin_upgrade', 10, 2 );

		// Activation/Deactivation hooks
		add_action( 'jetpack_activate_module_waf', __CLASS__ . '::on_activation' );
		add_action( 'jetpack_deactivate_module_waf', __CLASS__ . '::on_deactivation' );
		add_action( 'jetpack_get_available_modules', __CLASS__ . '::remove_module_on_unsupported_environments' );

		// Run the WAF
		Waf_Runner::initialize();
	}

	/**
	 * On module activation set up waf mode
	 */
	public static function on_activation() {
		update_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		Waf_Runner::activate();
		( new Waf_Standalone_Bootstrap() )->generate();
	}

	/**
	 * On module deactivation, unset waf mode
	 */
	public static function on_deactivation() {
		Waf_Runner::deactivate();
	}

	/**
	 * Updates the WAF after upgrader process is complete.
	 *
	 * @param bool|WP_Error $response    Installation response.
	 * @param array         $hook_extra  Extra arguments passed to hooked filters.
	 *
	 * @return bool Installation response.
	 */
	public static function update_waf_after_plugin_upgrade( $response, $hook_extra ) {
		$jetpack_plugins_with_waf = array( 'jetpack/jetpack.php', 'jetpack-protect/jetpack-protect.php' );

		// Only run on upgrades affecting plugins
		if ( empty( $hook_extra['plugins'] ) ) {
			return $response;
		}

		// Only run when Jetpack plugins were affected
		if ( empty( array_intersect( $jetpack_plugins_with_waf, $hook_extra['plugins'] ) ) ) {
			return $response;
		}

		Waf_Runner::update_waf();

		return $response;
	}

	/**
	 * Disables the WAF module when on an supported platform.
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
}
