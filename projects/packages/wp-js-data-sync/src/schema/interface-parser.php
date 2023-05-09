<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

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
interface Parser {
	/**
	 * The parse method t is responsible for parsing input value.
	 *
	 * If the input value is valid, the method should return the parsed value.
	 * If the input value is invalid, the method should return a default value.
	 * or throw an exception, depending on the implementation.
	 *
	 * @param mixed $input_value The input value to be parsed.
	 *
	 * @return mixed The parsed value.
	 * @throws \Error If the input value is invalid.
	 *
	 */
	public function parse( $input_value );
}
