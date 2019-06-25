<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\Function_Call;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Function_Moved extends PersistentListItem implements Invocation_Warner {
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
		return 'function_moved';
	}

	public function display_name() {
		return $this->old_declaration->display_name();
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Function_Call ) {
			// check if it's instantiating this missing class
			if ( $invocation->func_name === $this->old_declaration->func_name ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Function ' . $this->old_declaration->display_name() . ' was moved from ' . $this->old_declaration->path . ' to ' . $this->new_declaration->path ) );
			}
		}
	}
}
