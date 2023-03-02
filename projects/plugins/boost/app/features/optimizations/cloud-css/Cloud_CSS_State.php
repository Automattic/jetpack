<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

class Cloud_CSS_State {

	const GENERATION_STATES = array(
		'not_generated' => 'not_generated',
		'pending'       => 'pending',
		'generated'     => 'generated',
		'error'         => 'error',
	);
	const PROVIDER_STATES   = array(
		'pending' => 'pending',
		'success' => 'success',
		'error'   => 'error',
	);

	public function __construct() {
		$this->critical_css_state = new Critical_CSS_State();
	}

	public function save() {
		$this->critical_css_state->save();
	}

	private function validate_provider_key( $provider_key ) {
		$provider = array_search( $provider_key, array_column( $this->critical_css_state->state['providers'], 'key' ), true );
		if ( false === $provider ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				'Cloud CSS: validate_provider_key() called with unknown provider key: "' . $provider_key . '"'
			);

			return false;
		}
		return true;
	}

	public function set_source_error( $provider_key, $message ) {
		if ( empty( $message ) ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				'Cloud CSS: set_source_error() called with empty message'
			);

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
				'status' => self::PROVIDER_STATES['error'],
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
				'status' => self::PROVIDER_STATES['success'],
			)
		);

		return $this;
	}

	public function has_pending_provider( $needles = array() ) {
		if ( empty( $this->critical_css_state->state['providers'] ) ) {
			return false;
		}
		$providers = $this->critical_css_state->state['providers'];
		foreach ( $providers as $provider ) {
			if (
				! empty( $provider['key'] )
				&& ! empty( $provider['status'] )
				&& self::PROVIDER_STATES['pending'] === $provider['status']
				&& in_array( $provider['key'], $needles, true )
			) {
				return true;
			}
		}
		return false;
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

	public function maybe_set_generated() {
		$providers = $this->critical_css_state->state['providers'];
		if ( count( $providers ) === 0 ) {
			return $this;
		}
		$provider_states = array_column( $providers, 'status' );
		$is_done         = ! in_array( self::GENERATION_STATES['pending'], $provider_states, true );
		if ( $is_done ) {
			$this->critical_css_state->state['status'] = self::GENERATION_STATES['generated'];
		}
		return $this;
	}

}
