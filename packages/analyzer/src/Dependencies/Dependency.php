<?php

namespace Automattic\Jetpack\Analyzer\Dependencies;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

class Dependency extends PersistentListItem {
	public $invocation;
	public $declaration;
	public $invocation_root;

	function __construct( $invocation, $declaration, $invocation_root = null ) {
		$this->invocation      = $invocation;
		$this->declaration     = $declaration;
		$this->invocation_root = $invocation_root;
	}

	function to_csv_array() {
		return array(
			'dependency',
			$this->invocation->path,
			$this->invocation->line,
			$this->invocation->display_name(),
			$this->declaration->display_name(),
		);
	}

	function full_path() {
		return $this->invocation_root ? $this->invocation_root . $this->invocation->path : $this->invocation->path;
	}
}
