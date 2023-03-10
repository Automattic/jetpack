<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Function_ extends Declaration {
	public $func_name;
	public $params;
	public $deprecated;

	function __construct( $path, $line, $func_name, $deprecated = false ) {
		$this->func_name  = $func_name;
		$this->params     = array();
		$this->deprecated = $deprecated;
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
			json_encode( $this->params ),
			$this->deprecated,
		);
	}

	/**
	 * Returns a serializable representation of the object.
	 *
	 * @return array
	 */
	public function to_map() {
		return array(
			'decl_type'     => $this->type(),
			'file_path'     => $this->path,
			'file_line'     => $this->line,
			'member_name'   => $this->func_name,
			'fnc_params'    => $this->params,
			'is_deprecated' => $this->deprecated,
		);
	}

	/**
	 * Create object from deserialized JSON object
	 *
	 * @param object $obj deserialized JSON object.
	 */
	public static function from_map( $obj ) {
		$declaration = new Function_( $obj->file_path, $obj->file_line, $obj->member_name, $obj->is_deprecated );
		if ( is_array( $obj->fnc_params ) ) {
			foreach ( $obj->fnc_params as $param ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
		}

		return $declaration;
	}

	function type() {
		return 'function';
	}

	function display_name() {
		return $this->func_name . '(' . $this->get_params_as_string() . ')';
	}
}
