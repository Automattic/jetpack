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

	/**
	 * Administrator standing in as the connection owner.
	 *
	 * @var int
	 */
	private $owner_id;

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
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_connection_requires_protected_owner' );
		remove_all_filters( 'jetpack_connection_ownership_transferable' );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Build a Manager with a stubbed connection owner and WordPress.com user data lookup.
	 *
	 * @param int|false $owner_id       What `get_connection_owner_id()` should report.
	 * @param mixed     $owner_data     What the WordPress.com lookup should return.
	 * @param mixed     $lookup_matcher Optional invocation matcher for the lookup.
	 * @return \PHPUnit\Framework\MockObject\MockObject|Manager
	 */
	private function manager( $owner_id, $owner_data = false, $lookup_matcher = null ) {
		$manager = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'get_connection_owner_id', 'get_connected_user_data' ) )
			->getMock();

		$manager->method( 'get_connection_owner_id' )->willReturn( $owner_id );

		if ( null === $lookup_matcher ) {
			$manager->method( 'get_connected_user_data' )->willReturn( $owner_data );
		} else {
			$manager->expects( $lookup_matcher )->method( 'get_connected_user_data' )->willReturn( $owner_data );
		}

		return $manager;
	}

	/**
	 * Write an anchor naming a WordPress.com user.
	 *
	 * @param int $wpcom_user_id The anchored WordPress.com user ID.
	 */
	private function anchor( $wpcom_user_id = self::ANCHORED_WPCOM_ID ) {
		Protected_Owner::set( $wpcom_user_id, $this->owner_id, 'popup' );
	}

	// ── has_protected_owner ──────────────────────────────────────────────

	/**
	 * The owner WordPress.com confirms as the anchored identity is the protected owner.
	 */
	public function test_has_protected_owner_when_the_confirmed_owner_matches_the_anchor() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ) );

		$this->assertTrue( $manager->has_protected_owner() );
	}

	/**
	 * A different WordPress.com identity does not satisfy the anchor.
	 */
	public function test_has_protected_owner_is_false_when_the_confirmed_owner_differs() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, array( 'ID' => 9999 ) );

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
	public function test_has_protected_owner_is_false_when_wpcom_cannot_confirm_the_owner() {
		$this->anchor();

		$manager = $this->manager( $this->owner_id, false );

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

		$manager = $this->manager( $this->owner_id, array( 'ID' => 9999 ) );

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

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ) );

		$this->assertTrue( $manager->has_protected_owner() );
		$this->assertFalse( $manager->requires_protected_owner() );
	}

	// ── set_protected_owner / clear_protected_owner ──────────────────────

	/**
	 * Anchoring a confirmed administrator locks the anchor and promotes them.
	 */
	public function test_set_protected_owner_writes_the_anchor_and_promotes_the_owner() {
		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ) );

		$this->assertTrue( $manager->set_protected_owner( $this->owner_id, 'recovery' ) );

		$anchor = (array) Protected_Owner::get();

		$this->assertSame( self::ANCHORED_WPCOM_ID, $anchor['wpcom_user_id'] ?? null );
		$this->assertSame( $this->owner_id, $anchor['local_user_id'] ?? null );
		$this->assertTrue( $anchor['locked'] ?? false );

		// `confirmed_by` names the mechanism, not a user: it travels to WordPress.com, where a
		// local user ID would mean nothing.
		$this->assertSame( 'recovery', $anchor['confirmed_by'] ?? null );
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

		$manager = $this->manager( $this->owner_id, array( 'ID' => self::ANCHORED_WPCOM_ID ), $this->never() );
		$result  = $manager->set_protected_owner( $subscriber, 'popup' );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_admin', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
	}

	/**
	 * An identity WordPress.com cannot confirm is never anchored.
	 */
	public function test_set_protected_owner_rejects_an_unconfirmed_identity() {
		$manager = $this->manager( $this->owner_id, false );
		$result  = $manager->set_protected_owner( $this->owner_id, 'popup' );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'protected_owner_not_verified', $result->get_error_code() );
		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) );
	}

	/**
	 * Clearing the anchor unlocks ownership without changing who the owner is.
	 */
	public function test_clear_protected_owner_removes_the_anchor_and_leaves_the_owner_alone() {
		$this->anchor();
		Jetpack_Options::update_option( 'master_user', $this->owner_id );

		( new Manager() )->clear_protected_owner();

		$this->assertNull( Protected_Owner::get() );
		$this->assertSame( $this->owner_id, (int) Jetpack_Options::get_option( 'master_user' ) );
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}

	// ── anchor shape ─────────────────────────────────────────────────────

	/**
	 * The written anchor carries exactly the keys the option is documented to hold.
	 */
	public function test_the_anchor_carries_the_documented_keys() {
		Protected_Owner::set( self::ANCHORED_WPCOM_ID, $this->owner_id, 'popup' );

		$this->assertSame(
			array( 'wpcom_user_id', 'local_user_id', 'locked', 'confirmed_at', 'confirmed_by' ),
			array_keys( (array) Protected_Owner::get() )
		);
	}

	/**
	 * An anchor without a WordPress.com ID names nobody and is not usable.
	 */
	public function test_an_anchor_without_a_wpcom_user_id_is_not_usable() {
		Jetpack_Options::update_option( 'protected_owner', array( 'locked' => true ) );

		$this->assertNull( Protected_Owner::get() );
		$this->assertFalse( Protected_Owner::is_locked() );
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}

	/**
	 * An unlocked anchor records provenance without locking ownership.
	 */
	public function test_an_unlocked_anchor_does_not_lock_ownership() {
		Jetpack_Options::update_option(
			'protected_owner',
			array(
				'wpcom_user_id' => self::ANCHORED_WPCOM_ID,
				'locked'        => false,
			)
		);

		$this->assertNotNull( Protected_Owner::get() );
		$this->assertFalse( Protected_Owner::is_locked() );
		$this->assertTrue( ( new Manager() )->is_ownership_transferable() );
	}
}
