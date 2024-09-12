<?php

namespace Automattic\Jetpack\Schema;

/**
 * The Parser interface defines the contract for schema type classes.
 *
 * Each schema type class implementing this interface should provide a parse
 * method to handle converting the input value to the correct data type.
 *
 * The purpose of the interface is to provide a consistent way to work with
 * different schema types, ensuring that all schema type classes have a common
 * method to perform the necessary data handling.
 */
interface Parser extends \JsonSerializable {
	/**
	 * The parse method t is responsible for parsing input value.
	 *
	 * If the input value is valid, the method should return the parsed value.
	 * If the input value is invalid, the method should return a default value.
	 * or throw an exception, depending on the implementation.
	 *
	 * @param mixed          $value   The input value to be parsed.
	 * @param Schema_Context $context Schema validation metadata.
	 *
	 * @return mixed The parsed value.
	 * @throws \RuntimeException If the input value is invalid.
	 */
	public function parse( $value, $context );

	/**
	 * The describe method is responsible for returning a description of the schema.
	 *
	 * @return array
	 */
	public function schema();

	/**
	 * The __toString method is responsible for returning a string representation of the schema.
	 *
	 * @return string
	 */
	public function __toString();
}
