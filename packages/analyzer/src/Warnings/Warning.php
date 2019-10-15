<?php

namespace Automattic\Jetpack\Analyzer\Warnings;

use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

class Warning extends PersistentListItem {
	public $type;
	public $path;
	public $line;
	public $message;
	public $old_declaration;

	function __construct( $type, $path, $line, $message, $old_declaration ) {
		$this->type            = $type;
		$this->path            = $path;
		$this->line            = $line;
		$this->message         = $message;
		$this->old_declaration = $old_declaration;
	}

	/**
	 * This key is used to identify unique issues (e.g. Jetpack_Options has moved) across multiple invocations
	 */
	function unique_issue_key() {
		return $this->type . ',' . $this->old_declaration->path . ',' . $this->old_declaration->line . ',' . $this->old_declaration->display_name();
	}

	function to_csv_array() {
		return array(
			$this->type,
			$this->path,
			$this->line,
			$this->message,
			$this->old_declaration->display_name(),
		);
	}
}
