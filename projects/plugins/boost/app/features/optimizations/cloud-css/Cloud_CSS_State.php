<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

class Cloud_CSS_State {
	const SUCCESS = 'success';
	const ERROR   = 'error';
	const PENDING = 'pending';

	public function __construct() {
		$this->critical_css_state = new Critical_CSS_State();
	}

	public function save() {
		$this->critical_css_state->save();
	}

	private function validate_provider_key( $provider_key ) {
		$provider = array_search( $provider_key, array_column( $this->critical_css_state->state['providers'], 'key' ), true );
		if ( false === $provider ) {
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

		$this->update_provider(
			$provider_key,
			array(
				'status' => self::ERROR,
				'error'  => $message,
			)
		);

		return $this;
	}

	public function set_source_success( $provider_key ) {
		if ( ! $this->validate_provider_key( $provider_key ) ) {
			return $this;
		}

		$this->update_provider(
			$provider_key,
			array(
				'status' => self::SUCCESS,
				'error'  => null,
			)
		);

		return $this;
	}

	public function has_pending_provider( $providers = array() ) {
		if ( empty( $providers ) ) {
			$providers = $this->critical_css_state->state['providers'];
		}

		$pending = false;
		foreach ( $this->critical_css_state->state['providers'] as $provider ) {
			$provider_key = $provider['key'];
			if ( in_array( $provider_key, $providers, true ) && isset( $provider['status'] ) && self::PENDING === $provider['status'] ) {
				$pending = true;
				break;
			}
		}
		return $pending;
	}

	public function set_pending_providers( $providers ) {
		foreach ( $providers as $key => $provider ) {
			$providers[ $key ]['status'] = self::PENDING;
		}
		$this->critical_css_state->state['providers'] = $providers;
		return $this;
	}

	private function update_provider( $provider_key, $partial_data ) {
		if ( ! $this->validate_provider_key( $provider_key ) ) {
			return $this;
		}

		$provider_index   = array_search( $provider_key, array_column( $this->critical_css_state->state['providers'], 'key' ), true );
		$current_provider = $this->critical_css_state->state['providers'][ $provider_index ];
		$this->critical_css_state->state['providers'][ $provider_index ] = array_merge(
			$current_provider,
			$partial_data
		);

		return $this;
	}

	public function prepare_request() {
		$this->critical_css_state->state = array(
			'status'               => 'pending',
			'retried_show_stopper' => false,
			'providers'            => array(),
			'issues'               => array(),
			'created'              => microtime( true ),
			'updated'              => microtime( true ),
		);

		return $this;
	}
}
