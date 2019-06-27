<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\Static_Const;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Class_Const_Missing extends PersistentListItem implements Invocation_Warner {
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
		return 'class_const_missing';
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Static_Const ) {
			if ( $invocation->class_name === $this->declaration->class_name
				&& $invocation->const_name === $this->declaration->const_name) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class constant ' . $this->declaration->display_name() . ' is missing', $this->declaration ) );
			}
		}
	}
}
