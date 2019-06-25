<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\Function_Call;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Function_Missing extends PersistentListItem implements Invocation_Warner {
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
		return 'function_missing';
	}

	public function display_name() {
		return $this->declaration->display_name();
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation instanceof Function_Call ) {
			// check if it's instantiating this missing class
			if ( $invocation->func_name === $this->declaration->func_name ) {
				$warnings->add( new Warning( $this->type(), $invocation->path, $invocation->line, 'Function ' . $this->declaration->display_name() . ' is missing' ) );
			}
		}
	}
}
