<?php

namespace Automattic\Jetpack\Analyzer\Invocations;

use Automattic\Jetpack\Analyzer\Declarations\Function_;
use Automattic\Jetpack\Analyzer\PersistentList\Item as PersistentListItem;

/**
 * Invocations of a function
 *
 * TODO: detect dynamic invocations like `$function_name( 'hi' )`
 */
class Function_Call extends PersistentListItem implements Depends_On {
	public $path;
	public $line;
	public $func_name;

	public function __construct( $path, $line, $func_name ) {
		$this->path      = $path;
		$this->line      = $line;
		$this->func_name = $func_name;
	}

	public function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			'',
			$this->func_name,
		);
	}

	function type() {
		return 'function_call';
	}

	function display_name() {
		return $this->func_name;
	}

	function depends_on( $declaration ) {
		return $declaration instanceof Function_
			&& $this->func_name === $declaration->func_name;
	}
}
