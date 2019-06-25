<?php

namespace Automattic\Jetpack\Analyzer\Declarations;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

abstract class Declaration extends PersistentListItem {
	public $path;
	public $line;

	function __construct( $path, $line ) {
		$this->path = $path;
		$this->line = $line;
	}

	function match( $other ) {
		return get_class( $other ) === get_class( $this )
			&& $other->display_name() === $this->display_name(); // hack
	}

	function partial_match( $other ) {
		// TODO
		return false;
	}

	// a simple name, like 'method'
	abstract function type();

	// e.g. Jetpack::get_file_url_for_environment()
	abstract function display_name();
}