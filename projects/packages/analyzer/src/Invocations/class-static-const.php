<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use Automattic\Jetpack\Analyzer\Declarations\Class_Const;
use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

/**
 * Instantiation of a class
 *
 * TODO: detect dynamic instantiations like `$shape = new $class_name( $this->images )`
 */
class Static_Const extends PersistentListItem implements Depends_On {
	public $path;
	public $line;
	public $class_name;
	public $const_name;

	public function __construct( $path, $line, $class_name, $const_name ) {
		$this->path       = $path;
		$this->line       = $line;
		$this->class_name = $class_name;
		$this->const_name = $const_name;
	}

	public function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->const_name,
		);
	}

	function type() {
		return 'class_const';
	}

	function display_name() {
		return $this->class_name . '::' . $this->const_name;
	}

	function depends_on( $declaration ) {
		return $declaration instanceof Class_Const
			&& $this->class_name === $declaration->class_name
			&& $this->const_name === $declaration->const_name;
	}
}
