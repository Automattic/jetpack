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
	 * Keep track of whether or not the current Module has been initialized
	 *
	 * @var bool
	 */
	protected $is_initialized = false;

	/**
	 * Action(s) to perform when module is activated.
	 * Required for modules that extend this class.
	 *
	 * @return bool
	 */
	abstract protected function on_initialize();

	/**
	 * Modules extending this class will auto-register routes
	 * using `register_rest_routes` method if it's available.
	 */
	public function __construct() {
		if ( $this->has_rest_routes() ) {
			add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		}
	}

	/**
	 * Initialize the module and track its state.
	 */
	final public function initialize() {
		// Assume initialization has succeeded unless `false` is returned.
		$this->is_initialized = ( false !== $this->on_initialize() );
	}

	/**
	 * Check if this module has been activated.
	 *
	 * @return bool
	 */
	final public function is_initialized() {
		return $this->is_initialized;
	}

	/**
	 * Check if the module extending this class is registering routes.
	 *
	 * If `register_rest_routes` method exists, it will automatically
	 * be called on `rest_api_init` action
	 *
	 * @return bool
	 */
	final public function has_rest_routes() {
		return method_exists( $this, 'register_rest_routes' );
	}

	/**
	 * Check if this module should be enabled in the REST API.
	 *
	 * @used-by register_rest_route() permission_callback hook
	 * @return bool|\WP_Error
	 */
	final public function rest_is_module_available() {
		if ( false === $this->is_initialized() ) {
			return new \WP_Error( __( 'Sorry, this module is not active', 'jetpack-boost' ) );
		}

		return true;
	}

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
