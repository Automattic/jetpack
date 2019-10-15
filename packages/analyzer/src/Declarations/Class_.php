<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

class Class_ extends Declaration {
	public $class_name;

	function __construct( $path, $line, $class_name ) {
		$this->class_name = $class_name;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
		);
	}

	function type() {
		return 'class';
	}

	function display_name() {
		return $this->class_name;
	}
}
