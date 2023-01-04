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
		// Do not run in the WPCOM context
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return;
		}

		// Check if killswitch is defined as true
		if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
			return;
		}

		// Update the WAF after installing or upgrading a relevant Jetpack plugin
		add_action( 'upgrader_process_complete', __CLASS__ . '::update_waf_after_plugin_upgrade', 10, 2 );

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

		// Only run when Jetpack plugins were affected
		if ( empty( array_intersect( $jetpack_plugins_with_waf, $hook_extra['plugins'] ) ) ) {
			return;
		}

		Waf_Runner::update_waf();
	}
}
