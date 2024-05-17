<?php

namespace Automattic\Jetpack_Inspect\Options;

use Automattic\Jetpack\Packages\Async_Option\Async_Option_Template;

class Monitor_Status extends Async_Option_Template {

	/**
	 * @param $value
	 *
	 * @return bool
	 */
	public function sanitize( $value ) {
		return (bool) $value;
	}

	public function validate( $value ) {
		if ( ! is_bool( $value ) ) {
			return sprintf(
				// translators: %s is a PHP type name.
				__( "Status should be a 'boolean'. Received '%s'.", 'jetpack-inspect' ),
				gettype( $value )
			);
		}
		return true;
	}

	public function transform( $value ) {
		return (bool) $value;
	}

	public function parse( $value ) {
		return filter_var( $value, FILTER_VALIDATE_BOOLEAN );
	}
}
