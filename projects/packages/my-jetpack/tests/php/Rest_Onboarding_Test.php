<?php
/**
 * Test the route that records how someone left My Jetpack's setup flow.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests for the REST_Onboarding class.
 */
class Rest_Onboarding_Test extends BaseTestCase {
	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'master_user', 'user_tokens' ) );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Finishing is the site-wide claim that setup is done, so a site that has lost its
	 * connection records the user leaving the screen and nothing more.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_completing_without_a_connected_owner_records_a_skip() {
		$user_id = $this->log_in_as_admin();
		$this->connect_site_only();

		$this->assertTrue( ( new Connection_Manager() )->is_connected(), 'A site-only connection is still a connection.' );
		$this->assertFalse( ( new Connection_Manager() )->has_connected_owner() );

		$data = REST_Onboarding::settle( $this->settle_request( 'completed' ) )->get_data();

		$this->assertSame( 'skipped', $data['outcome'] );
		$this->assertFalse( $data['completed'] );
		$this->assertFalse( get_option( Initializer::ONBOARDING_COMPLETED_OPTION, false ) );
		$this->assertTrue( (bool) get_user_option( Initializer::ONBOARDING_DISMISSED_USER_OPTION, $user_id ) );
	}

	/**
	 * With an owner connected, finishing settles the site.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_completing_with_a_connected_owner_records_a_completion() {
		$user_id = $this->log_in_as_admin();
		$this->connect_owner( $user_id );

		$data = REST_Onboarding::settle( $this->settle_request( 'completed' ) )->get_data();

		$this->assertSame( 'completed', $data['outcome'] );
		$this->assertTrue( $data['completed'] );
		$this->assertTrue( Initializer::is_onboarding_settled() );
	}

	/**
	 * The completion record is My Jetpack's own option, not a key in the connection
	 * package's compact row, which Jetpack Sync would ship to WordPress.com in full.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_completion_record_is_a_plain_option_that_is_not_autoloaded() {
		$autoload_left_to_core = false;
		add_filter(
			'wp_default_autoload_value',
			function ( $autoload, $option ) use ( &$autoload_left_to_core ) {
				$autoload_left_to_core = $autoload_left_to_core || Initializer::ONBOARDING_COMPLETED_OPTION === $option;
				return $autoload;
			},
			10,
			2
		);
		$user_id = $this->log_in_as_admin();
		$this->connect_owner( $user_id );

		REST_Onboarding::settle( $this->settle_request( 'completed' ) );

		$this->assertTrue( (bool) get_option( Initializer::ONBOARDING_COMPLETED_OPTION ) );
		$this->assertFalse( Jetpack_Options::is_valid( 'onboarding_completed' ) );
		// WorDBless answers every option as autoloaded, so ask the other way round: this
		// filter is consulted only where the autoload argument was left off the write.
		$this->assertFalse( $autoload_left_to_core, 'The completion option must be written with autoload off.' );
	}

	/**
	 * `wp_usermeta` is network-wide, so an unprefixed key would silence setup on every
	 * site in a network the moment someone skipped it on one of them.
	 */
	public function test_the_skip_record_is_scoped_to_this_site() {
		$user_id = $this->log_in_as_admin();

		REST_Onboarding::settle( $this->settle_request( 'skipped' ) );

		$this->assertTrue( (bool) get_user_option( Initializer::ONBOARDING_DISMISSED_USER_OPTION, $user_id ) );
		$this->assertSame( '', get_user_meta( $user_id, Initializer::ONBOARDING_DISMISSED_USER_OPTION, true ) );
	}

	/**
	 * Build a settle request for the given outcome.
	 *
	 * @param string $outcome How the user left setup.
	 * @return \WP_REST_Request
	 */
	private function settle_request( $outcome ) {
		$request = new \WP_REST_Request( 'POST', '/my-jetpack/v1/site/onboarding/settled' );
		$request->set_param( 'outcome', $outcome );

		return $request;
	}

	/**
	 * Log in as a fresh administrator.
	 *
	 * @return int The user ID.
	 */
	private function log_in_as_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'onboarding_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Register the site and connect nobody: the state leaving setup early produces.
	 */
	private function connect_site_only() {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Register the site and connect the given user as its owner.
	 *
	 * @param int $user_id The owner.
	 */
	private function connect_owner( $user_id ) {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );
		( new Connection_Manager() )->reset_connection_status();
	}
}
