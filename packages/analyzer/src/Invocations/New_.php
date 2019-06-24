<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

/**
 * Instantiation of a class
 */
class New_ {
	public $path;
	public $line;
	public $class_name;

	public function __construct( $path, $line, $class_name ) {
		$this->path = $path;
		$this->line = $line;
		$this->class_name = $class_name;
	}

	public function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name
		);
	}

	function type() {
		return 'class';
	}

	function display_name() {
		return $this->class_name;
	}
}