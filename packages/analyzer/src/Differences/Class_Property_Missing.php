<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\Static_Property;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Class_Property_Missing extends PersistentListItem implements Invocation_Warner {
	public $declaration;

	function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->declaration->path,
			$this->declaration->line,
			$this->declaration->display_name(),
		);
	}

	public function type() {
		return 'property_missing';
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Static_Property ) {
			// check if it's using this missing property
			if ( $invocation->class_name === $this->declaration->class_name
				&& $invocation->prop_name === $this->declaration->prop_name
				&& $this->declaration->static ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class static property ' . $this->declaration->display_name() . ' is missing' ) );
			}
		}
	}
}
