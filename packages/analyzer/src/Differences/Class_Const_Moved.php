<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\Static_Const;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Class_Const_Moved extends PersistentListItem implements Invocation_Warner {
	public $old_declaration;
	public $new_declaration;

	function __construct( $old_declaration, $new_declaration ) {
		$this->old_declaration = $old_declaration;
		$this->new_declaration = $new_declaration;
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->old_declaration->path,
			$this->old_declaration->line,
			$this->old_declaration->display_name(),
		);
	}

	public function type() {
		return 'property_moved';
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Static_Const ) {
			// check if it's using this missing property
			if ( $invocation->class_name === $this->old_declaration->class_name
				&& $invocation->const_name === $this->old_declaration->const_name ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Class const ' . $this->old_declaration->display_name() . ' was moved from ' . $this->old_declaration->path . ' to ' . $this->new_declaration->path, $this->old_declaration ) );
			}
		}
	}
}
