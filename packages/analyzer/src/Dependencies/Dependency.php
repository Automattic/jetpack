<?php

namespace Automattic\Jetpack\Analyzer\Dependencies;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

class Dependency extends PersistentListItem {
	public $invocation;
	public $declaration;
	public $invocation_root;

	function __construct( $invocation, $declaration, $invocation_root = null ) {
		$this->invocation = $invocation;
		$this->declaration = $declaration;
		$this->invocation_root = $invocation_root;
	}

	// /**
	//  * This key is used to identify unique issues (e.g. Jetpack_Options has moved) across multiple invocations
	//  */
	// function unique_issue_key() {
	// 	return $this->type . ',' . $this->old_declaration->path . ',' . $this->old_declaration->line . ',' . $this->old_declaration->display_name();
	// }

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