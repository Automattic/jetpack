<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

/**
 * Instantiation of a class
 *
 * TODO: detect dynamic instantiations like `$shape = new $class_name( $this->images )`
 */
class Static_Property extends PersistentListItem {
	public $path;
	public $line;
	public $class_name;
	public $prop_name;

	public function __construct( $path, $line, $class_name, $prop_name ) {
		$this->path = $path;
		$this->line = $line;
		$this->class_name = $class_name;
		$this->prop_name = $prop_name;
	}

	public function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->prop_name
		);
	}

	function type() {
		return 'static_property';
	}

	function display_name() {
		return $this->class_name . '::$' . $this->prop_name;
	}
}