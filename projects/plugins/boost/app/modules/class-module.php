<?php
/**
 * All Jetpack Boost modules are required to extend this class.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules;

/**
 * Class Module
 */
abstract class Module {
	/**
	 * Modules extending this class will auto-register routes
	 * using `register_rest_routes` method if it's available.
	 */
	public static function prepare() {
		$module = new static();

		add_action( 'jetpack_boost_deactivate', array( $module, 'on_deactivate' ) );
		add_action( 'jetpack_boost_uninstall', array( $module, 'on_uninstall' ) );

		$module->on_prepare();

		return $module;
	}

	/**
	 * Prepare the module such as add actions and filters.
	 */
	public function on_prepare() {}

	/**
	 * Initialize the module and track its state.
	 */
	final public function initialize() {
		$this->on_initialize();
	}

	/**
	 * Action(s) to perform when module is activated.
	 * Required for modules that extend this class.
	 *
	 * @return bool
	 */
	abstract protected function on_initialize();

	/**
	 * Run actions on plugin deactivation.
	 *
	 * Override this method in a specific module class to run deactivation
	 * tasks hooked to jetpack_boost_deactivate action.
	 *
	 * @see Module::__construct()
	 * @see Jetpack_Boost::deactivate()
	 */
	public function on_deactivate() {}

	/**
	 * Run actions on plugin uninstall.
	 *
	 * Override this method in a specific module class to run uninstall
	 * tasks hooked to jetpack_boost_uninstall action.
	 *
	 * @see Module::__construct()
	 * @see Jetpack_Boost::uninstall()
	 */
	public function on_uninstall() {}

	/**
	 * Overrideable method for fetching an array of admin notices to display.
	 * Each admin notice should be a child class of Admin_Notice.
	 *
	 * @return null|\Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		return null;
	}
}
