<?php

/**
 * Class Jetpack_Constants
 *
 * Testing constants is hard. Once you define a constant, it's defined. Jetpack_Constants is an
 * abstraction layer so that unit tests can set "constants" for tests.
 *
 * To test your code, you'll need to swap out `defined( 'CONSTANT' )` with `Jetpack_Constants::is_defined( 'CONSTANT' )`
 * and replace `CONSTANT` with `Jetpack_Constants::get_constant( 'CONSTANT' )`. Then in the unit test, you can set the
 * constant with `Jetpack::set_constant( 'CONSTANT', $value )` and then clean up after each test with something like
 * this:
 *
 * function tearDown() {
 *     Jetpack_Constants::clear_constants();
 * }
 */
class Jetpack_Constants {
	static $set_constants = array();

	/**
	 * Checks if a "constant" has been set in Jetpack_Constants, and if not,
	 * checks if the constant was defined with define( 'name', 'value ).
	 *
	 * @param $name string The name of the constant
	 *
	 * @return bool
	 */
	public static function is_defined( $name ) {
		return array_key_exists( $name, self::$set_constants )
			? true
			: defined( $name );
	}

	/**
	 * Attempts to retrieve the "constant" from Jetpack_Constants, and if it hasn't been set,
	 * then attempts to get the constant with the constant() function.
	 *
	 * @param $name
	 *
	 * @return mixed null if the constant does not exist or the value of the constant.
	 */
	public static function get_constant( $name ) {
		if ( array_key_exists( $name,  self::$set_constants ) ) {
			return self::$set_constants[ $name ];
		}

		return defined( $name ) ? constant( $name ) : null;
	}

	/**
	 * Sets the value of the "constant" within Jetpack_Constants.
	 *
	 * @param $name  string The name of the "constant"
	 * @param $value string The value of the "constant"
	 */
	public static function set_constant( $name, $value ) {
		self::$set_constants[ $name ] = $value;
	}

	/**
	 * Will unset a "constant" from Jetpack_Constants if the constant exists.
	 *
	 * @param $name string The name of the "constant"
	 *
	 * @return bool Whether the constant was removed.
	 */
	public static function clear_single_constant( $name ) {
		if ( ! array_key_exists( $name, self::$set_constants ) ) {
			return false;
		}

		unset( self::$set_constants[ $name ] );
		return true;
	}

	/**
	 * Resets all of the constants within Jetpack_Constants.
	 */
	public static function clear_constants() {
		self::$set_constants = array();
	}
}
