<?php

namespace Automattic\Jetpack_Inspect\Monitor;

class Outgoing implements Observable {
	private $start_time = array();
	private $logs       = array();

	public function attach_hooks() {
		add_filter( 'http_request_args', array( $this, 'start_timer' ), 10, 2 );
		add_action( 'http_api_debug', array( $this, 'log' ), 10, 5 );
	}

	public function detach_hooks() {
		remove_filter( 'http_request_args', array( $this, 'start_timer' ), 10 );
		remove_action( 'http_api_debug', array( $this, 'log' ), 5 );
	}

	public function start_timer( $args, $url ) {
		$this->start_time[ $url ] = microtime( true );
		return $args;
	}

	public function log( $response, $context, $transport, $args, $url ) {

		$log = array(
			'url'      => $url,
			'args'     => $args,
			'duration' => floor( 1000 * ( microtime( true ) - $this->start_time[ $url ] ) ),
		);

		if ( is_wp_error( $response ) ) {
			$log['error'] = $response;
		} else {
			$log['response'] = $response;
		}

		$this->logs[] = $log;
	}

	public function get() {
		return $this->logs;
	}
}
