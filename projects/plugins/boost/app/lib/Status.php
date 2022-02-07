<?php

namespace Automattic\Jetpack_Boost\Lib;

class Status {

	protected $slug;

	public function __construct( $slug ) {
		$this->slug = 'jetpack_boost_status_' . $slug;
	}

	public function is_enabled() {
		return '1' === get_option( $this->slug );
	}

	public function update( $new_status ) {

		if ( update_option( $this->slug, (bool) $new_status ) ) {
			// Only record analytics event if the config update succeeds.
			$this->track_module_status( (bool) $new_status );
			return true;
		}
		return false;
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
