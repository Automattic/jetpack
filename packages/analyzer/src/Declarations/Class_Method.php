<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Class_Method extends Declaration {
	public $class_name;
	public $method_name;
	public $params;
	public $static;
	public $deprecated;

	function __construct( $path, $line, $class_name, $method_name, $static, $deprecated = false ) {
		$this->class_name  = $class_name;
		$this->method_name = $method_name;
		$this->params      = array();
		$this->static      = $static;
		$this->deprecated  = $deprecated;
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
			$this->method_name,
			$this->static,
			json_encode( $this->params ),
			$this->deprecated,
		);
	}

	function type() {
		return 'method';
	}

	function display_name() {
		$sep = $this->static ? '::' : '->';
		return $this->class_name . $sep . $this->method_name . '(' . $this->get_params_as_string() . ')';
	}
}
