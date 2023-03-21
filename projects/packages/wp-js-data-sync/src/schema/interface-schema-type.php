<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

/**
 * The Schema_Type interface defines the contract for schema type classes.
 * Each schema type class implementing this interface should provide a parse
 * method to handle converting the input value to the correct data type.
 *
 * The purpose of the interface is to provide a consistent way to work with
 * different schema types, ensuring that all schema type classes have a common
 * method to perform the necessary data handling.
 */
interface Schema_Type {
	/**
	 * The parse method is responsible for validating and sanitizing the input
	 * value according to the specific data type.
	 *
	 * If the input value is valid, the method should return the sanitized value.
	 * If the input value is invalid, the method should return a default value
	 * or throw an exception, depending on the implementation.
	 *
	 * @param mixed $value The input value to be parsed.
	 *
	 * @return mixed The sanitized and/or validated value.
	 */
	public function parse( $value );
}
