<?php

namespace Automattic\Jetpack\Analyzer\Warnings;
use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

class Warning extends PersistentListItem {
	public $type;
	public $path;
	public $line;
	public $message;

	function __construct( $type, $path, $line, $message ) {
		$this->type = $type;
		$this->path = $path;
		$this->line = $line;
		$this->message = $message;
	}

	function to_csv_array() {
		return array(
			$this->type,
			$this->path,
			$this->line,
			$this->message
		);
	}
}