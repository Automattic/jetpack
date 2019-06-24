<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class variables
 */
class Class_Property extends Declaration {
	public $class_name;
	public $name;
	public $static;

	function __construct( $path, $line, $class_name, $name, $static ) {
		$this->class_name = $class_name;
		$this->name = $name;
		$this->static = $static;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->name,
			$this->static,
			''
		);
	}

	function type() {
		return 'property';
	}

	function display_name() {
		$sep = $this->static ? '::$' : '->';
		return $this->class_name . $sep . $this->name;
	}
}