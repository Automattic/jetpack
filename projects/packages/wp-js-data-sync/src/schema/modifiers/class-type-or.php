<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Or implements Parser {
	private $conditions;

	public function __construct( Parser $parser ) {
		$this->conditions = array( $parser );
	}

	public function add_condition( Parser $parser ) {
		$this->conditions[] = $parser;
	}

	public function parse( $value, $meta = null ) {
		$parsers_failed = array();
		foreach ( $this->conditions as $parser ) {
			try {
				// Attempt to parse the value with the current parser
				return $parser->parse( $value, $meta );
			} catch ( Schema_Internal_Error $e ) {
				$parsers_failed[] = (string) $parser;
				continue;
			}
		}
		$message = 'Failed to parse value using: ' . implode( ' or ', $parsers_failed );
		// If none of the parsers succeeded, throw an exception
		throw new Schema_Internal_Error( $message, $value );
	}

	public function schema() {
		return array(
			'type'    => 'or',
			'parsers' => array_map(
				function ( $parser ) {
					return $parser->schema();
				},
				$this->conditions
			),
		);
	}

	public function __toString() {
		$result = array();
		foreach ( $this->conditions as $parser ) {
			$result[] = (string) $parser;
		}
		return implode( ' OR ', $result );
	}

	#[\ReturnTypeWillChange]
	function jsonSerialize() {
		return $this->schema();
	}
}
