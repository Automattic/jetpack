<?php
namespace Automattic\Jetpack\Analyzer;

/**
 * Abstract-ish controller class.
 */
class Controller {
	protected $model;
	protected $params;

	public function __construct() {
		$this->model = new Model();
		$this->params = New Params();
	}

	public function process() {
		$out  = array( 'result' => 'OK' );
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
