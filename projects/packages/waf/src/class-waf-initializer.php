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
		add_action( 'jetpack_activate_module_waf', __CLASS__ . '::on_activation' );
		add_action( 'jetpack_deactivate_module_waf', __CLASS__ . '::on_deactivation' );
		if ( Waf_Runner::is_enabled() ) {
			add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );
		}
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
