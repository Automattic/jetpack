<?php
/**
 * Unit tests for Backup_Entitlement.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
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
require_once __DIR__ . '/mock-wpcom-site-features.php';

/**
 * Tests for the cached Backup entitlement.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Backup_Entitlement
 */
#[CoversClass( Backup_Entitlement::class )]
class Backup_Entitlement_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		$this->reset_wpcom_request_mock();
		My_Jetpack_Product::reset_site_features_cache();

		Constants::clear_single_constant( 'IS_ATOMIC' );
		unset( $GLOBALS['jetpack_backup_test_site_features'] );

		remove_all_actions( 'shutdown' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Nothing stored yet answers "no Backup" and queues a read rather than making one.
	 */
	public function test_unread_site_answers_false_without_calling_wpcom() {
		$this->arrange_wpcom_features( array( 'backups' ) );

		$this->assertFalse( Backup_Entitlement::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A clear answer is stored and then served without further reads.
	 */
	public function test_stored_answer_is_served_without_calling_wpcom() {
		$this->arrange_wpcom_features( array( 'backups' ) );

		$this->assertTrue( Backup_Entitlement::refresh() );
		$this->assertCount( 1, $this->captured_urls );

		$this->assertTrue( Backup_Entitlement::has_backup() );
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * The entitlement comes from the same feature list My Jetpack's own Backup card reads.
	 */
	public function test_refresh_reads_the_site_features() {
		$this->arrange_wpcom_features( array( 'backups' ) );

		Backup_Entitlement::refresh();

		$this->assertStringContainsString( '/sites/999/features', $this->captured_url );
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

		$result = Backup_Entitlement::refresh();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertTrue( Backup_Entitlement::has_backup() );
	}

	/**
	 * An unreachable WordPress.com is the other failure shape, and is treated the same.
	 */
	public function test_unreachable_wpcom_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_unreachable();

		$this->assertInstanceOf( WP_Error::class, Backup_Entitlement::refresh() );
		$this->assertTrue( Backup_Entitlement::has_backup() );
	}

	/**
	 * Only a clear answer takes the entitlement away.
	 */
	public function test_a_feature_list_without_backup_removes_the_entitlement() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'scan' ) );

		$this->assertFalse( Backup_Entitlement::refresh() );
		$this->assertFalse( Backup_Entitlement::has_backup() );
	}

	/**
	 * A stale answer is still served while its refresh is queued.
	 */
	public function test_stale_answer_is_served_while_a_refresh_is_queued() {
		$this->arrange_stored_answer( true, time() - Backup_Entitlement::TTL - 1 );
		$this->arrange_wpcom_features( array( 'backups' ) );

		$this->assertTrue( Backup_Entitlement::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A fresh answer queues nothing.
	 */
	public function test_fresh_answer_queues_no_refresh() {
		$this->arrange_stored_answer( true );

		$this->assertTrue( Backup_Entitlement::has_backup() );
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

		Backup_Entitlement::refresh();
		remove_all_actions( 'shutdown' );

		Backup_Entitlement::has_backup();

		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A read that failed before any clear answer leaves the entitlement unknown, not denied.
	 */
	public function test_failure_before_any_answer_stores_no_entitlement() {
		$this->arrange_wpcom( array(), 500 );

		$this->assertInstanceOf( WP_Error::class, Backup_Entitlement::refresh() );

		$stored = get_option( Backup_Entitlement::OPTION );
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
		$this->arrange_wpcom_features( array( 'backups' ) );

		$this->assertFalse( Backup_Entitlement::has_backup() );
		$this->assertSame( array(), $this->captured_urls );

		do_action( 'shutdown' );

		$this->assertCount( 1, $this->captured_urls );
		$this->assertTrue( Backup_Entitlement::has_backup() );
	}

	/**
	 * A queued refresh that something else answered first makes no request.
	 *
	 * My Jetpack reading the site's features mid-request is the case: the listener below
	 * stores the answer, and the queued read has nothing left to go and ask.
	 */
	public function test_queued_refresh_is_dropped_once_something_else_answers() {
		$this->arrange_wpcom_features( array( 'backups' ) );

		Backup_Entitlement::has_backup();
		Backup_Entitlement::store_from_site_features( array( 'active' => array( 'backups' ) ) );

		do_action( 'shutdown' );

		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( Backup_Entitlement::has_backup() );
	}

	/**
	 * My Jetpack's read is the answer, not a reason to go and make a second one.
	 */
	public function test_site_features_are_stored_without_a_request() {
		$this->arrange_wpcom_features( array( 'backups' ) );

		Backup_Entitlement::store_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( Backup_Entitlement::has_backup() );
		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * And it revokes as readily as it grants, being the same signal the refresh reads.
	 */
	public function test_site_features_without_backup_revoke_the_entitlement() {
		$this->arrange_stored_answer( true );

		Backup_Entitlement::store_from_site_features( array( 'active' => array( 'scan', 'akismet' ) ) );

		$this->assertFalse( Backup_Entitlement::has_backup() );
	}

	/**
	 * Nothing to write when the two already agree — My Jetpack reads its features on
	 * most page loads, and each write would only restamp the same answer.
	 */
	public function test_site_features_are_ignored_when_they_agree() {
		$this->arrange_stored_answer( true );
		$before = get_option( Backup_Entitlement::OPTION );

		Backup_Entitlement::store_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertSame( $before, get_option( Backup_Entitlement::OPTION ) );
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
		$this->arrange_stored_answer( true );
		$before = get_option( Backup_Entitlement::OPTION );

		Backup_Entitlement::store_from_site_features( $payload );

		$this->assertSame( $before, get_option( Backup_Entitlement::OPTION ), $label );
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
			array( 'active is not a list', array( 'active' => 'backups' ) ),
		);
	}

	/**
	 * An empty feature list is an answer, unlike a malformed one.
	 */
	public function test_an_empty_feature_list_revokes_the_entitlement() {
		$this->arrange_stored_answer( true );

		Backup_Entitlement::store_from_site_features( array( 'active' => array() ) );

		$this->assertFalse( Backup_Entitlement::has_backup() );
	}

	/**
	 * On WoA the plan feature is readable in-process, so nothing is fetched at all.
	 *
	 * The jetpack-mu-wpcom Backup page reads the same feature to decide whether to leave
	 * the `jetpack-backup` slug to this plugin, and a slug claimed by neither is a page
	 * that 404s — so the two have to be reading one signal.
	 */
	public function test_atomic_answers_from_the_plan_feature_without_calling_wpcom() {
		$this->arrange_atomic( true );
		$this->arrange_wpcom_features( array() );

		$this->assertTrue( Backup_Entitlement::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * And the same the other way: a stored answer must not outlive the plan that earned it.
	 */
	public function test_atomic_without_the_plan_feature_answers_false() {
		$this->arrange_atomic( false );
		$this->arrange_stored_answer( true );

		$this->assertFalse( Backup_Entitlement::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * Opening the Backup page calls refresh() synchronously; on WoA there is nothing to
	 * go and read.
	 */
	public function test_atomic_refresh_answers_from_the_plan_feature() {
		$this->arrange_atomic( true );
		$this->arrange_wpcom_features( array() );

		$this->assertTrue( Backup_Entitlement::refresh() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertSame( false, get_option( Backup_Entitlement::OPTION ) );
	}

	/**
	 * My Jetpack reads the site's features on most page loads, so the listener must not
	 * write an option on each one where the cache it would fill is not consulted.
	 */
	public function test_atomic_site_features_listener_stores_nothing() {
		$this->arrange_atomic( false );

		Backup_Entitlement::store_from_site_features( array( 'active' => array( 'backups' ) ) );

		$this->assertSame( false, get_option( Backup_Entitlement::OPTION ) );
	}

	/**
	 * A self-hosted site has no such function, and has to go and ask.
	 */
	public function test_self_hosted_reads_the_site_features() {
		$this->arrange_wpcom_features( array( 'backups' ) );
		$GLOBALS['jetpack_backup_test_site_features'] = array();

		$this->assertTrue( Backup_Entitlement::refresh() );
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * Have WordPress.com answer the site features request with this active list.
	 *
	 * @param string[] $active The site's active features.
	 */
	private function arrange_wpcom_features( array $active ) {
		$this->arrange_wpcom(
			array(
				'active'    => $active,
				'available' => array(),
			)
		);
	}

	/**
	 * Put the site on Atomic infrastructure, with or without a plan that includes backups.
	 *
	 * @param bool $has_feature Whether WordPress.com reports the Backup feature.
	 */
	private function arrange_atomic( $has_feature ) {
		Constants::set_constant( 'IS_ATOMIC', true );

		$GLOBALS['jetpack_backup_test_site_features'] = $has_feature
			? array( \WPCOM_Features::BACKUPS_SELF_SERVE )
			: array();
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
			Backup_Entitlement::OPTION,
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
		return has_action( 'shutdown', array( Backup_Entitlement::class, 'refresh_if_stale' ) ) !== false;
	}
}
