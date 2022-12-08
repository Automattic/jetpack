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

		// Triggers when the Jetpack plugin is updated
		add_action( 'upgrader_process_complete', array( Waf_Runner::class, 'update_waf' ) );

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
}
