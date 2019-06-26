<?php

namespace Automattic\Jetpack\Analyzer\Warnings;
use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

class Class_Method_Miissing_Warning extends Warning {
	function to_csv_array() {
		return array(
			$this->type,
			$this->path,
			$this->line,
			$this->message,
			$this->old_declaration->display_name(),
			$this->old_declaration->class_name,
			$this->old_declaration->method_name,
		);
	}
}