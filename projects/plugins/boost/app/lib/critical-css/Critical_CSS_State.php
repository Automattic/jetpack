<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use WP_Error;

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

	public function clear() {
		jetpack_boost_ds_delete( 'critical_css_state' );
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

	public function set_provider_error_dismissed( $provider_key, $error_type, $dismissed ) {
		if ( empty( $this->state['providers'] ) ) {
			return new WP_Error( 'invalid_provider_key', 'No providers exist' );
		}

		$provider_index = array_search( $provider_key, array_column( $this->state['providers'], 'key' ), true );
		if ( $provider_index === false ) {
			return new WP_Error( 'invalid_provider_key', 'Invalid provider key' );
		}

		if ( ! isset( $this->state['providers'][ $provider_index ]['dismissed_errors'] ) ) {
			$this->state['providers'][ $provider_index ]['dismissed_errors'] = array();
		}

		if ( $dismissed ) {
			if ( ! in_array( $error_type, $this->state['providers'][ $provider_index ]['dismissed_errors'], true ) ) {
				$this->state['providers'][ $provider_index ]['dismissed_errors'][] = $error_type;
			}
		} else {
			$key = array_search( $error_type, $this->state['providers'][ $provider_index ]['dismissed_errors'], true );
			if ( $key !== false ) {
				unset( $this->state['providers'][ $provider_index ]['dismissed_errors'][ $key ] );
				$this->state['providers'][ $provider_index ]['dismissed_errors'] = array_values( $this->state['providers'][ $provider_index ]['dismissed_errors'] );
			}
		}

		return true;
	}

	/**
	 * Update a provider's state. The provider must already exist in the state to be updated.
	 *
	 * @param string $provider_key The provider key.
	 * @param array  $state        An array to overlay over the current state.
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	private function update_provider_state( $provider_key, $state ) {
		if ( empty( $this->state['providers'] ) ) {
			return new WP_Error( 'invalid_provider_key', 'No providers exist' );
		}

		$provider_index = array_search( $provider_key, array_column( $this->state['providers'], 'key' ), true );
		if ( $provider_index === false ) {
			return new WP_Error( 'invalid_provider_key', 'Invalid provider key' );
		}

		$this->state['providers'][ $provider_index ] = array_merge(
			$this->state['providers'][ $provider_index ],
			$state
		);

		$this->maybe_set_generated();

		return true;
	}

	/**
	 * Set a provider's state to error.
	 *
	 * @param string $provider_key The provider key.
	 * @param array  $errors        A list of errors to store with this provider.
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public function set_provider_errors( $provider_key, $errors ) {
		return $this->update_provider_state(
			$provider_key,
			array(
				'status' => self::PROVIDER_STATES['error'],
				'errors' => $errors,
			)
		);
	}

	/**
	 * Set a provider's state to success.
	 *
	 * @param string $provider_key The provider key.
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public function set_provider_success( $provider_key ) {
		return $this->update_provider_state(
			$provider_key,
			array(
				'status' => self::PROVIDER_STATES['success'],
			)
		);
	}

	/**
	 * Set the state to generated if all providers are done. Should be called wherever
	 * a provider's state is updated.
	 */
	private function maybe_set_generated() {
		if ( empty( $this->state['providers'] ) ) {
			return;
		}

		$provider_states = array_column( $this->state['providers'], 'status' );
		$is_done         = ! in_array( self::GENERATION_STATES['pending'], $provider_states, true );

		if ( $is_done ) {
			$this->state['status'] = self::GENERATION_STATES['generated'];
			do_action( 'jetpack_boost_critical_css_generated' );
		}
	}

	public function has_errors() {
		// Check if any of the providers have errors as well.
		$any_provider_has_error = in_array(
			'error',
			array_unique(
				wp_list_pluck(
					$this->state['providers'],
					'status'
				)
			),
			true
		);

		return self::GENERATION_STATES['error'] === $this->state['status'] || $any_provider_has_error;
	}

	public function get_error_message() {
		return isset( $this->state['status_error'] ) ? $this->state['status_error'] : null;
	}

	public function is_generated() {
		return self::GENERATION_STATES['generated'] === $this->state['status'];
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

	/**
	 * Add providers to the state, sets their status to pending
	 * and sets the generation status to pending.
	 *
	 * @param array $providers The providers to include in the state and set as pending.
	 * @return $this
	 */
	public function prepare_for_generation( $providers ) {
		$this->set_pending_providers( $providers );
		$this->state['status'] = self::GENERATION_STATES['pending'];
		return $this;
	}

	/**
	 * Get fresh state
	 */
	public function get() {
		$this->state = jetpack_boost_ds_get( 'critical_css_state' );
		return $this->state;
	}

	public function has_pending_provider( $needles = array() ) {
		if ( empty( $this->state['providers'] ) ) {
			return false;
		}

		$providers = $this->state['providers'];
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
}
