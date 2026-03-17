<?php
/**
 * Staging Site Pings Test file.
 *
 * @package wpcomsh
 */

/**
 * Class StagingSitePingsTest.
 */
class StagingSitePingsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that outgoing pings are disabled in staging environment.
	 */
	public function test_outgoing_pings_disabled_in_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$this->assertFalse( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that outgoing pings are allowed in development environment.
	 */
	public function test_outgoing_pings_allowed_in_development() {
		putenv( 'WP_ENVIRONMENT_TYPE=development' );
		$this->assertTrue( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that outgoing pings are allowed in local environment.
	 */
	public function test_outgoing_pings_allowed_in_local() {
		putenv( 'WP_ENVIRONMENT_TYPE=local' );
		$this->assertTrue( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that outgoing pings are not disabled in production environment.
	 */
	public function test_outgoing_pings_allowed_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$this->assertTrue( wpcomsh_disable_outgoing_pings_in_non_production_envs( true ) );
		putenv( 'WP_ENVIRONMENT_TYPE' );
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
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that incoming pingback.ping method is kept in development environment.
	 */
	public function test_incoming_pings_allowed_in_development() {
		putenv( 'WP_ENVIRONMENT_TYPE=development' );
		$methods = array(
			'pingback.ping' => 'some_callback',
			'wp.getPosts'   => 'some_callback',
		);

		$result = wpcomsh_disable_incoming_pings_in_non_production_envs( $methods );

		$this->assertArrayHasKey( 'pingback.ping', $result );
		$this->assertArrayHasKey( 'wp.getPosts', $result );
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that incoming pingback.ping method is kept in local environment.
	 */
	public function test_incoming_pings_allowed_in_local() {
		putenv( 'WP_ENVIRONMENT_TYPE=local' );
		$methods = array(
			'pingback.ping' => 'some_callback',
			'wp.getPosts'   => 'some_callback',
		);

		$result = wpcomsh_disable_incoming_pings_in_non_production_envs( $methods );

		$this->assertArrayHasKey( 'pingback.ping', $result );
		$this->assertArrayHasKey( 'wp.getPosts', $result );
		putenv( 'WP_ENVIRONMENT_TYPE' );
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
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}

	/**
	 * Test that incoming pings filter handles missing pingback.ping gracefully.
	 */
	public function test_incoming_pings_handles_missing_pingback_method() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$methods = array(
			'wp.getPosts' => 'some_callback',
		);

		$result = wpcomsh_disable_incoming_pings_in_non_production_envs( $methods );

		$this->assertArrayHasKey( 'wp.getPosts', $result );
		putenv( 'WP_ENVIRONMENT_TYPE' );
	}
}
