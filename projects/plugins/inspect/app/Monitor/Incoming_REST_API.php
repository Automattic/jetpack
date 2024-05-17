<?php

namespace Automattic\Jetpack_Inspect\Monitor;

class Incoming_REST_API implements Observable {
	private $logs = array();

	public function attach_hooks() {
		add_action( 'rest_request_after_callbacks', array( $this, 'log' ), 10, 3 );
	}

	public function detach_hooks() {
		remove_action( 'rest_request_after_callbacks', array( $this, 'log' ) );
	}

	public function log( $response, $handler, $request ) {
		// We might accidentally log too much.
		// If route starts with `/jetpack-inspect` ignore it:
		if ( strpos( $request->get_route(), '/jetpack-inspect' ) === 0 ) {
			return $response;
		}

		$url = rest_url( $request->get_route() );

		$headers = $request->get_headers();
		if ( isset( $headers['cookie'] ) && ! ( defined( 'JETPACK_INSPECT_DEBUG' ) && JETPACK_INSPECT_DEBUG ) ) {
			$headers['cookie'] = '<hidden>';
		}

		$this->logs[] = array(
			'url'      => $url,
			'request'  => array(
				'method'  => $request->get_method(),
				'body'    => $request->get_body(),
				'query'   => $request->get_query_params(),
				'headers' => $headers,

			),
			'response' => $response,
		);

		return $response;
	}

	public function get() {
		return $this->logs;
	}
}
