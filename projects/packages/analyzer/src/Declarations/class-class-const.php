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
			'member_name' => $this->const_name,
		);
	}

	/**
	 * Create object from deserialized JSON object
	 *
	 * @param object $obj deserialized JSON object.
	 */
	public static function from_map( $obj ) {
		return new Class_Const( $obj->file_path, $obj->file_line, $obj->class_name, $obj->member_name );
	}

	function type() {
		return 'class_const';
	}

	function display_name() {
		return $this->class_name . '::' . $this->const_name;
	}
}
