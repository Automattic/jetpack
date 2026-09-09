<?php
/**
 * Tests for resolving and caching a connected user's WordPress.com user ID.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\RequiresMethod;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for resolving and caching a connected user's WordPress.com user ID.
 *
 * @covers \Automattic\Jetpack\Connection\Manager
 * @covers \Automattic\Jetpack\Connection\Utils
 */
#[AllowMockObjectsWithoutExpectations]
#[CoversClass( Manager::class )]
#[CoversClass( Utils::class )]
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
		$this->reset_disconnected_users();

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
		$this->reset_disconnected_users();
		wp_set_current_user( 0 );
		remove_all_actions( 'jetpack_unlinked_user' );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Empty `Manager::$disconnected_users`, a static that would otherwise leak between tests.
	 */
	private function reset_disconnected_users() {
		$disconnected = new \ReflectionProperty( Manager::class, 'disconnected_users' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$disconnected->setAccessible( true );
		}
		$disconnected->setValue( null, array() );
	}

	/**
	 * Build a Tokens mock reporting whether a user holds a token.
	 *
	 * @param bool $connected Whether the user is connected.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Tokens
	 */
	private function tokens_for_connection( $connected ) {
		$tokens = $this->getMockBuilder( Tokens::class )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->method( 'get_access_token' )->willReturn(
			$connected ? (object) array(
				'secret'           => 'key.secret',
				'external_user_id' => $this->user_id,
			) : false
		);

		return $tokens;
	}

	/**
	 * Build a Manager whose connection state and WordPress.com user data lookup are stubbed.
	 *
	 * @param mixed $user_data What the lookup should return.
	 * @param mixed $times     Optional invocation matcher for the lookup.
	 * @param bool  $connected Whether the subject user holds a token.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function manager_returning_user_data( $user_data, $times = null, $connected = true ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_tokens', 'get_connected_user_data' ) )
			->getMock();
		$manager->method( 'get_tokens' )->willReturn( $this->tokens_for_connection( $connected ) );

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

		$this->assertSame( 4242, $manager->resolve_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A cache miss resolves the ID from WordPress.com and stores it.
	 */
	public function test_get_wpcom_user_id_resolves_from_wpcom_and_caches_the_result() {
		$manager = $this->manager_returning_user_data( array( 'ID' => 4242 ), $this->once() );

		$this->assertSame( 4242, $manager->resolve_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A failed lookup returns 0 and caches nothing.
	 */
	public function test_get_wpcom_user_id_returns_zero_and_caches_nothing_when_the_lookup_fails() {
		$manager = $this->manager_returning_user_data( false );

		$this->assertSame( 0, $manager->resolve_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A response without an ID is treated as a failed lookup.
	 */
	public function test_get_wpcom_user_id_returns_zero_when_the_response_carries_no_id() {
		$manager = $this->manager_returning_user_data( array( 'email' => 'nobody@example.com' ) );

		$this->assertSame( 0, $manager->resolve_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A user who no longer holds a token gets no answer, cached or otherwise.
	 */
	public function test_get_wpcom_user_id_ignores_a_cached_id_for_a_disconnected_user() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		$manager = $this->manager_returning_user_data( false, $this->never(), false );

		$this->assertSame( 0, $manager->resolve_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * The current user is used when no ID is given.
	 */
	public function test_get_wpcom_user_id_defaults_to_the_current_user() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		wp_set_current_user( $this->user_id );

		$manager = $this->manager_returning_user_data( false, $this->never() );

		$this->assertSame( 4242, $manager->resolve_wpcom_user_id() );
	}

	/**
	 * With no user to resolve, nothing is asked of WordPress.com.
	 */
	public function test_get_wpcom_user_id_returns_zero_without_a_user() {
		$manager = $this->manager_returning_user_data( false, $this->never() );

		$this->assertSame( 0, $manager->resolve_wpcom_user_id() );
	}

	/**
	 * Storing an ID removes it from the user that held it before.
	 *
	 * @requires function WP_User_Query::prepare_query
	 */
	#[RequiresMethod( \WP_User_Query::class, 'prepare_query' )]
	public function test_cache_wpcom_user_id_removes_the_id_from_its_previous_holder() {
		$previous_holder = wp_insert_user(
			array(
				'user_login' => 'wpcom_user_id_previous_holder',
				'user_pass'  => 'pass',
			)
		);
		// Seeded directly, so a regression in the method under test fails the test rather than
		// making the environment probe below skip it.
		update_user_meta( $previous_holder, 'wpcom_user_id', 4242 );

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
	 * A disconnect leaves the binding intact: the local user is still that WordPress.com account,
	 * and SSO and Premium Content keep their own meaning in the same meta.
	 */
	public function test_disconnect_user_leaves_the_binding_intact() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		$this->assertTrue( $this->disconnecting_manager()->disconnect_user( $this->user_id ) );
		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * Build a Manager that will disconnect a user successfully.
	 *
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function disconnecting_manager() {
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

		return $manager;
	}

	/**
	 * Tearing down every token leaves the binding intact for the same reason.
	 */
	public function test_delete_all_connection_tokens_leaves_the_binding_intact() {
		wp_set_current_user( $this->user_id );
		Utils::set_wpcom_user_id( $this->user_id, 4242 );

		( new Manager() )->delete_all_connection_tokens( true );

		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	// ── token replacement ────────────────────────────────────────────────

	/**
	 * Replacing a token can name a different WordPress.com account, so the binding goes.
	 */
	public function test_a_replaced_token_unbinds_that_user() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		Jetpack_Options::update_option( 'user_tokens', array( $this->user_id => 'old.secret.' . $this->user_id ) );

		( new Manager() )->unbind_wpcom_user_ids_for_replaced_tokens(
			'user_tokens',
			array( $this->user_id => 'new.secret.' . $this->user_id )
		);

		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * A token that is merely removed leaves the binding correct.
	 */
	public function test_a_removed_token_leaves_the_binding_intact() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		Jetpack_Options::update_option( 'user_tokens', array( $this->user_id => 'old.secret.' . $this->user_id ) );

		( new Manager() )->unbind_wpcom_user_ids_for_replaced_tokens( 'user_tokens', array() );

		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * An unchanged token is not a replacement.
	 */
	public function test_an_unchanged_token_leaves_the_binding_intact() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		$tokens = array( $this->user_id => 'same.secret.' . $this->user_id );
		Jetpack_Options::update_option( 'user_tokens', $tokens );

		( new Manager() )->unbind_wpcom_user_ids_for_replaced_tokens( 'user_tokens', $tokens );

		$this->assertSame( 4242, Utils::get_wpcom_user_id( $this->user_id ) );
	}

	/**
	 * Only the user whose token changed is unbound.
	 */
	public function test_a_replacement_leaves_other_users_alone() {
		$other = wp_insert_user(
			array(
				'user_login' => 'wpcom_user_id_bystander',
				'user_pass'  => 'pass',
			)
		);
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		Utils::set_wpcom_user_id( $other, 5353 );
		Jetpack_Options::update_option(
			'user_tokens',
			array(
				$this->user_id => 'old.secret.' . $this->user_id,
				$other         => 'other.secret.' . $other,
			)
		);

		( new Manager() )->unbind_wpcom_user_ids_for_replaced_tokens(
			'user_tokens',
			array(
				$this->user_id => 'new.secret.' . $this->user_id,
				$other         => 'other.secret.' . $other,
			)
		);

		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
		$this->assertSame( 5353, Utils::get_wpcom_user_id( $other ) );
	}

	/**
	 * Every token-writing path goes through the option, so the hook covers them without each
	 * call site remembering to.
	 */
	public function test_updating_a_user_token_unbinds_through_the_option_hook() {
		Utils::set_wpcom_user_id( $this->user_id, 4242 );
		( new Tokens() )->update_user_token( $this->user_id, 'old.secret.' . $this->user_id, false );

		// Only this callback is removed afterwards: the memoization hooks on the same option are
		// added once behind a static guard and would not come back.
		$manager  = new Manager();
		$callback = array( $manager, 'unbind_wpcom_user_ids_for_replaced_tokens' );
		add_action( 'pre_update_jetpack_option_user_tokens', $callback, 10, 2 );

		( new Tokens() )->update_user_token( $this->user_id, 'new.secret.' . $this->user_id, false );

		remove_action( 'pre_update_jetpack_option_user_tokens', $callback, 10 );

		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->user_id ) );
	}
}
