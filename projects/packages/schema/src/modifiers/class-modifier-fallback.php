<?php

namespace Automattic\Jetpack\Schema\Modifiers;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;
use Automattic\Jetpack\Schema\Utils;

class Modifier_Fallback implements Parser {
	private $parsers = array();

	public function add_fallback_parser( Parser $parser ) {
		$this->parsers[] = $parser;
	}

	public function parse( $value, $context ) {
		$parsers_failed = array();
		foreach ( $this->parsers as $key => $parser ) {
			try {
				// Attempt to parse the value with the current parser
				return $parser->parse( $value, $context );
			} catch ( Schema_Error $error ) {

				if ( Utils::is_debug() ) {
					$next_parser = $this->parsers[ $key + 1 ] ?? 'none';
					$data        = array(
						'parser'            => (string) $parser,
						'next_parser'       => (string) $next_parser,
						'parsers_available' => $this->parsers,
					);
					$value_type  = gettype( $value );
					$context->log( "Fallback($parser): Failed to parse $value_type.", $data, $error );
				}

				$parsers_failed[] = (string) $parser;
				continue;
			}
		}

		$message = 'Failed to parse value using: ' . implode( ' or ', $parsers_failed );

		// If none of the parsers succeed, throw Schema_Error
		throw new Schema_Error( $message, $value );
	}

	public function get_parsers() {
		return $this->parsers;
	}

	public function schema() {
		return array(
			'type'  => 'or',
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
