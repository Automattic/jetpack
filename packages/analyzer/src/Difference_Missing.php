<?php

namespace Automattic\Jetpack\Analyzer;

class Difference_Missing {
	public $declaration;

	function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	public function to_csv() {
		return 'missing,' . $this->declaration->path . ',' . $this->declaration->type() . ',' . $this->declaration->display_name();
	}
}