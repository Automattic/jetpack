<?php
/**
 * Checking Linter
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM;

/**
 * Class Checking_Linter
 */
class Checking_Linter {

	/**
	 * Test the linter if it skips for PHP version below 7.1
	 *
	 * @param bool $test Testing the linter.
	 * @return bool|null
	 */
	public function test_linter_71( bool $test ): ?bool {
		if ( $test ) {
			return true;
		}
		return false;
	}

	/**
	 * Test the linter if it skips for PHP version below 7.2
	 *
	 * @param object $obj Testing the linter.
	 * @return object|null
	 */
	public function test_linter_72( object $obj ): ?object {
		return $obj;
	}

	/**
	 * Test the linter if doesn't pass for PHP 7.3 syntax. Trailing comma in function call.
	 *
	 * @return void
	 */
	public function test_linter_73() {
		$test_1 = array(
			'one',
			'two',
			'three',
		);
		$test_2 = array(
			'one',
			'two',
			'three',
		);

		print_r( $test_1 );
		print_r( $test_2 );
	}
}
