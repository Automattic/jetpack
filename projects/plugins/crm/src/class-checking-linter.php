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
	 * @param array $test Testing the linter.
	 * @return bool|null
	 */
	public function test_linter_71( array $test ): ?bool {
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
	 * @return array
	 */
	public function test_linter_73(): array {
		$test_1 = array(
			'one',
			'two',
			'three',
		);

		//phpcs:ignore PHPCompatibility.Syntax.NewFunctionCallTrailingComma.FoundInFunctionCall
		$this->test_linter_71( $test_1, );

		return $test_1;
	}
}
