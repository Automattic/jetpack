<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

class Type_Enum implements Parser {

	/**
	 * @var $valid_values array The list of valid values for the enum.
	 */
	protected $valid_values;

	public function __construct( $valid_values ) {
		$this->valid_values = $valid_values;
	}

	public function parse( $data, $_meta = null ) {
		if ( ! in_array( $data, $this->valid_values, true ) ) {
			$message = sprintf( 'Invalid value "%s". Expected one of: %s', $data, implode( ', ', $this->valid_values ) );
			throw new Schema_Validation_Error( $message, $data );
		}
		return $data;
	}
}
