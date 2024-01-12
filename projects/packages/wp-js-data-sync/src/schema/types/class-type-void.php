<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

/**
 * This schema represents no data whatsoever. It will always return null.
 */
class Type_Void implements Parser {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function parse( $_data ) {
		return null;
	}
}
