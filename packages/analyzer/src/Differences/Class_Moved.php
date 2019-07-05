<?php

namespace Automattic\Jetpack\Analyzer\Differences;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;
use Automattic\Jetpack\Analyzer\Invocations\New_;
use Automattic\Jetpack\Analyzer\Warnings\Warning; // TODO - subclasses?

class Class_Moved extends PersistentListItem implements Invocation_Warner {
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
		return 'class_moved';
	}

	public function find_invocation_warnings( $invocation, $warnings ) {
		if ( $invocation->depends_on( $this->declaration ) ) {
			$warnings->add(
				new Warning( $this->type(), $invocation->path, $invocation->line, 'Class ' . $this->old_declaration->display_name() . ' was moved from ' . $this->old_declaration->path . ' to ' . $this->new_declaration->path, $this->old_declaration )
			);
		}
	}
}
