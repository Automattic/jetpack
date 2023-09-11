<?php
namespace Automattic\Jetpack\Analyzer;

/**
 * Router class. App entry point
 */
class Router {

	private $status;
	private $analyze;
	private $params;

	public function __construct() {
		$this->status  = new Status_Controller();
		$this->analyze = new Analyze_Controller();
		$this->params = new Params();
	}


	public function handle_request() {
		if ( $this->params->get_param( 'status' ) !== false ) {
			return $this->status->process();
		} elseif ( $this->params->get_param( 'analyze' ) !== false ) {
			return $this->analyze->process();
		} else {
			throw new \Exception( 'Unknown route' );
		}
	}
}
