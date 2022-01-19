<?php
namespace Automattic\Jetpack_Boost\Lib;

class State {

	protected $config;

	protected $slug;


	public function __construct( $slug ) {
		$this->slug   = $slug;
		$this->config = new Config( $this->slug );
	}

	public function is_enabled() {
		return true === $this->config->get( 'enabled' );
	}

	public function enable() {
		// Only record analytics event if the config update succeeds
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
