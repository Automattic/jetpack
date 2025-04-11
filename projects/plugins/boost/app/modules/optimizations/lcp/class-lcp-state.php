<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

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

	public function set_pending_pages( $pages ) {
		foreach ( $pages as $index => $page ) {
			$pages[ $index ]['status'] = self::PAGE_STATES['pending'];
		}
		$this->state['pages'] = $pages;
		return $this;
	}

	/**
	 * Get fresh state
	 */
	public function get() {
		$this->state = jetpack_boost_ds_get( 'lcp_state' );
		return $this->state;
	}
}
