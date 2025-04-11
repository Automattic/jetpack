<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use WP_Error;

class LCP_State {
	const ANALYSIS_STATES = array(
		'not_analyzed' => 'not_analyzed',
		'pending'      => 'pending',
		'analyzed'     => 'analyzed',
		'error'        => 'error',
	);

	const PAGE_STATES = array(
		'pending' => 'pending',
		'success' => 'success',
		'error'   => 'error',
	);

	public $state;

	public function __construct() {
		$this->state = jetpack_boost_ds_get( 'lcp_state' );
	}

	public function clear() {
		jetpack_boost_ds_delete( 'lcp_state' );
	}

	public function save() {
		$this->state['updated'] = microtime( true );
		jetpack_boost_ds_set( 'lcp_state', $this->state );

		if ( $this->is_analyzed() ) {
			/**
			 * Fires when LCP analysis has successfully completed.
			 */
			do_action( 'jetpack_boost_lcp_analyzed' );
		}
	}

	public function set_error( $message ) {
		if ( empty( $message ) ) {
			return $this;
		}

		$this->state['status_error'] = $message;
		$this->state['status']       = self::ANALYSIS_STATES['error'];

		return $this;
	}

	/**
	 * Update a page's state. The page must already exist in the state to be updated.
	 *
	 * @param string $page_key The page key.
	 * @param array  $state    An array to overlay over the current state.
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	public function update_page_state( $page_key, $state ) {
		if ( empty( $this->state['pages'] ) ) {
			return new WP_Error( 'invalid_page_key', 'No pages exist' );
		}

		$page_index = array_search( $page_key, array_column( $this->state['pages'], 'key' ), true );
		if ( $page_index === false ) {
			return new WP_Error( 'invalid_page_key', 'Invalid page key' );
		}

		$this->state['pages'][ $page_index ] = array_merge(
			$this->state['pages'][ $page_index ],
			$state
		);

		$this->maybe_set_analyzed();

		return true;
	}

	/**
	 * Set a page's state to error.
	 *
	 * @param string $page_key The page key.
	 * @param array  $errors   A list of errors to store with this page.
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	public function set_page_errors( $page_key, $errors ) {
		return $this->update_page_state(
			$page_key,
			array(
				'status' => self::PAGE_STATES['error'],
				'errors' => $errors,
			)
		);
	}

	/**
	 * Set a page's state to success.
	 *
	 * @param string $page_key The page key.
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	public function set_page_success( $page_key ) {
		return $this->update_page_state(
			$page_key,
			array(
				'status' => self::PAGE_STATES['success'],
			)
		);
	}

	/**
	 * Set the state to analyzed if all pages are done. Should be called wherever
	 * a page's state is updated.
	 */
	private function maybe_set_analyzed() {
		if ( empty( $this->state['pages'] ) ) {
			return;
		}

		$page_states = array_column( $this->state['pages'], 'status' );
		$is_done     = ! in_array( self::PAGE_STATES['pending'], $page_states, true );

		if ( $is_done ) {
			$this->state['status'] = self::ANALYSIS_STATES['analyzed'];
		}
	}

	public function has_errors() {
		// Check if any of the pages have errors as well
		$any_page_has_error = ! empty( $this->state['pages'] ) && in_array(
			'error',
			array_unique(
				wp_list_pluck(
					$this->state['pages'],
					'status'
				)
			),
			true
		);

		return self::ANALYSIS_STATES['error'] === $this->state['status'] || $any_page_has_error;
	}

	public function get_error_message() {
		return isset( $this->state['status_error'] ) ? $this->state['status_error'] : null;
	}

	public function is_analyzed() {
		return self::ANALYSIS_STATES['analyzed'] === $this->state['status'];
	}

	public function is_pending() {
		return self::ANALYSIS_STATES['pending'] === $this->state['status'];
	}

	public function prepare_request() {
		$this->state = array(
			'status'  => self::ANALYSIS_STATES['pending'],
			'pages'   => array(),
			'created' => microtime( true ),
			'updated' => microtime( true ),
		);

		return $this;
	}

	public function set_pending_pages( $pages ) {
		foreach ( $pages as $index => $page ) {
			$pages[ $index ]['status'] = self::PAGE_STATES['pending'];
		}
		$this->state['pages'] = $pages;
		return $this;
	}

	/**
	 * Add pages to the state, sets their status to pending
	 * and sets the analysis status to pending.
	 *
	 * @param array $pages The pages to include in the state and set as pending.
	 * @return $this
	 */
	public function prepare_for_analysis( $pages ) {
		$this->set_pending_pages( $pages );
		$this->state['status'] = self::ANALYSIS_STATES['pending'];
		return $this;
	}

	/**
	 * Get fresh state
	 */
	public function get() {
		$this->state = jetpack_boost_ds_get( 'lcp_state' );
		return $this->state;
	}

	/**
	 * Check if a specific page is pending
	 *
	 * @param array $page_keys Array of page keys to check
	 * @return bool
	 */
	public function has_pending_page( $page_keys = array() ) {
		if ( empty( $this->state['pages'] ) ) {
			return false;
		}

		$pages = $this->state['pages'];
		foreach ( $pages as $page ) {
			if (
				! empty( $page['key'] )
				&& ! empty( $page['status'] )
				&& self::PAGE_STATES['pending'] === $page['status']
				&& in_array( $page['key'], $page_keys, true )
			) {
				return true;
			}
		}
		return false;
	}
}
