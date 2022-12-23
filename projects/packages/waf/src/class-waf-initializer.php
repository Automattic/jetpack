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
		add_action( 'jetpack_get_available_modules', __CLASS__ . '::remove_module_on_unsupported_environments' );
		if ( ! Waf_Runner::is_supported_environment() ) {
			return;
		}

		// Update the WAF after installing or upgrading a relevant Jetpack plugin
		add_action( 'upgrader_process_complete', __CLASS__ . '::update_waf_after_plugin_upgrade', 10, 2 );
		add_action( 'admin_init', __CLASS__ . '::check_for_waf_update' );

		// Activation/Deactivation hooks
		add_action( 'jetpack_activate_module_waf', __CLASS__ . '::on_activation' );
		add_action( 'jetpack_deactivate_module_waf', __CLASS__ . '::on_deactivation' );

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
	 * @param WP_Upgrader $upgrader    WP_Upgrader instance. In other contexts this might be a Theme_Upgrader, Plugin_Upgrader, Core_Upgrade, or Language_Pack_Upgrader instance.
	 * @param array       $hook_extra  Array of bulk item update data.
	 *
	 * @return void
	 */
	public static function update_waf_after_plugin_upgrade( $upgrader, $hook_extra ) {
		$jetpack_plugins_with_waf = array( 'jetpack/jetpack.php', 'jetpack-protect/jetpack-protect.php' );

		// Only run on upgrades affecting plugins
		if ( empty( $hook_extra['plugins'] ) ) {
			return;
		}

		// Only run on updates and installations
		if ( ! in_array( $hook_extra['action'], array( 'update', 'install' ), true ) ) {
			return;
		}

		// Only run when Jetpack plugins were affected
		if ( empty( array_intersect( $jetpack_plugins_with_waf, $hook_extra['plugins'] ) ) ) {
			return;
		}

		set_transient( 'jetpack_waf_needs_update', 1 );
	}

	/**
	 * Check for WAF update
	 *
	 * Updates the WAF when the transient is present.
	 *
	 * @return void
	 */
	public static function check_for_waf_update() {
		if ( get_transient( 'jetpack_waf_needs_update' ) ) {
			delete_transient( 'jetpack_waf_needs_update' );
			Waf_Runner::update_waf();
		}
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
