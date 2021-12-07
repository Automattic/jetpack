<?php
namespace Automattic\Jetpack\Analyzer;

/**
 * Abstract-ish controller class.
 */
class Controller {
	public function process() {
		$out  = array( 'status' => 'OK' );
		$data = '';
		switch ( $_SERVER['REQUEST_METHOD'] ) {
			case 'GET':
				$data = $this->get();
				break;
			case 'POST':
				$data = $this->post();
				break;

			default:
				break;
		}

		$out['data'] = $data;

		return $out;
	}
}
