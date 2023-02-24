<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

class Cloud_CSS_State {
	const SUCCESS    = 'success';
	const ERROR      = 'error';
	const REQUESTING = 'requesting';

	public function __construct() {
		$this->state              = jetpack_boost_ds_get( 'cloud_critical_css_state', array() );
		$this->critical_css_state = new Critical_CSS_State();
	}

	public function save() {
		jetpack_boost_ds_set( 'cloud_critical_css_state', $this->state );
		$this->critical_css_state->save();
	}

	private function validate_provider_key( $provider_key ) {
		if ( ! isset( $this->state['sources'][ $provider_key ] ) ) {
			error_log( 'Cloud CSS: validate_provider_key() called with unknown provider key: "' . $provider_key . '"' );
			return false;
		}
		return true;
	}

	public function set_source_error( $provider_key, $message ) {
		if ( empty( $message ) ) {
			error_log( 'Cloud CSS: set_source_error() called with empty message' );
			return $this;
		}
		if ( ! is_string( $message ) ) {
			return $this;
		}
		if ( ! $this->validate_provider_key( $provider_key ) ) {
			return $this;
		}
		$this->state['sources'][ $provider_key ]['status'] = self::ERROR;
		$this->state['sources'][ $provider_key ]['error']  = $message;

		return $this;
	}

	public function set_source_success( $provider_key ) {
		if ( ! $this->validate_provider_key( $provider_key ) ) {
			return $this;
		}
		$this->state['sources'][ $provider_key ]['status'] = self::SUCCESS;
		$this->state['sources'][ $provider_key ]['error']  = null;

		return $this;
	}

	public function has_pending_provider( $providers = array() ) {
		if ( empty( $providers ) ) {
			$providers = array_keys( $this->state['sources'] );
		}

		$pending = false;
		foreach ( $this->state['sources'] as $provider_key => $source_state ) {
			if ( in_array( $provider_key, $providers, true ) && self::REQUESTING === $source_state['status'] ) {
				$pending = true;
				break;
			}
		}
		return $pending;
	}

	public function set_pending_providers( $providers ) {
		foreach ($providers as $provider) {
			$provider['status'] = self::REQUESTING;
		}

		$this->state['sources'] = $providers;

		return $this;
	}
}
