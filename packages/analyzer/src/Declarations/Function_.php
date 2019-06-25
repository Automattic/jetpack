<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Function_ extends Declaration {
	public $func_name;
	public $params;

	function __construct( $path, $line, $func_name ) {
		$this->func_name = $func_name;
		$this->params = array();
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
			'',
			$this->func_name,
			'',
			json_encode( $this->params )
		);
	}

	function type() {
		return 'function';
	}

	function display_name() {
		return $this->func_name . '(' . implode( ', ', array_map( function( $param ) { return '$' . $param->name; }, $this->params ) ) . ')';
	}
}