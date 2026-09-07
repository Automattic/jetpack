<?php
/**
 * Tests for resolving and caching a connected user's WordPress.com user ID.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\RequiresMethod;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for resolving and caching a connected user's WordPress.com user ID.
 */
#[AllowMockObjectsWithoutExpectations]
class Wpcom_User_Id_Test extends TestCase {

	/**
	 * Local user created for each test.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Initialize the testing environment.
	 */
	public function setUp(): void {
		parent::setUp();

		// `Manager::$disconnected_users` is static and WorDBless reuses user IDs across tests,
		// so a leftover entry would make `disconnect_user()` return early here.
		$disconnected = new \ReflectionProperty( Manager::class, 'disconnected_users' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$disconnected->setAccessible( true );
		}
		$disconnected->setValue( null, array() );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_user_id_subject',
				'user_pass'  => 'pass',
			)
		);
		wp_set_current_user( 0 );
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Build a Manager whose WordPress.com user data lookup is stubbed.
	 *
	 * @param mixed $user_data What the lookup should return.
	 * @param mixed $times     Optional invocation matcher.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function manager_returning_user_data( $user_data, $times = null ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connected_user_data' ) )
			->getMock();

		if ( null === $times ) {
			$manager->method( 'get_connected_user_data' )->willReturn( $user_data );
		} else {
			$manager->expects( $times )->method( 'get_connected_user_data' )->willReturn( $user_data );
		}

		return $manager;
	}

	/**
	 * A cached ID is returned without asking WordPress.com.
	 */
	public function test_get_wpcom_user_id_reads_the_cache_without_a_remote_lookup() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		$manager = $this->manager_returning_user_data( false, $this->never() );

		$this->assertSame( 4242, $manager->get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A cache miss resolves the ID from WordPress.com and stores it.
	 */
	public function test_get_wpcom_user_id_resolves_from_wpcom_and_caches_the_result() {
		$manager = $this->manager_returning_user_data( array( 'ID' => 4242 ), $this->once() );

		$this->assertSame( 4242, $manager->get_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A failed lookup returns 0 and caches nothing.
	 */
	public function test_get_wpcom_user_id_returns_zero_and_caches_nothing_when_the_lookup_fails() {
		$manager = $this->manager_returning_user_data( false );

		$this->assertSame( 0, $manager->get_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A response without an ID is treated as a failed lookup.
	 */
	public function test_get_wpcom_user_id_returns_zero_when_the_response_carries_no_id() {
		$manager = $this->manager_returning_user_data( array( 'email' => 'nobody@example.com' ) );

		$this->assertSame( 0, $manager->get_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * The current user is used when no ID is given.
	 */
	public function test_get_wpcom_user_id_defaults_to_the_current_user() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		wp_set_current_user( $this->user_id );

		$manager = $this->manager_returning_user_data( false, $this->never() );

		$this->assertSame( 4242, $manager->get_wpcom_user_id() );
	}

	/**
	 * With no user to resolve, nothing is asked of WordPress.com.
	 */
	public function test_get_wpcom_user_id_returns_zero_without_a_user() {
		$manager = $this->manager_returning_user_data( false, $this->never() );

		$this->assertSame( 0, $manager->get_wpcom_user_id() );
	}

	/**
	 * Storing an ID removes it from the user that held it before.
	 *
	 * @requires function WP_User_Query::prepare_query
	 */
	#[RequiresMethod( \WP_User_Query::class, 'prepare_query' )]
	public function test_set_wpcom_user_id_removes_the_id_from_its_previous_holder() {
		$previous_holder = wp_insert_user(
			array(
				'user_login' => 'wpcom_user_id_previous_holder',
				'user_pass'  => 'pass',
			)
		);
		Utils::set_wpcom_user_id( $previous_holder, 4242 );

		$probe = new \WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => 4242,
				'fields'     => 'ID',
			)
		);
		if ( empty( $probe->get_results() ) ) {
			$this->markTestSkipped( 'WP_User_Query meta queries not supported in this environment.' );
		}

		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $previous_holder ) );
	}

	/**
	 * Deleting a cached ID leaves nothing behind.
	 */
	public function test_delete_wpcom_user_id_clears_the_cache() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		Utils::delete_wpcom_user_id( $this->user_id );

		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * Disconnecting a user drops their cached ID.
	 */
	public function test_disconnect_user_clears_the_cached_wpcom_user_id() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		$tokens = $this->getMockBuilder( Tokens::class )
			->onlyMethods( array( 'disconnect_user', 'get_access_token' ) )
			->getMock();
		$tokens->method( 'disconnect_user' )->willReturn( true );
		$tokens->method( 'get_access_token' )->willReturn( false );

		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_tokens', 'unlink_user_from_wpcom' ) )
			->getMock();
		$manager->method( 'get_tokens' )->willReturn( $tokens );
		$manager->method( 'unlink_user_from_wpcom' )->willReturn( true );

		$this->assertTrue( $manager->disconnect_user( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * Deleting every connection token drops the cached ID too.
	 */
	public function test_delete_all_connection_tokens_clears_the_cached_wpcom_user_id() {
		wp_set_current_user( $this->user_id );
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		( new Manager() )->delete_all_connection_tokens( true );

		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * Authorizing replaces the token, so the cached ID cannot be carried over.
	 */
	public function test_authorize_clears_the_cached_wpcom_user_id() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_user_id_authorizer',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		Utils::set_wpcom_user_id( $user_id, 4242 );

		$tokens = $this->getMockBuilder( Tokens::class )
			->onlyMethods( array( 'get', 'update_user_token' ) )
			->getMock();
		$tokens->method( 'get' )->willReturn( 'usertoken.secret' );
		$tokens->method( 'update_user_token' )->willReturn( true );

		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_tokens', 'get_connection_owner_id' ) )
			->getMock();
		$manager->method( 'get_tokens' )->willReturn( $tokens );
		$manager->method( 'get_connection_owner_id' )->willReturn( 123 );

		$this->assertSame(
			'linked',
			$manager->authorize(
				array(
					'state' => (string) $user_id,
					'code'  => 'authorization_code',
				)
			)
		);
		$this->assertSame( 0, Utils::get_wpcom_user_id( $user_id ) );
	}
}
