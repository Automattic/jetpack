<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\New_;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Class_Missing extends PersistentListItem implements Invocation_Warner {
	public $declaration;
	public $class_name;

	function __construct( $declaration ) {
		$this->declaration = $declaration;
		$this->class_name = $declaration->class_name;
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->declaration->path,
			$this->declaration->line,
			$this->declaration->display_name()
		);
	}

	public function type() {
		return 'missing';
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof New_ ) {
			// check if it's instantiating this missing class
			echo "Checking " . $invocation->class_name . " matches " . $this->declaration->class_name . "\n";
			if ( $invocation->class_name === $this->class_name ) {
				$warnings->add( new Warning( $invocation->path, $invocation->line, "Class " . $this->declaration->class_name . " is missing") );
			}
		}
	}
}