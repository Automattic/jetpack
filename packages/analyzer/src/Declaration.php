<?php

namespace Automattic\Jetpack\Analyzer;

abstract class Declaration {
	public $path;
	public $line;

	function __construct( $path, $line ) {
		$this->path = $path;
		$this->line = $line;
	}

	function match( $other ) {
		return get_class( $other ) === get_class( $this )
			&& $other->name === $this->name
			&& $other->path === $this->path;
	}

	// a simple name, like 'method'
	abstract function type();

	// e.g. Jetpack::get_file_url_for_environment()
	abstract function display_name();
}