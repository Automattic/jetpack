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
			'class_name'    => $this->class_name,
			'member_name'   => $this->method_name,
			'is_static'     => $this->static,
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
		$declaration = new Class_Method( $obj->file_path, $obj->file_line, $obj->class_name, $obj->member_name, $obj->is_static, $obj->is_deprecated );

		if ( is_array( $obj->fnc_params ) ) {
			foreach ( $obj->fnc_params as $param ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
		}

		return $declaration;
	}

	function type() {
		return 'method';
	}

	function display_name() {
		$sep = $this->static ? '::' : '->';
		return $this->class_name . $sep . $this->method_name . '(' . $this->get_params_as_string() . ')';
	}
}
