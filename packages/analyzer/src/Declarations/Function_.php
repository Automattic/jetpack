<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Function_ extends Declaration {
	public $name;
	public $params;

	function __construct( $path, $line, $name ) {
		$this->name = $name;
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
			$this->name,
			'',
			json_encode( $this->params )
		);
	}

	function type() {
		return 'function';
	}

	function display_name() {
		return $this->name . '(' . implode( ', ', array_map( function( $param ) { return '$' . $param->name; }, $this->params ) ) . ')';
	}
}