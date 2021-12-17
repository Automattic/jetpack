<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

class Class_ extends Declaration {
	public $class_name;

	function __construct( $path, $line, $class_name ) {
		$this->class_name = $class_name;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
		);
	}

	/**
	 * Returns a serializable representation of the object.
	 *
	 * @return array
	 */
	public function to_map() {
		return array(
			'decl_type'  => $this->type(),
			'file_path'  => $this->path,
			'file_line'  => $this->line,
			'class_name' => $this->class_name,
		);
	}

	/**
	 * Create object from deserialized JSON object
	 *
	 * @param object $obj deserialized JSON object.
	 */
	public static function from_map( $obj ) {
		return new Class_( $obj->file_path, $obj->file_line, $obj->class_name );
	}

	function type() {
		return 'class';
	}

	function display_name() {
		return $this->class_name;
	}
}
