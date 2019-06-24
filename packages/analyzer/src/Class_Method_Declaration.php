<?php

namespace Automattic\Jetpack\Analyzer;

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Class_Method_Declaration extends Declaration {
	public $class_name;
	public $name;
	public $params;
	public $static;

	function __construct( $path, $line, $class_name, $name, $static ) {
		$this->class_name = $class_name;
		$this->name = $name;
		$this->params = array();
		$this->static = $static;
		parent::__construct( $path, $line );
	}

	// TODO: parse "default" into comparable string form?
	function add_param( $name, $default, $type, $byRef, $variadic ) {
		$this->params[] = (object) compact( 'name', 'default', 'type', 'byRef', 'variadic' );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->name,
			$this->static,
			json_encode( $this->params )
		);
	}

	function type() {
		return 'method';
	}

	function display_name() {
		$sep = $this->static ? '::' : '->';
		return $this->class_name . $sep . $this->name . '(' . implode( ', ', array_map( function( $param ) { return '$' . $param->name; }, $this->params ) ) . ')';
	}
}