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

	/**
	 * Test that default_pingback_flag option is forced to '0' on staging.
	 */
	public function test_pingback_flag_forced_off_on_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$this->assertSame( '0', wpcomsh_force_pingback_flag_off_on_staging() );
	}

	/**
	 * Test that default_pingback_flag option is not overridden in production.
	 */
	public function test_pingback_flag_not_overridden_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$this->assertFalse( wpcomsh_force_pingback_flag_off_on_staging() );
	}

	/**
	 * Test that default_ping_status option is forced to 'closed' on staging.
	 */
	public function test_ping_status_forced_closed_on_staging() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		$this->assertSame( 'closed', wpcomsh_force_ping_status_closed_on_staging() );
	}

	/**
	 * Test that default_ping_status option is not overridden in production.
	 */
	public function test_ping_status_not_overridden_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		$this->assertFalse( wpcomsh_force_ping_status_closed_on_staging() );
	}

	/**
	 * Test that the pingback UI script is not output in production.
	 */
	public function test_pingback_ui_not_modified_in_production() {
		putenv( 'WP_ENVIRONMENT_TYPE=production' );
		set_current_screen( 'options-discussion' );

		ob_start();
		wpcomsh_disable_pingback_ui_on_staging();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		set_current_screen( 'front' );
	}

	/**
	 * Test that the pingback UI script is output on the Discussion Settings page in staging.
	 */
	public function test_pingback_ui_disabled_on_staging_discussion_page() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		set_current_screen( 'options-discussion' );

		ob_start();
		wpcomsh_disable_pingback_ui_on_staging();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'default_pingback_flag', $output );
		$this->assertStringContainsString( 'default_ping_status', $output );
		$this->assertStringContainsString( 'checkbox.disabled = true', $output );
		$this->assertStringContainsString( 'Pingbacks are disabled on staging sites to prevent unintended outbound requests.', $output );

		set_current_screen( 'front' );
	}

	/**
	 * Test that the pingback UI script is not output on non-Discussion admin pages in staging.
	 */
	public function test_pingback_ui_not_modified_on_other_admin_pages() {
		putenv( 'WP_ENVIRONMENT_TYPE=staging' );
		set_current_screen( 'dashboard' );

		ob_start();
		wpcomsh_disable_pingback_ui_on_staging();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		set_current_screen( 'front' );
	}
}
