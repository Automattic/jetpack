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

class Module {

	/**
	 * @var Config
	 */
	protected $config;

	/**
	 * @var Generic_Module
	 */
	protected $module;


	public function __construct( $module_instance ) {
		$this->module = $module_instance;
		$this->config = new Config( $this->module->get_slug() );
	}

	/**
	 * Initialize the module and track its state.
	 */
	public function initialize() {
		$this->module->initialize();
		do_action( "jetpack_boost_{$this->module->get_slug()}_initialized", $this );
	}

	public function is_enabled() {
		return true === $this->config->get( 'enabled' );
	}

	public function enable() {
		// Only record analytics evet if the config update succeeds
		if ( ! $this->config->update( 'enabled', true ) ) {
			return false;
		}

		$this->track_module_status( false );
		return true;
	}

	public function disable() {

		// Only record analytics event if the config update succeeds
		if ( ! $this->config->update( 'enabled', false ) ) {
			return false;
		}

		$this->track_module_status( false );
		return true;
	}

	protected function track_module_status( $status ) {
		Analytics::record_user_event(
			'set_module_status',
			array(
				'module' => $this->module->get_slug(),
				'status' => $status,
			)
		);
	}

}
