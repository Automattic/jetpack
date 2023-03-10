<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

class Critical_CSS_State {

	const GENERATION_STATES = array(
		'not_generated' => 'not_generated',
		'pending'       => 'pending',
		'generated'     => 'generated',
		'error'         => 'error',
	);

	const PROVIDER_STATES = array(
		'pending' => 'pending',
		'success' => 'success',
		'error'   => 'error',
	);
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
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				'Critical CSS: set_error() called with empty message'
			);
			return $this;
		}

		$this->state['status_error'] = $message;
		$this->state['status']       = self::GENERATION_STATES['error'];

		return $this;
	}

	public function has_errors() {
		return self::GENERATION_STATES['error'] === $this->state['status'];
	}

	public function is_requesting() {
		return self::GENERATION_STATES['pending'] === $this->state['status'];
	}

	public function prepare_request() {
		$this->state = array(
			'status'    => self::GENERATION_STATES['pending'],
			'providers' => array(),
			'created'   => microtime( true ),
			'updated'   => microtime( true ),
		);

		return $this;
	}

	public function set_pending_providers( $providers ) {
		foreach ( $providers as $key => $provider ) {
			$providers[ $key ]['status'] = self::PROVIDER_STATES['pending'];
		}
		$this->state['providers'] = $providers;
		return $this;
	}

	public function get() {
		return $this->state;
	}
}
