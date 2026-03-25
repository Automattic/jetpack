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
	 * Define WP_RUN_CORE_TESTS so wp_get_environment_type() bypasses
	 * its static cache and re-reads the env var on every call.
	 */
	public function set_up() {
		parent::set_up();
		if ( ! defined( 'WP_RUN_CORE_TESTS' ) ) {
			define( 'WP_RUN_CORE_TESTS', true );
		}
	}

	/**
	 * Reset the environment type after each test.
	 */
	public function tear_down() {
		putenv( 'WP_ENVIRONMENT_TYPE' );
		parent::tear_down();
	}

	/**
	 * Test that outgoing pings are disabled in staging environment.
	 */
	public function test_outgoing_pings_disabled_in_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$post_links = array( 'https://example.com/post-1', 'https://example.com/post-2' );
		wpcomsh_disable_outgoing_pings_in_non_production_envs( $post_links );
		$this->assertEmpty( $post_links );
	}

	/**
	 * Test that outgoing pings are not disabled in production environment.
	 */
	public function test_outgoing_pings_allowed_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$post_links = array( 'https://example.com/post-1', 'https://example.com/post-2' );
		wpcomsh_disable_outgoing_pings_in_non_production_envs( $post_links );
		$this->assertCount( 2, $post_links );
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
