<?php

namespace Automattic\Jetpack\Schema\Types;

use Automattic\Jetpack\Schema\Parser;

class Type_Literal implements Parser {
	/**
	 * @var mixed
	 */
	private $literal_value;

	public function __construct( $literal_value ) {
		$this->literal_value = $literal_value;
	}

	public function parse( $_value, $_context ) {
		return $this->literal_value;
	}

	public function __toString() {
		if ( is_string( $this->literal_value ) ) {
			return 'literal_value("' . $this->literal_value . '")';
		}
		$type = gettype( $this->literal_value );
		return "literal_value($type)";
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		return array(
			'type' => (string) $this,
		);
	}
}
