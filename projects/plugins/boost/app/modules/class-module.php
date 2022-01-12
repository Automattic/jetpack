<?php
/**
 * All Jetpack Boost modules are required to extend this class.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Config;

/**
 * Class Module
 */
abstract class Module {

	/**
	 * @var Config
	 */
	protected $config;

	public function __construct() {
		$this->config = new Config( $this->get_slug() );
	}

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
	public function on_prepare() { }

	/**
	 * Initialize the module and track its state.
	 */
	final public function initialize() {
		$this->on_initialize();
		do_action( "jetpack_boost_{$this->get_slug()}_initialized", $this );
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
	public function on_deactivate() { }

	/**
	 * Run actions on plugin uninstall.
	 *
	 * Override this method in a specific module class to run uninstall
	 * tasks hooked to jetpack_boost_uninstall action.
	 *
	 * @see Module::__construct()
	 * @see Jetpack_Boost::uninstall()
	 */
	public function on_uninstall() { }

	/**
	 * Overrideable method for fetching an array of admin notices to display.
	 * Each admin notice should be a child class of Admin_Notice.
	 *
	 * @return null|\Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
		return NULL;
	}

	public function get_slug() {
		// @TODO: Module slugs are currently not enforced because they're slugs.
		// This method should probably be an abstract requirement
		return static::MODULE_SLUG;
	}

	public function is_enabled() {
		return true === $this->config->get( 'enabled' );
	}

	public function enable() {
		// Only record analytics evet if the config update succeeds
		if ( $this->config->update( 'enabled', true ) ) {
			$this->track_module_status( false );
			return true;
		}

		return false;
	}

	public function disable() {

		// Only record analytics evet if the config update succeeds
		if ( $this->config->update( 'enabled', false ) ) {
			$this->track_module_status( false );
			return true;
		}

		return false;
	}

	protected function track_module_status( $status ) {
		Analytics::record_user_event(
			'set_module_status',
			array(
				'module' => $this->get_slug(),
				'status' => $status,
			)
		);
	}

}
