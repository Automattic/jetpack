<?php

namespace Automattic\Jetpack\Analyzer;

class Status_Controller extends Controller {

	public function get() {
		return $this->model->get_status();
	}

	public function post() {
		return 'Status_Controller post';
	}

}
