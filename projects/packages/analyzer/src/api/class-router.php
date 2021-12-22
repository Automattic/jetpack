<?php
namespace Automattic\Jetpack\Analyzer;

/**
 * Router class. App entry point
 */
class Router {

	private $status;
	private $analyze;

	public function __construct() {
		$this->status  = new Status_Controller();
		$this->analyze = new Analyze_Controller();
	}

	public function handle_request() {
		if ( strpos($_SERVER['REQUEST_URI'], '?status' ) !== false ) {
			return $this->status->process();
		} elseif ( str_contains( $_SERVER['REQUEST_URI'], '?analyze' ) ) {
			return $this->analyze->process();
		} else {
			throw new \Exception( 'Unknown route' );
		}
	}
}
