<?php
/**
 * Unit tests for Rewind_State_Cache.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use function do_action;
use function get_option;
use function has_action;
use function remove_all_actions;
use function update_option;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the cached Backup entitlement.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Rewind_State_Cache
 */
#[CoversClass( Rewind_State_Cache::class )]
class Rewind_State_Cache_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		$this->reset_wpcom_request_mock();
		$this->forget_rewind_state();

		remove_all_actions( 'shutdown' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Nothing stored yet answers "no Backup" and queues a read rather than making one.
	 */
	public function test_unread_site_answers_false_without_calling_wpcom() {
		$this->arrange_wpcom( array( 'state' => 'active' ) );

		$this->assertFalse( Rewind_State_Cache::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A clear answer is stored and then served without further reads.
	 */
	public function test_stored_answer_is_served_without_calling_wpcom() {
		$this->arrange_wpcom( array( 'state' => 'active' ) );

		$this->assertTrue( Rewind_State_Cache::refresh() );
		$this->assertCount( 1, $this->captured_urls );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * The point of the cache: a failed read never takes the entitlement away.
	 *
	 * This is what stops the Backup menu item — and, once the Jetpack plugin hosts
	 * it, the dashboard behind it — from disappearing on a WordPress.com blip.
	 */
	public function test_failed_read_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom( array(), 500 );

		$result = Rewind_State_Cache::refresh();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertTrue( Rewind_State_Cache::has_backup() );
	}

	/**
	 * An unreachable WordPress.com is the other failure shape, and is treated the same.
	 */
	public function test_unreachable_wpcom_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_unreachable();

		$this->assertInstanceOf( WP_Error::class, Rewind_State_Cache::refresh() );
		$this->assertTrue( Rewind_State_Cache::has_backup() );
	}

	/**
	 * Only a clear answer takes the entitlement away.
	 */
	public function test_unavailable_state_removes_the_entitlement() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom( array( 'state' => 'unavailable' ) );

		$this->assertFalse( Rewind_State_Cache::refresh() );
		$this->assertFalse( Rewind_State_Cache::has_backup() );
	}

	/**
	 * A stale answer is still served while its refresh is queued.
	 */
	public function test_stale_answer_is_served_while_a_refresh_is_queued() {
		$this->arrange_stored_answer( true, time() - Rewind_State_Cache::TTL - 1 );
		$this->arrange_wpcom( array( 'state' => 'active' ) );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A fresh answer queues nothing.
	 */
	public function test_fresh_answer_queues_no_refresh() {
		$this->arrange_stored_answer( true );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A just-failed read is not retried on the next page load.
	 *
	 * Without the backoff every admin request re-queues the fetch for as long as
	 * WordPress.com stays unreadable, which is the retry storm the old transient had.
	 */
	public function test_a_just_failed_read_backs_off() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom( array(), 500 );

		Rewind_State_Cache::refresh();
		remove_all_actions( 'shutdown' );

		Rewind_State_Cache::has_backup();

		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A read that failed before any clear answer leaves the entitlement unknown, not denied.
	 */
	public function test_failure_before_any_answer_stores_no_entitlement() {
		$this->arrange_wpcom( array(), 500 );

		$this->assertInstanceOf( WP_Error::class, Rewind_State_Cache::refresh() );

		$stored = get_option( Rewind_State_Cache::OPTION );
		$this->assertNull( $stored['has_backup'] );
		$this->assertSame( 0, $stored['checked_at'] );

		// Recorded even though nothing was answered, which is what makes the backoff work.
		$this->assertNotSame( 0, $stored['attempted_at'] );
	}

	/**
	 * The queued refresh runs when the response ends, so a cold cache self-heals
	 * within one request — no WP-Cron event, loopback request or system cron involved.
	 */
	public function test_queued_refresh_runs_on_shutdown() {
		$this->arrange_wpcom( array( 'state' => 'active' ) );

		$this->assertFalse( Rewind_State_Cache::has_backup() );
		$this->assertSame( array(), $this->captured_urls );

		do_action( 'shutdown' );

		$this->assertCount( 1, $this->captured_urls );
		$this->assertTrue( Rewind_State_Cache::has_backup() );
	}

	/**
	 * My Jetpack seeing Backup on a site we think has none queues a re-read.
	 *
	 * The post-checkout case: most purchases land the buyer back on My Jetpack, which
	 * reads the site's features there.
	 */
	public function test_site_features_queue_a_reread_when_they_disagree() {
		$this->arrange_stored_answer( false );
		$this->arrange_wpcom( array( 'state' => 'active' ) );

		Rewind_State_Cache::maybe_refresh_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertTrue( $this->refresh_is_queued() );

		do_action( 'shutdown' );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
	}

	/**
	 * The stored answer survives until the re-read lands, so the menu does not flicker.
	 */
	public function test_site_features_do_not_drop_the_stored_answer() {
		$this->arrange_stored_answer( true );

		Rewind_State_Cache::maybe_refresh_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
	}

	/**
	 * Nothing to do when the two already agree — My Jetpack's 15-second cache would
	 * otherwise queue a read on every page view.
	 */
	public function test_site_features_are_ignored_when_they_agree() {
		$this->arrange_stored_answer( true );

		Rewind_State_Cache::maybe_refresh_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A feature list without Backup never revokes the entitlement.
	 *
	 * One-directional on purpose: only the rewind state decides that.
	 */
	public function test_site_features_never_revoke() {
		$this->arrange_stored_answer( true );

		Rewind_State_Cache::maybe_refresh_from_site_features( array( 'active' => array( 'scan', 'akismet' ) ) );

		$this->assertTrue( Rewind_State_Cache::has_backup() );
		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A payload that is not a feature list is ignored rather than read as an answer.
	 *
	 * @param string $label   Human-readable case name.
	 * @param mixed  $payload The unusable payload.
	 * @dataProvider provide_unusable_feature_payloads
	 */
	#[DataProvider( 'provide_unusable_feature_payloads' )]
	public function test_unusable_site_features_are_ignored( $label, $payload ) {
		$this->arrange_stored_answer( false );

		Rewind_State_Cache::maybe_refresh_from_site_features( $payload );

		$this->assertFalse( $this->refresh_is_queued(), $label );
	}

	/**
	 * Payloads the handler has to refuse.
	 *
	 * @return array<int, array{0: string, 1: mixed}>
	 */
	public static function provide_unusable_feature_payloads() {
		return array(
			array( 'not an array', 'backups' ),
			array( 'no active key', array( 'available' => array( 'backups' ) ) ),
			array( 'empty active list', array( 'active' => array() ) ),
			array( 'active is not a list', array( 'active' => 'backups' ) ),
		);
	}

	/**
	 * Store an answer as though WordPress.com had just given it.
	 *
	 * @param bool     $has_backup The answer to store.
	 * @param int|null $checked_at When it was given. Defaults to now.
	 */
	private function arrange_stored_answer( $has_backup, $checked_at = null ) {
		$checked_at ??= time();

		update_option(
			Rewind_State_Cache::OPTION,
			array(
				'has_backup'   => $has_backup,
				'checked_at'   => $checked_at,
				'attempted_at' => $checked_at,
			),
			false
		);
	}

	/**
	 * Whether a post-response refresh is queued.
	 *
	 * @return bool
	 */
	private function refresh_is_queued() {
		return has_action( 'shutdown', array( Rewind_State_Cache::class, 'refresh' ) ) !== false;
	}

	/**
	 * Clear the memoized rewind state, which is otherwise kept for the whole process.
	 */
	private function forget_rewind_state() {
		$property = new \ReflectionProperty( Jetpack_Backup::class, 'rewind_state' );

		// `setAccessible()` has been a no-op since PHP 8.1 and is deprecated in 8.5.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}

		$property->setValue( null, null );
	}
}
