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

	/**
	 * LCP analysis state data
	 *
	 * @var array
	 */
	public $state = array();

	/**
	 * Retrieves and validates the LCP state
	 *
	 * @param bool $refresh Whether to refresh the state from storage.
	 * @return array The validated state
	 * @since 3.13.1
	 */
	private function get_state( $refresh = false ) {
		if ( $refresh ) {
			$stored_state = jetpack_boost_ds_get( 'lcp_state' );
			$this->state  = is_array( $stored_state ) ? $stored_state : array();
		} elseif ( ! is_array( $this->state ) ) {
			$this->state = array();
		}

		return $this->state;
	}

	public function __construct() {
		$this->get_state( true );
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
				'errors' => null,
			)
		);
	}

	/**
	 * Signifies that the page was not optimized for reason(s) in $errors.
	 *
	 * @param string $page_key The page key.
	 * @param array  $errors   The errors to set for the page.
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

	public function is_analyzed() {
		return ! empty( $this->state )
			&& isset( $this->state['status'] )
			&& self::ANALYSIS_STATES['analyzed'] === $this->state['status'];
	}

	public function is_pending() {
		return ! empty( $this->state )
			&& isset( $this->state['status'] )
			&& self::ANALYSIS_STATES['pending'] === $this->state['status'];
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

	/**
	 * Get the pages from the state.
	 *
	 * @return array The pages from the state.
	 *
	 * @since 4.0.0
	 */
	public function get_pages() {
		return $this->state['pages'];
	}

	/**
	 * Set the pages in the state.
	 *
	 * @param array $pages The pages to set in the state.
	 * @return $this
	 *
	 * @since 4.0.0
	 */
	public function set_pages( $pages ) {
		$this->state['pages'] = $pages;
		return $this;
	}

	/**
	 * Set the status to pending for the pages that are in the $pages array.
	 * Pages that are not in the $pages array will not be touched.
	 *
	 * @param array $pages The pages to set to pending.
	 * @return $this
	 *
	 * @since 4.0.0
	 */
	public function set_pending_pages( $pages ) {
		$current_pages = $this->state['pages'];

		foreach ( $pages as $page ) {
			$page_key = $page['key'];
			foreach ( $current_pages as $index => $current_page ) {
				if ( $current_page['key'] === $page_key ) {
					$current_pages[ $index ]['status'] = self::PAGE_STATES['pending'];
					break;
				}
			}
		}

		$this->state['pages'] = $current_pages;
		return $this;
	}

	/**
	 * Get fresh state
	 *
	 * @return array Current LCP state
	 * @since 3.13.1
	 */
	public function get() {
		return $this->get_state( true );
	}
}
