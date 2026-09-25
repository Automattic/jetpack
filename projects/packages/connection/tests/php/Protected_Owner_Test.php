<?php
/**
 * Tests for the protected owner anchor and the predicates consumers gate on.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for the protected owner anchor and the predicates consumers gate on.
 *
 * @covers \Automattic\Jetpack\Connection\Protected_Owner
 * @covers \Automattic\Jetpack\Connection\Manager
 */
#[AllowMockObjectsWithoutExpectations]
#[CoversClass( Protected_Owner::class )]
#[CoversClass( Manager::class )]
class Protected_Owner_Test extends TestCase {

	const ANCHORED_WPCOM_ID = 4242;

	const BYSTANDER_WPCOM_ID = 7777;

	/**
	 * Administrator standing in as the connection owner.
	 *
	 * @var int
	 */
	private $owner_id;

	/**
	 * Manager supplying the connection's capability mapping.
	 *
	 * @var Manager
	 */
	private $caps_manager;

	/**
	 * XML-RPC answers this test added, removed in `tearDown()` whether or not they were used.
	 *
	 * @var callable[]
	 */
	private $xmlrpc_answers = array();

	/**
	 * Initialize the testing environment.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->owner_id = wp_insert_user(
			array(
				'user_login' => 'protected_owner',
				'user_pass'  => 'pass',
				'user_email' => 'owner@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		$this->caps_manager = new Manager();
		add_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_filter( 'map_meta_cap', array( $this->caps_manager, 'jetpack_connection_custom_caps' ), 1 );
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_connection_requires_protected_owner' );
		remove_all_filters( 'jetpack_connection_ownership_transferable' );
		foreach ( $this->xmlrpc_answers as $answer ) {
			remove_filter( 'pre_http_request', $answer, 10 );
		}
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * A Tokens stub reporting that a user holds a token.
	 *
	 * @param int $user_id The local user the token belongs to.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Tokens
	 */
	private function connected_tokens( $user_id ) {
		$tokens = $this->getMockBuilder( Tokens::class )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->method( 'get_access_token' )->willReturn(
			(object) array(
				'secret'           => 'key.secret',
				'external_user_id' => $user_id,
			)
		);

		return $tokens;
	}

	/**
	 * A Tokens stub reporting that a user holds no token.
	 *
	 * @return \PHPUnit\Framework\MockObject\MockObject|Tokens
	 */
	private function disconnected_tokens() {
		$tokens = $this->getMockBuilder( Tokens::class )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->method( 'get_access_token' )->willReturn( false );

		return $tokens;
	}

	/**
	 * Build a Manager with a stubbed connection owner and WordPress.com user data lookup.
	 *
	 * @param int|false $owner_id       What `get_connection_owner_id()` should report.
	 * @param mixed     $owner_data     What the WordPress.com lookup should return on a miss.
	 * @param mixed     $lookup_matcher Optional invocation matcher for the lookup.
	 * @param bool      $connected      Whether the owner holds a token.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function manager( $owner_id, $owner_data = false, $lookup_matcher = null, $connected = true ) {
		$tokens = $connected ? $this->connected_tokens( $owner_id ) : $this->disconnected_tokens();

		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connection_owner_id', 'get_connected_user_data', 'get_tokens' ) )
			->getMock();

		$manager->method( 'get_connection_owner_id' )->willReturn( $owner_id );
		$manager->method( 'get_tokens' )->willReturn( $tokens );

		if ( null === $lookup_matcher ) {
			$manager->method( 'get_connected_user_data' )->willReturn( $owner_data );
		} else {
			$manager->expects( $lookup_matcher )->method( 'get_connected_user_data' )->willReturn( $owner_data );
		}

		return $manager;
	}

	/**
	 * Build a Manager whose WordPress.com claim is stubbed.
	 *
	 * @param mixed $record What the assert should answer, or null for an unreachable WordPress.com.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function asserting_manager( $record ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connection_owner_id', 'get_tokens', 'assert_protected_owner_record' ) )
			->getMock();

		$manager->method( 'get_connection_owner_id' )->willReturn( $this->owner_id );
		$manager->method( 'get_tokens' )->willReturn( $this->connected_tokens( $this->owner_id ) );
		$manager->method( 'assert_protected_owner_record' )->willReturn( $record );

		return $manager;
	}

	/**
	 * Act as the connection owner, an administrator, who holds the capability the setters need.
	 */
	private function act_as_administrator() {
		wp_set_current_user( $this->owner_id );
	}

	/**
	 * Build a Manager whose WordPress.com ownership call is stubbed, so an attempted transfer
	 * can be asserted on without a network round trip.
	 *
	 * @param int   $owner_id      What `get_connection_owner_id()` should report.
	 * @param mixed $wpcom_matcher Invocation matcher for the WordPress.com ownership call.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function transfer_manager( $owner_id, $wpcom_matcher ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connection_owner_id', 'get_tokens', 'update_connection_owner_wpcom' ) )
			->getMock();

		$manager->method( 'get_connection_owner_id' )->willReturn( $owner_id );
		$manager->method( 'get_tokens' )->willReturn( $this->connected_tokens( $owner_id ) );
		$manager->expects( $wpcom_matcher )->method( 'update_connection_owner_wpcom' )->willReturn( true );

		return $manager;
	}

	/**
	 * Create an administrator who could stand in as a new connection owner.
	 *
	 * @param string $login The user login.
	 * @return int The new user's ID.
	 */
	private function candidate( $login = 'transfer_candidate' ) {
		return wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'pass',
				'user_email' => $login . '@example.com',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Create a user in a role to act as, or 0 for nobody logged in.
	 *
	 * @param string|null $role The role to create, or null for no user at all.
	 * @return int The user ID, or 0.
	 */
	private function actor( $role ) {
		if ( null === $role ) {
			return 0;
		}

		return wp_insert_user(
			array(
				'user_login' => 'actor_' . $role,
				'user_pass'  => 'pass',
				'user_email' => 'actor_' . $role . '@example.com',
				'role'       => $role,
			)
		);
	}

	/**
	 * Write an anchor naming a WordPress.com user.
	 *
	 * @param int $wpcom_user_id The anchored WordPress.com user ID.
	 */
	private function anchor( $wpcom_user_id = self::ANCHORED_WPCOM_ID ) {
		Protected_Owner::set( $wpcom_user_id, $this->owner_id );
	}

	// ── has_protected_owner ──────────────────────────────────────────────

	/**
	 * The owner WordPress.com confirms as the anchored identity is the protected owner.
	 */
	public function test_has_protected_owner_when_the_owner_binding_matches_the_anchor() {
		$this->anchor();
		Utils::set_wpcom_user_id( $this->owner_id, self::ANCHORED_WPCOM_ID );

		$manager = $this->manager( $this->owner_id, false, $this->never() );

		$this->assertTrue( $manager->has_protected_owner() );
	}

	/**
	 * A different WordPress.com identity does not satisfy the anchor.
	 */
	public function test_has_protected_owner_is_false_when_the_owner_binding_differs() {
		$this->anchor();
		Utils::set_wpcom_user_id( $this->owner_id, 9999 );

		$manager = $this->manager( $this->owner_id, false, $this->never() );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * With no anchor there is nothing to match, and nothing is asked of WordPress.com.
	 */
	public function test_has_protected_owner_is_false_without_an_anchor() {
		$manager = $this->manager( $this->owner_id, false, $this->never() );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * No connected owner means no protected owner.
	 */
	public function test_has_protected_owner_is_false_without_a_connected_owner() {
		$this->anchor();

		$manager = $this->manager( false, false, $this->never() );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * An owner WordPress.com cannot confirm fails closed.
	 */
	public function test_has_protected_owner_is_false_when_nothing_is_bound_and_wpcom_cannot_confirm() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, false );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * With nothing bound, one lookup re-establishes the binding and the gate answers from it.
	 */
	public function test_has_protected_owner_reheals_an_absent_binding_from_wpcom() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ), $this->once() );

		$this->assertTrue( $manager->has_protected_owner() );
		$this->assertSame( self::ANCHORED_WPCOM_ID, Utils::get_wpcom_user_id( $this->owner_id ) );
	}

	/**
	 * The identity looked up is the connection owner's, so a row on any other user is never what
	 * answers the gate. Asserted on the lookup itself: an outcome assertion would pass here
	 * whether or not the owner was where the answer came from.
	 */
	public function test_the_gate_resolves_the_connection_owner_and_nobody_else() {
		$this->anchor();

		$bystander = wp_insert_user(
			array(
				'user_login' => 'protected_owner_bystander',
				'user_pass'  => 'pass',
			)
		);
		Utils::set_wpcom_user_id( $bystander, self::ANCHORED_WPCOM_ID );

		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connection_owner_id', 'get_connected_user_data', 'get_tokens' ) )
			->getMock();
		$manager->method( 'get_connection_owner_id' )->willReturn( $this->owner_id );
		$manager->method( 'get_tokens' )->willReturn( $this->connected_tokens( $this->owner_id ) );
		$manager->expects( $this->once() )
			->method( 'get_connected_user_data' )
			->with( $this->owner_id )
			->willReturn( false );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * The owner holding the anchored ID is not enough on its own: without a live token the binding
	 * is not evidence of a current connection, and a row written by another subsystem would pass.
	 */
	public function test_a_binding_without_a_live_token_does_not_satisfy_the_gate() {
		$this->anchor();
		Utils::set_wpcom_user_id( $this->owner_id, self::ANCHORED_WPCOM_ID );

		$manager = $this->manager( $this->owner_id, false, $this->never(), false );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	/**
	 * A response carrying no ID is not a confirmation.
	 */
	public function test_has_protected_owner_is_false_when_the_response_carries_no_id() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, array( 'email' => 'owner@example.com' ) );

		$this->assertFalse( $manager->has_protected_owner() );
	}

	// ── is_ownership_transferable ────────────────────────────────────────

	/**
	 * Ownership stays transferable while no anchor is set.
	 */
	public function test_ownership_is_transferable_without_an_anchor() {
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}

	/**
	 * A locked anchor makes ownership non-transferable.
	 */
	public function test_ownership_is_not_transferable_with_a_locked_anchor() {
		$this->anchor();

		$this->assertFalse( ( new Manager() )->is_ownership_transferable() );
	}

	/**
	 * The lock holds when the owner does *not* match the anchor, which is when it matters most.
	 */
	public function test_ownership_is_not_transferable_when_the_owner_does_not_match_the_anchor() {
		$this->anchor();

		Utils::set_wpcom_user_id( $this->owner_id, 9999 );

		$manager = $this->manager( $this->owner_id, false, $this->never() );

		$this->assertFalse( $manager->has_protected_owner(), 'Test setup: the owner should not match.' );
		$this->assertFalse( $manager->is_ownership_transferable() );
	}

	/**
	 * A locked anchor wins over a consumer filtering ownership back open.
	 */
	public function test_a_locked_anchor_outranks_the_transferable_filter() {
		$this->anchor();
		add_filter( 'jetpack_connection_ownership_transferable', '__return_true' );

		$this->assertFalse( ( new Manager() )->is_ownership_transferable() );
	}

	// ── update_connection_owner ──────────────────────────────────────────

	/**
	 * A locked anchor refuses an ownership transfer outright.
	 */
	public function test_a_locked_anchor_refuses_an_ownership_transfer() {
		$this->anchor();

		$manager = $this->transfer_manager( $this->owner_id, $this->never() );
		$result  = $manager->update_connection_owner( $this->candidate() );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'ownership_locked', $result->get_error_code() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * An owner who does not match the anchor is exactly who must not be able to pass ownership
	 * on: local `master_user` can legitimately point at a non-anchored admin while the real
	 * protected owner is away.
	 */
	public function test_an_owner_who_does_not_match_the_anchor_cannot_pass_ownership_on() {
		$this->anchor();

		$interloper = $this->candidate( 'transfer_interloper' );
		Utils::set_wpcom_user_id( $interloper, 9999 );

		$manager = $this->transfer_manager( $interloper, $this->never() );

		$this->assertFalse( $manager->has_protected_owner(), 'Test setup: the owner should not match.' );

		$result = $manager->update_connection_owner( $this->candidate() );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'ownership_locked', $result->get_error_code() );
	}

	/**
	 * The same chokepoint refuses a consumer that locked ownership through the filter, with no
	 * anchor involved.
	 */
	public function test_a_consumer_locking_ownership_refuses_a_transfer() {
		add_filter( 'jetpack_connection_ownership_transferable', '__return_false' );

		$manager = $this->transfer_manager( $this->owner_id, $this->never() );
		$result  = $manager->update_connection_owner( $this->candidate() );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'ownership_locked', $result->get_error_code() );
	}

	/**
	 * Refused before the candidate is validated, so a locked site never reports a problem with
	 * the requested user and invites a retry that cannot work.
	 */
	public function test_the_lock_is_reported_ahead_of_an_invalid_candidate() {
		$this->anchor();

		$editor = wp_insert_user(
			array(
				'user_login' => 'transfer_editor',
				'user_pass'  => 'pass',
				'user_email' => 'transfer_editor@example.com',
				'role'       => 'editor',
			)
		);

		$manager = $this->transfer_manager( $this->owner_id, $this->never() );
		$result  = $manager->update_connection_owner( $editor );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'ownership_locked', $result->get_error_code() );
	}

	// ── requires_protected_owner ─────────────────────────────────────────

	/**
	 * Nothing requires a protected owner by default.
	 */
	public function test_requires_protected_owner_is_false_by_default() {
		$this->assertFalse( ( new Manager() )->requires_protected_owner() );
	}

	/**
	 * A consumer opts in through the filter.
	 */
	public function test_requires_protected_owner_can_be_declared_via_filter() {
		add_filter( 'jetpack_connection_requires_protected_owner', '__return_true' );

		$this->assertTrue( ( new Manager() )->requires_protected_owner() );
	}

	/**
	 * The requirement is a moment, not a standing declaration: a consumer that is active and
	 * already protected can still answer false, which is the test-mode case.
	 */
	public function test_requires_protected_owner_is_independent_of_has_protected_owner() {
		$this->anchor();

		Utils::set_wpcom_user_id( $this->owner_id, self::ANCHORED_WPCOM_ID );

		$manager = $this->manager( $this->owner_id, false, $this->never() );

		$this->assertTrue( $manager->has_protected_owner() );
		$this->assertFalse( $manager->requires_protected_owner() );
	}

	// ── set_protected_owner / clear_protected_owner ──────────────────────

	/**
	 * Anchoring a confirmed administrator locks the anchor and promotes them.
	 */
	public function test_set_protected_owner_writes_the_anchor_and_promotes_the_owner() {
		$this->act_as_administrator();

		$manager = $this->asserting_manager(
			array(
				'status'        => 'recorded',
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
			)
		);

		$this->assertTrue( $manager->set_protected_owner( $this->owner_id ) );

		$anchor = (array) Protected_Owner::get();

		$this->assertSame( self::ANCHORED_WPCOM_ID, $anchor['wpcom_user_id'] ?? null );
		$this->assertSame( $this->owner_id, $anchor['local_user_id'] ?? null );
		$this->assertMatchesRegularExpression(
			'/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/',
			$anchor['confirmed_at'] ?? '',
			'confirmed_at should be an ISO 8601 UTC timestamp.'
		);
		$this->assertSame( $this->owner_id, (int) Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * A non-administrator cannot be anchored.
	 */
	public function test_set_protected_owner_rejects_a_non_administrator() {
		$subscriber = wp_insert_user(
			array(
				'user_login' => 'protected_owner_subscriber',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);

		$this->act_as_administrator();

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ), $this->never() );
		$result  = $manager->set_protected_owner( $subscriber );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_admin', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * An identity WordPress.com cannot confirm is never anchored.
	 */
	public function test_set_protected_owner_rejects_an_unconfirmed_identity() {
		$this->act_as_administrator();

		$manager = $this->asserting_manager(
			array(
				'status'        => 'recorded',
				'wpcom_user_id' => 0,
			)
		);
		$result  = $manager->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_verified', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * An anchor that already says exactly this is stored as requested, so it reports success.
	 * `update_option()` reports false for that case as well as for a failed write.
	 */
	public function test_set_reports_success_when_the_anchor_already_says_this() {
		$established = Protected_Owner::set( self::ANCHORED_WPCOM_ID, $this->owner_id );

		// Back to back, so `confirmed_at` matches and the write is the no-op that
		// `update_option()` reports as false.
		$repeated = Protected_Owner::set( self::ANCHORED_WPCOM_ID, $this->owner_id );

		$this->assertTrue( $established );
		$this->assertTrue( $repeated, 'An anchor already saying exactly this is stored as requested.' );
	}

	/**
	 * An anchor naming nobody is one `get()` rejects, so it is refused rather than persisted as a
	 * locked row every reader treats as absent.
	 *
	 * @dataProvider unusable_anchor_ids
	 *
	 * @param int $wpcom_user_id The WordPress.com user ID to attempt.
	 * @param int $local_user_id The local user ID to attempt.
	 */
	#[DataProvider( 'unusable_anchor_ids' )]
	public function test_set_refuses_to_write_an_anchor_naming_nobody( $wpcom_user_id, $local_user_id ) {
		$this->assertFalse( Protected_Owner::set( $wpcom_user_id, $local_user_id ) );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'protected_owner' ) );
	}

	/**
	 * ID pairs that cannot make a usable anchor.
	 *
	 * @return array
	 */
	public static function unusable_anchor_ids() {
		return array(
			'no WordPress.com ID' => array( 0, 7 ),
			'no local ID'         => array( 4242, 0 ),
			'neither'             => array( 0, 0 ),
		);
	}

	/**
	 * An anchor that could not be stored must not leave the site promoted: ownership would have
	 * moved with nothing locking it, and the caller would have been told it worked.
	 */
	public function test_set_protected_owner_does_not_promote_when_the_anchor_cannot_be_stored() {
		$this->act_as_administrator();

		$block = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_jetpack_options', $block, 10, 2 );

		$manager = $this->asserting_manager(
			array(
				'status'        => 'recorded',
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
			)
		);
		$result  = $manager->set_protected_owner( $this->owner_id );

		remove_filter( 'pre_update_option_jetpack_options', $block, 10 );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_stored', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Clearing the anchor unlocks ownership without changing who the owner is.
	 */
	public function test_clear_protected_owner_removes_the_anchor_and_leaves_the_owner_alone() {
		$this->anchor();
		Jetpack_Options::update_option( 'master_user', $this->owner_id );
		$this->act_as_administrator();

		$this->assertTrue( ( new Manager() )->clear_protected_owner() );

		$this->assertNull( Protected_Owner::get() );
		$this->assertSame( $this->owner_id, (int) Jetpack_Options::get_option( 'master_user' ) );
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}

	/**
	 * Establishing a protected owner needs permission to manage the connection, and refuses
	 * before it looks anything up — so an unauthorized caller cannot use the argument errors to
	 * learn which users are administrators or hold a token.
	 *
	 * @dataProvider unauthorized_actors
	 *
	 * @param string|null $role The role to act as, or null for nobody logged in.
	 */
	#[DataProvider( 'unauthorized_actors' )]
	public function test_set_protected_owner_refuses_an_unauthorized_actor( $role ) {
		wp_set_current_user( $this->actor( $role ) );

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ), $this->never() );
		$result  = $manager->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_forbidden', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Actors who cannot manage the connection. Nobody logged in covers WP-CLI and cron.
	 *
	 * @return array
	 */
	public static function unauthorized_actors() {
		return array(
			'nobody logged in' => array( null ),
			'a subscriber'     => array( 'subscriber' ),
			'an editor'        => array( 'editor' ),
		);
	}

	/**
	 * An unreachable WordPress.com leaves nothing behind. The site cannot confirm who owns it, so
	 * it must not end up protecting anybody on its own say-so.
	 */
	public function test_establishing_fails_closed_when_wpcom_cannot_be_reached() {
		$this->act_as_administrator();

		$result = $this->asserting_manager( null )->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_unconfirmed', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * A site already held by another account is refused and told to contact support. Nothing is
	 * written locally: an owner the next claimant could overwrite protects nobody.
	 */
	public function test_a_site_held_by_another_account_is_sent_to_support() {
		$this->act_as_administrator();

		$result = $this->asserting_manager(
			array(
				'status'        => 'locked_to_other',
				'wpcom_user_id' => 0,
			)
		)
			->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_claimed_by_other', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * The owner re-confirming an existing claim is accepted rather than refused.
	 */
	public function test_the_owner_reconfirming_its_own_claim_succeeds() {
		$this->act_as_administrator();

		$manager = $this->asserting_manager(
			array(
				'status'        => 'already_yours',
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
			)
		);

		$this->assertTrue( $manager->set_protected_owner( $this->owner_id ) );
		$this->assertTrue( Protected_Owner::is_locked() );
	}

	/**
	 * A claim can only anchor the user making it, because it is signed as them.
	 */
	public function test_an_admin_cannot_anchor_somebody_else() {
		$this->act_as_administrator();
		$other = $this->candidate( 'other_admin' );

		$result = $this->asserting_manager(
			array(
				'status'        => 'recorded',
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
			)
		)->set_protected_owner( $other );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_self', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * A verdict other than acceptance is refused even when it carries an ID.
	 *
	 * @dataProvider unaccepted_verdicts
	 *
	 * @param string $status The verdict WordPress.com gives.
	 */
	#[DataProvider( 'unaccepted_verdicts' )]
	public function test_set_protected_owner_refuses_a_verdict_that_is_not_acceptance( $status ) {
		$this->act_as_administrator();

		$result = $this->asserting_manager(
			array(
				'status'        => $status,
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
			)
		)->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_verified', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->owner_id ) );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Verdicts that do not mean the claim landed.
	 *
	 * @return array
	 */
	public static function unaccepted_verdicts() {
		return array(
			'refused'            => array( 'invalid' ),
			'an unknown verdict' => array( 'pending' ),
		);
	}

	/**
	 * Answer the next XML-RPC request from WordPress.com, and keep the request that was sent.
	 *
	 * @param string $inner The `<params>` or `<fault>` element of the response.
	 * @return \stdClass Filled in with the request's `url` and `body` once it is sent.
	 */
	private function answer_xmlrpc( $inner ) {
		$sent = new \stdClass();

		$answer = static function ( $response, $args, $url ) use ( $inner, $sent ) {
			if ( false === strpos( $url, 'xmlrpc.php' ) ) {
				return $response;
			}

			$sent->url  = $url;
			$sent->body = $args['body'];

			return array(
				'headers'  => array(),
				'body'     => '<?xml version="1.0"?><methodResponse>' . $inner . '</methodResponse>',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		};

		$this->xmlrpc_answers[] = $answer;
		add_filter( 'pre_http_request', $answer, 10, 3 );

		return $sent;
	}

	/**
	 * Give the owner the blog and user tokens a signed request needs.
	 */
	private function connect_the_owner() {
		Jetpack_Options::update_option( 'blog_token', 'blogkey.private' );
		Jetpack_Options::update_option( 'user_tokens', array( $this->owner_id => 'ownerkey.private.' . $this->owner_id ) );
	}

	/**
	 * The claim goes out as a signed XML-RPC call, and an accepted answer is anchored.
	 */
	public function test_set_protected_owner_claims_over_xmlrpc() {
		$this->act_as_administrator();
		$this->connect_the_owner();

		$sent = $this->answer_xmlrpc(
			'<params><param><value><struct>' .
			'<member><name>status</name><value><string>recorded</string></value></member>' .
			'<member><name>wpcom_user_id</name><value><int>' . self::ANCHORED_WPCOM_ID . '</int></value></member>' .
			'</struct></value></param></params>'
		);

		$this->assertTrue( ( new Manager() )->set_protected_owner( $this->owner_id ) );

		$this->assertStringContainsString( '<methodName>jetpack.assertProtectedOwner</methodName>', $sent->body );
		$this->assertStringNotContainsString( 'confirmed_by', $sent->body );

		$anchor = (array) Protected_Owner::get();
		$this->assertSame( self::ANCHORED_WPCOM_ID, $anchor['wpcom_user_id'] ?? null );
	}

	/**
	 * A fault is no answer, so nothing is anchored.
	 */
	public function test_set_protected_owner_fails_closed_on_an_xmlrpc_fault() {
		$this->act_as_administrator();
		$this->connect_the_owner();

		$sent = $this->answer_xmlrpc(
			'<fault><value><struct>' .
			'<member><name>faultCode</name><value><int>-32601</int></value></member>' .
			'<member><name>faultString</name><value><string>server error. requested method does not exist.</string></value></member>' .
			'</struct></value></fault>'
		);

		$result = ( new Manager() )->set_protected_owner( $this->owner_id );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_unconfirmed', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertNotEmpty( $sent->body ?? null, 'The claim never went out, so the fault was not what refused it.' );
	}

	/**
	 * Releasing the lock needs the same permission as taking it.
	 */
	public function test_clear_protected_owner_refuses_an_unauthorized_actor() {
		$this->anchor();
		wp_set_current_user( $this->actor( 'subscriber' ) );

		$result = ( new Manager() )->clear_protected_owner();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_forbidden', $result->get_error_code() );
		$this->assertNotNull( Protected_Owner::get_locked(), 'The lock must survive a refused clear.' );
	}

	/**
	 * An anchor that survives the delete must not report success: a caller told the lock was
	 * released carries on as though ownership were open.
	 */
	public function test_clear_protected_owner_reports_an_anchor_that_could_not_be_deleted() {
		$this->anchor();
		$this->act_as_administrator();

		// `protected_owner` is compact, so deleting it rewrites the `jetpack_options` row.
		$block = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_jetpack_options', $block, 10, 2 );

		$result = ( new Manager() )->clear_protected_owner();

		remove_filter( 'pre_update_option_jetpack_options', $block, 10 );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_cleared', $result->get_error_code() );
		$this->assertNotNull( Protected_Owner::get_locked(), 'The lock is still in place.' );
	}

	/**
	 * An anchor already absent is the state the caller asked for, so clearing again succeeds.
	 */
	public function test_clear_protected_owner_succeeds_when_there_is_no_anchor() {
		$this->act_as_administrator();

		$this->assertTrue( ( new Manager() )->clear_protected_owner() );
	}

	// ── anchor shape ─────────────────────────────────────────────────────

	/**
	 * The written anchor carries exactly the keys the option is documented to hold.
	 */
	public function test_the_anchor_carries_the_documented_keys() {
		Protected_Owner::set( self::ANCHORED_WPCOM_ID, $this->owner_id );

		$this->assertSame(
			array( 'wpcom_user_id', 'local_user_id', 'confirmed_at' ),
			array_keys( (array) Protected_Owner::get() )
		);
	}

	/**
	 * An anchor without a WordPress.com ID names nobody and is not usable.
	 */
	public function test_an_anchor_without_a_wpcom_user_id_is_not_usable() {
		Jetpack_Options::update_option( 'protected_owner', array( 'confirmed_at' => '2026-01-01T00:00:00Z' ) );

		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Protected_Owner::is_locked() );
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}

	// ── reconcile_protected_owner ────────────────────────────────────────

	/**
	 * Build a Manager whose WordPress.com lookup is stubbed.
	 *
	 * @param mixed $response What the reconcile should see back, or null for an error.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function reconciling_manager( $response ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'query_protected_owner_record' ) )
			->getMock();
		$manager->method( 'query_protected_owner_record' )->willReturn( $response );

		return $manager;
	}

	/**
	 * An answer naming the connecting user as the owner of record.
	 *
	 * @param int $wpcom_user_id The identity WordPress.com holds, or 0 for a malformed answer.
	 * @return array
	 */
	private function owner_answer( $wpcom_user_id = self::ANCHORED_WPCOM_ID ) {
		return array(
			'has_owner'            => true,
			'matches'              => true,
			'is_caller'            => true,
			'caller_wpcom_user_id' => $wpcom_user_id,
		);
	}

	/**
	 * An answer for somebody who is not the owner of record.
	 *
	 * @param bool $matches Whether the anchored identity is still the owner.
	 * @return array
	 */
	private function bystander_answer( $matches ) {
		return array(
			'has_owner'            => true,
			'matches'              => $matches,
			'is_caller'            => false,
			'caller_wpcom_user_id' => self::BYSTANDER_WPCOM_ID,
		);
	}

	// ── cannot confirm ───────────────────────────────────────────────────

	/**
	 * An unreachable WordPress.com unlocks rather than trusting what is stored. A site that cannot
	 * confirm who owns it must not be running anything that pays out.
	 */
	public function test_an_unreachable_wpcom_unlocks_the_anchor() {
		$this->anchor();
		$this->act_as_administrator();

		$this->assertFalse( $this->reconciling_manager( null )->reconcile_protected_owner() );
		$this->assertFalse( Protected_Owner::is_locked() );
	}

	/**
	 * An anchor nobody could confirm is dropped rather than suspended, so no state is left for a
	 * later connection to complete.
	 */
	public function test_failing_closed_drops_the_record() {
		$this->anchor();
		$this->act_as_administrator();

		$this->reconciling_manager( null )->reconcile_protected_owner();

		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * Recovering after a failure needs the owner, because the answer names them to nobody else.
	 */
	public function test_the_owner_re_anchors_a_site_that_failed_to_confirm() {
		$this->anchor();
		$this->act_as_administrator();
		$this->reconciling_manager( null )->reconcile_protected_owner();

		$this->assertTrue( $this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner() );
		$this->assertTrue( Protected_Owner::is_locked() );
	}

	/**
	 * WordPress.com naming a different owner replaces the anchor rather than re-pointing the old
	 * one, which would leave the site anchored to the account that no longer owns it.
	 */
	public function test_a_changed_owner_replaces_the_anchored_identity() {
		$this->anchor();
		$this->act_as_administrator();

		$this->reconciling_manager( $this->owner_answer( 9999 ) )->reconcile_protected_owner();

		$anchor = Protected_Owner::get();
		$this->assertIsArray( $anchor );
		$this->assertSame( 9999, (int) $anchor['wpcom_user_id'] );
	}

	/**
	 * A failed anchor write leaves no binding behind for a later connection to build on.
	 */
	public function test_a_failed_anchor_write_leaves_no_binding() {
		$this->act_as_administrator();
		Utils::delete_wpcom_user_id( $this->owner_id );

		$block = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_jetpack_options', $block, 10, 2 );

		$result = $this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner();

		remove_filter( 'pre_update_option_jetpack_options', $block, 10 );

		$this->assertFalse( $result );
		$this->assertSame( 0, Utils::get_wpcom_user_id( $this->owner_id ) );
	}

	/**
	 * Connecting clears every user's binding, so the answer writes back the caller's own identity
	 * whether or not they own the site.
	 */
	public function test_a_bystander_connecting_still_gets_their_binding_back() {
		$this->anchor();
		$this->act_as_administrator();
		Utils::delete_wpcom_user_id( $this->owner_id );

		$this->reconciling_manager( $this->bystander_answer( true ) )->reconcile_protected_owner();

		$this->assertSame( self::BYSTANDER_WPCOM_ID, Utils::get_wpcom_user_id( $this->owner_id ) );
	}

	/**
	 * A bystander cannot: with nothing anchored there is no identity to confirm.
	 */
	public function test_a_bystander_cannot_re_anchor_a_site_that_failed_to_confirm() {
		$this->anchor();
		$this->act_as_administrator();
		$this->reconciling_manager( null )->reconcile_protected_owner();

		$this->assertFalse( $this->reconciling_manager( $this->bystander_answer( false ) )->reconcile_protected_owner() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * Nobody is connecting, so there is nothing to reconcile and nothing is asked.
	 */
	public function test_reconciling_without_a_current_user_asks_nothing() {
		$this->anchor();
		wp_set_current_user( 0 );

		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'query_protected_owner_record' ) )
			->getMock();
		$manager->expects( $this->never() )->method( 'query_protected_owner_record' );

		$this->assertFalse( $manager->reconcile_protected_owner() );
	}

	// ── no owner of record ───────────────────────────────────────────────

	/**
	 * WordPress.com having no record clears the anchor outright. Support clearing it at that end is
	 * how a wrongly anchored site recovers, so the site must not keep gating on its own copy.
	 */
	public function test_no_record_at_wpcom_clears_the_anchor() {
		$this->anchor();
		$this->act_as_administrator();

		$record = array(
			'has_owner'            => false,
			'matches'              => false,
			'is_caller'            => false,
			'caller_wpcom_user_id' => self::BYSTANDER_WPCOM_ID,
		);

		$this->assertFalse( $this->reconciling_manager( $record )->reconcile_protected_owner() );
		$this->assertNull( Protected_Owner::get() );
	}

	// ── the owner connects ───────────────────────────────────────────────

	/**
	 * The owner of record connecting to a site that never recorded the claim anchors it, without
	 * asking them to confirm all over again.
	 */
	public function test_the_owner_connecting_anchors_a_site_with_no_record() {
		$this->act_as_administrator();

		$this->assertTrue( $this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner() );

		$anchor = Protected_Owner::get();
		$this->assertIsArray( $anchor );
		$this->assertSame( self::ANCHORED_WPCOM_ID, (int) $anchor['wpcom_user_id'] );
		$this->assertTrue( Protected_Owner::is_locked() );
	}

	/**
	 * Connecting clears the binding, so the answer that confirmed the owner writes it back.
	 */
	public function test_the_owner_connecting_writes_their_binding_back() {
		$this->act_as_administrator();
		Utils::delete_wpcom_user_id( $this->owner_id );

		$this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner();

		$this->assertSame( self::ANCHORED_WPCOM_ID, Utils::get_wpcom_user_id( $this->owner_id ) );
	}

	/**
	 * The anchored identity reconnecting takes the master slot back from whoever holds it.
	 */
	public function test_the_protected_owner_reconnecting_takes_back_the_master_slot() {
		$agency = $this->candidate( 'agency' );
		$this->anchor();
		Jetpack_Options::update_option( 'master_user', $agency );
		$this->act_as_administrator();

		$this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner();

		$this->assertSame( $this->owner_id, (int) Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * The cached local ID moves with the owner when they reconnect under a different account.
	 */
	public function test_the_owner_connecting_repoints_the_anchor() {
		$this->anchor();
		$this->act_as_administrator();

		$this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner();

		$anchor = Protected_Owner::get();
		$this->assertIsArray( $anchor );
		$this->assertSame( $this->owner_id, (int) $anchor['local_user_id'] );
	}

	/**
	 * Eligibility for the master slot is being an administrator here, which the owner of record
	 * need not be.
	 */
	public function test_a_non_administrator_owner_is_not_given_the_master_slot() {
		$subscriber = $this->actor( 'subscriber' );
		$this->anchor();
		Jetpack_Options::update_option( 'master_user', $this->owner_id );
		wp_set_current_user( $subscriber );

		$this->reconciling_manager( $this->owner_answer() )->reconcile_protected_owner();

		$this->assertSame( $this->owner_id, (int) Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * An owner without an identity is a malformed answer, and trusting it would lock the site to
	 * nobody at all.
	 */
	public function test_an_owner_answer_without_an_identity_unlocks() {
		$this->anchor();
		$this->act_as_administrator();

		$this->assertFalse( $this->reconciling_manager( $this->owner_answer( 0 ) )->reconcile_protected_owner() );
		$this->assertFalse( Protected_Owner::is_locked() );
	}

	// ── somebody else connects ───────────────────────────────────────────

	/**
	 * A secondary user connecting confirms the anchor just as the owner would. WordPress.com
	 * confirms the anchored identity rather than naming its owner, so the answer does not depend on
	 * who is asking — otherwise a contributor linking their account would unlock the site.
	 */
	public function test_a_secondary_user_connecting_does_not_unlock_the_anchor() {
		$agency = $this->candidate( 'agency' );
		$this->anchor();
		Jetpack_Options::update_option( 'master_user', $agency );
		$this->act_as_administrator();

		$this->assertTrue( $this->reconciling_manager( $this->bystander_answer( true ) )->reconcile_protected_owner() );
		$this->assertTrue( Protected_Owner::is_locked() );
		$this->assertSame( $agency, (int) Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * A record naming somebody else outranks the local anchor.
	 */
	public function test_a_record_naming_another_account_unlocks_the_anchor() {
		$this->anchor();
		$this->act_as_administrator();

		$this->reconciling_manager( $this->bystander_answer( false ) )->reconcile_protected_owner();

		$this->assertFalse( Protected_Owner::is_locked() );
	}

	/**
	 * An owned site a bystander connects to stays unanchored: the answer never names the owner, so
	 * there is nothing to anchor to.
	 */
	public function test_a_bystander_cannot_anchor_a_site_with_no_record() {
		$this->act_as_administrator();

		$this->assertFalse( $this->reconciling_manager( $this->bystander_answer( false ) )->reconcile_protected_owner() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * The reconcile goes out as a signed XML-RPC call carrying the anchored identity.
	 *
	 * Every other test here stubs the lookup, so a wrong method name or payload key would reach
	 * production unnoticed.
	 */
	public function test_reconcile_asks_wpcom_over_xmlrpc() {
		$this->act_as_administrator();
		$this->connect_the_owner();
		$this->anchor();

		$sent = $this->answer_xmlrpc(
			'<params><param><value><struct>' .
			'<member><name>has_owner</name><value><boolean>1</boolean></value></member>' .
			'<member><name>matches</name><value><boolean>1</boolean></value></member>' .
			'</struct></value></param></params>'
		);

		$this->assertTrue( ( new Manager() )->reconcile_protected_owner() );

		$this->assertStringContainsString( '<methodName>jetpack.reconcileProtectedOwner</methodName>', $sent->body );
		$this->assertStringContainsString( '<name>anchored_wpcom_user_id</name>', $sent->body );
		$this->assertStringContainsString( '<int>' . self::ANCHORED_WPCOM_ID . '</int>', $sent->body );
	}

	/**
	 * Every other test here calls the method directly, so a wrong hook name would leave the
	 * reconcile inert in production while they all still pass. Runs in a separate process because
	 * `configure()` registers many hooks and schedules cron as side effects.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_configure_hooks_the_reconcile_to_user_authorization() {
		remove_all_actions( 'jetpack_user_authorized' );

		Manager::configure();

		$hooked = false;

		// Matched by class, not by instance: `configure()` builds its own Manager internally.
		foreach ( $GLOBALS['wp_filter']['jetpack_user_authorized']->callbacks ?? array() as $registered ) {
			foreach ( $registered as $callback ) {
				$callback = $callback['function'];

				if ( is_array( $callback ) && $callback[0] instanceof Manager && 'reconcile_protected_owner' === $callback[1] ) {
					$hooked = true;
				}
			}
		}

		$this->assertTrue( $hooked, 'configure() should hook the reconcile to jetpack_user_authorized.' );

		remove_all_actions( 'jetpack_user_authorized' );
	}
}
