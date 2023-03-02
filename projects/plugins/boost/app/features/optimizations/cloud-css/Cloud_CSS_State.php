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
		/**
		 * @REFACTORING
		 * This is tricky.
		 * There was no separation of concerns for Cloud CSS and Critical CSS before the rafactor,
		 * and that didn't work out too well. Initially, I was thinking to create a brand new class (Cloud_CSS)
		 * and handle the state completely separately from Critical CSS.
		 * But after refactoring, I realized that a lot of code is shared between the two,
		 * And the only real difference between Cloud CSS and Critical CSS is that Cloud CSS
		 * is inserting CSS state from the cloud. Everything else, structure-wise is now the same.
		 *
		 * And so, the tricky part is - I don't want to methods to the main Critical_CSS class
		 * that are only used by Cloud CSS.
		 *
		 * But also, exposing a `critical_css_state->state` doesn't seem like a good way to go.
		 * I could just read the option using `jetpack_boost_ds_get()` and duplicate that bit of code,
		 * but that too seems kind of messy.
		 *
		 * I haven't hought long enough about this, for now - leaving it as is.
		 * (and no, inheritance is never the right answer. It's an easy answer, not the right one.)
		 */
		$this->critical_css_state = new Critical_CSS_State();
	}

	public function save() {
		$this->critical_css_state->save();
	}

	private function validate_provider_key( $provider_key ) {
		$provider = array_search( $provider_key, array_column( $this->critical_css_state->state['providers'], 'key' ), true );
		if ( false === $provider ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log - error logging a condition that should never occur.
			error_log( 'Cloud CSS: validate_provider_key() called with unknown provider key: "' . $provider_key . '"' );
			return false;
		}
		return true;
	}

	public function set_source_error( $provider_key, $message ) {
		if ( empty( $message ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log - error logging a condition that should never occur.
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
