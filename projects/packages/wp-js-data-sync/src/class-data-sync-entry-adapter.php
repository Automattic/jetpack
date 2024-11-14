<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;
use Automattic\Jetpack\Schema\Schema_Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

/**
 * Data Sync Entry Adapter:
 * ========================
 * This class takes in any instance that subscribes to one or more "Entry_Can_*" interfaces
 * and adapts it to give it a predictable interface.
 *
 * This makes it possible to have an Entry class that only subscribes to "Entry_Can_Get"
 * yet still have all the other methods (set/merge/delete) available.
 *
 * Entry Adapter will infer whether an object is able to perform actions (get,set,merge,delete)
 * based on whether the object is an instance of the corresponding interface (Entry_Can_*).
 */
final class Data_Sync_Entry_Adapter implements Data_Sync_Entry {

	/**
	 * @var Entry_Can_Get&Entry_Can_Set|Entry_Can_Get&Entry_Can_Merge|Entry_Can_Get&Entry_Can_Delete - The data sync entry.
	 */
	private $entry;

	/**
	 * @var Schema_Parser $parser - The schema for the data sync entry.
	 */
	private $parser;

	/**
	 * For more explanation, see the class docblock.
	 *
	 * @see Data_Sync_Entry_Adapter
	 * The constructor accepts any entry that subscribes to at least "Entry_Can_Get", but can also
	 * subscribe to any of the other Entry_Can_* interfaces.
	 *
	 * @param Entry_Can_Get $entry - The data sync entry.
	 * @param Parser        $schema - The schema for the data sync entry.
	 */
	public function __construct( $entry, $schema ) {
		$this->entry  = $entry;
		$this->parser = $schema;
	}

	public function is( $interface_reference ) {
		return $this->entry instanceof $interface_reference;
	}

	public function get() {

		if ( $this->parser->has_fallback() ) {
			$default = $this->parser->get_fallback();
			$value   = $this->entry->get( $default );
			return $this->parser->parse( $value );
		}

		// If WordPress debug is enabled, don't hide exceptions.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			return $this->parser->parse( $this->entry->get() );
		}

		// If WordPress debug is disabled, attempt to recover by just returning the value
		try {
			return $this->parser->parse( $this->entry->get() );
		} catch ( Schema_Error $error ) {
			return $this->entry->get();
		}
	}

	public function set( $value ) {
		if ( $this->is( Entry_Can_Set::class ) ) {
			$parsed_value = $this->parser->parse( $value );
			$this->entry->set( $parsed_value );
		}
		return $this->get();
	}

	public function merge( $partial_value ) {
		if ( $this->is( Entry_Can_Merge::class ) ) {
			if ( $this->parser->has_fallback() ) {
				$default        = $this->parser->get_fallback();
				$existing_value = $this->entry->get( $default );
			} else {
				$existing_value = $this->entry->get();
			}
			$updated_value = $this->entry->merge( $existing_value, $partial_value );
			$this->set( $updated_value );
		}
		return $this->get();
	}

	public function delete() {
		if ( $this->is( Entry_Can_Delete::class ) ) {
			$this->entry->delete();
		}
		return $this->get();
	}

	/**
	 * @return Parser
	 */
	public function get_parser() {
		return $this->parser;
	}
}
