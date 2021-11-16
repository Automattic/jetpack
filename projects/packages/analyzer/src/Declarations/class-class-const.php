<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class variables
 */
class Class_Const extends Declaration {
	public $class_name;
	public $const_name;

	function __construct( $path, $line, $class_name, $const_name ) {
		$this->class_name = $class_name;
		$this->const_name = $const_name;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->const_name,
			'',
			'',
		);
	}

	function type() {
		return 'class_const';
	}

	function display_name() {
		return $this->class_name . '::' . $this->const_name;
	}
}
