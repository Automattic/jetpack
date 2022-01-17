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

class Module_Toggle {

	protected $config;

	protected $slug;


	public function __construct( $module_slug ) {
		$this->slug   = $module_slug;
		$this->config = new Config( $this->slug );
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
				'module' => $this->slug,
				'status' => $status,
			)
		);
	}

}
