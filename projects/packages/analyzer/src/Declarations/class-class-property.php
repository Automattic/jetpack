<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

/**
 * We only log public class variables
 */
class Class_Property extends Declaration {
	public $class_name;
	public $prop_name;
	public $static;

	function __construct( $path, $line, $class_name, $prop_name, $static ) {
		$this->class_name = $class_name;
		$this->prop_name  = $prop_name;
		$this->static     = $static;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->prop_name,
			$this->static,
			'',
		);
	}

	/**
	 * Returns a serializable representation of the object.
	 *
	 * @return array
	 */
	public function to_map() {
		return array(
			'decl_type'   => $this->type(),
			'file_path'   => $this->path,
			'file_line'   => $this->line,
			'class_name'  => $this->class_name,
			'member_name' => $this->prop_name,
			'is_static'   => $this->static,
		);
	}

	/**
	 * Create object from deserialized JSON object
	 *
	 * @param object $obj deserialized JSON object.
	 */
	public static function from_map( $obj ) {
		return new Class_Property( $obj->file_path, $obj->file_line, $obj->class_name, $obj->member_name, $obj->is_static );
	}

	function type() {
		return 'property';
	}

	function display_name() {
		$sep = $this->static ? '::$' : '->';
		return $this->class_name . $sep . $this->prop_name;
	}
}
