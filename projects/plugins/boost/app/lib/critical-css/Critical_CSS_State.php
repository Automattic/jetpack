<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

class Critical_CSS_State {

	const SUCCESS    = 'success';
	const ERROR      = 'error';
	const REQUESTING = 'pending';

	// @REFACTORING: Temporarily open up to public while refactoring.
	public $state;

	public function __construct() {
		$this->state = jetpack_boost_ds_get( 'critical_css_state' );
	}

	public function save() {
		$this->state['updated'] = microtime( true );
		jetpack_boost_ds_set( 'critical_css_state', $this->state );
	}

	public function set_error( $message ) {

		if ( empty( $message ) ) {
			error_log( 'Critical CSS: set_error() called with empty message' );
			return $this;
		}

		// @REFACTORING TODO: Rename to 'status_message'
		$this->state['status_error'] = $message;
		$this->state['status']       = self::ERROR;

		return $this;
	}

	public function has_errors() {
		return self::ERROR === $this->state['status'];
	}

	public function is_requesting() {
		return self::REQUESTING === $this->state['status'];
	}

}
