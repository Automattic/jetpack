<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;

class Type_Or implements Parser {
	private $parsers;

	public function __construct( Parser $parser ) {
		$this->parsers = array( $parser );
	}

	public function add_fallback_parser( Parser $parser ) {
		$this->parsers[] = $parser;
	}

	public function parse( $value, $context = null ) {
		$parsers_failed = array();
		foreach ( $this->parsers as $parser ) {
			try {
				// Attempt to parse the value with the current parser
				return $parser->parse( $value, $context );
			} catch ( Schema_Error $e ) {
				$parsers_failed[] = (string) $parser;
				continue;
			}
		}
		$message = 'Failed to parse value using: ' . implode( ' or ', $parsers_failed );
		// If none of the parsers succeeded, throw an exception
		throw new Schema_Error( $message, $value );
	}

	public function get_parsers() {
		return $this->parsers;
	}

	public function schema() {
		return array(
			'type'    => 'or',
			'value' => array_map(
				function ( $parser ) {
					return $parser->schema();
				},
				$this->parsers
			),
		);
	}

	public function __toString() {
		$result = array();
		foreach ( $this->parsers as $parser ) {
			$result[] = (string) $parser;
		}
		return implode( ' OR ', $result );
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}
}
