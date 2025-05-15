<?php
/**
 * Functions Test
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;

/**
 * Unit tests for the Functions class.
 *
 * @package automattic/jetpack-sync
 */
class Functions_Test extends BaseTestCase {

	/**
	 * Test that the function passes through the value from wp_get_environment_type().
	 */
	public function test_get_environment_type_passes_through() {
		$this->assertEquals( wp_get_environment_type(), Functions::get_environment_type(), 'Failed asserting that get_environment_type() passes through the value from wp_get_environment_type()' );
	}

	/**
	 * Test that the function returns 'sandbox' when the environment variable is 'sandbox'.
	 */
	public function test_get_environment_type_with_env_variable() {
		if ( ! function_exists( 'putenv' ) || ! function_exists( 'getenv' ) ) {
			$this->markTestSkipped( 'putenv() or getenv() functions are not available.' );
		}

		if ( defined( 'WP_ENVIRONMENT_TYPE' ) ) {
			$this->markTestSkipped( 'WP_ENVIRONMENT_TYPE constant is already defined. Cannot test environment variable handling.' );
		}

		$original_env = getenv( 'WP_ENVIRONMENT_TYPE' );

		try {
			putenv( 'WP_ENVIRONMENT_TYPE=sandbox' );

			$this->assertEquals( 'sandbox', Functions::get_environment_type(), "Failed asserting that get_environment_type() returns 'sandbox' when WP_ENVIRONMENT_TYPE environment variable is 'sandbox'" );
		} finally {
			if ( $original_env !== false ) {
				putenv( "WP_ENVIRONMENT_TYPE=$original_env" );
			} else {
				putenv( 'WP_ENVIRONMENT_TYPE' );
			}
		}
	}
}
