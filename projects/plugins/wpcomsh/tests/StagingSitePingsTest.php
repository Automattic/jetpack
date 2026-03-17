<?php
/**
 * Staging Site Pings Test file.
 *
 * @package wpcomsh
 */

/**
 * Class StagingSitePingsTest.
 *
 * Each test runs in a separate process because wp_get_environment_type()
 * caches its result in a static variable that cannot be reset between tests.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class StagingSitePingsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that outgoing pings are disabled in staging environment.
	 */
	public function test_outgoing_pings_disabled_in_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$this->assertFalse( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
	}

	/**
	 * Test that outgoing pings are not disabled in production environment.
	 */
	public function test_outgoing_pings_allowed_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$this->assertTrue( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
	}

	/**
	 * Test that incoming pingback.ping method is removed in staging environment.
	 */
	public function test_incoming_pings_disabled_in_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$methods = array(
			'pingback.ping' => 'some_callback',
			'wp.getPosts'   => 'some_callback',
		);

		$result = wpcomsh_disable_incoming_pings_in_non_production_envs( $methods );

		$this->assertArrayNotHasKey( 'pingback.ping', $result );
		$this->assertArrayHasKey( 'wp.getPosts', $result );
	}

	/**
	 * Test that incoming pingback.ping method is kept in production environment.
	 */
	public function test_incoming_pings_allowed_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$methods = array(
			'pingback.ping' => 'some_callback',
			'wp.getPosts'   => 'some_callback',
		);

		$result = wpcomsh_disable_incoming_pings_in_non_production_envs( $methods );

		$this->assertArrayHasKey( 'pingback.ping', $result );
		$this->assertArrayHasKey( 'wp.getPosts', $result );
	}
}
