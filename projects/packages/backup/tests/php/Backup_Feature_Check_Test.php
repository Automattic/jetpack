<?php
/**
 * Unit tests for Backup_Feature_Check.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use function do_action;
use function get_option;
use function has_action;
use function remove_all_actions;
use function update_option;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the stored Backup feature check.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Backup_Feature_Check
 */
#[CoversClass( Backup_Feature_Check::class )]
class Backup_Feature_Check_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		$this->reset_wpcom_request_mock();
		My_Jetpack_Product::reset_site_features_cache();

		remove_all_actions( 'shutdown' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Nothing stored yet answers "no Backup" and queues a read rather than making one.
	 */
	public function test_unread_site_answers_no_without_calling_wpcom() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		$this->assertFalse( Backup_Feature_Check::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A clear answer is stored and then served without further reads.
	 *
	 * This is the whole point of the option: My Jetpack's own cache lasts fifteen
	 * seconds, which does not survive someone clicking around wp-admin.
	 */
	public function test_stored_answer_is_served_without_calling_wpcom() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh();
		$this->assertCount( 1, $this->captured_urls );

		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * The answer comes from the same feature list My Jetpack's own Backup card reads.
	 */
	public function test_refresh_reads_the_site_features() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh();

		$this->assertStringContainsString( '/sites/999/features', $this->captured_url );
	}

	/**
	 * The point of storing the answer: a failed read never takes Backup away.
	 *
	 * My Jetpack's feature check reports an unreadable site as "no feature", so without
	 * the error check in read_feature() this is where the menu item would disappear.
	 */
	public function test_failed_read_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh();

		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * An unreachable WordPress.com is the other failure shape, and is treated the same.
	 */
	public function test_unreachable_wpcom_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_unreachable();

		Backup_Feature_Check::refresh();

		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * Only a clear answer takes Backup away.
	 */
	public function test_a_feature_list_without_backup_removes_the_answer() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'scan' ) );

		Backup_Feature_Check::refresh();

		$this->assertFalse( Backup_Feature_Check::has_backup() );
	}

	/**
	 * A plan whose backups are managed elsewhere does not open this dashboard.
	 */
	public function test_backups_without_self_serve_answers_no() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'backups' ) );

		Backup_Feature_Check::refresh();

		$this->assertFalse( Backup_Feature_Check::has_backup() );
	}

	/**
	 * A stale answer is still served while its refresh is queued.
	 */
	public function test_stale_answer_is_served_while_a_refresh_is_queued() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertTrue( $this->refresh_is_queued() );
	}

	/**
	 * A fresh answer queues nothing.
	 */
	public function test_fresh_answer_queues_no_refresh() {
		$this->arrange_stored_answer( true );

		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A just-failed read is not retried on the next page load.
	 *
	 * Without the backoff every admin request re-queues the fetch for as long as
	 * WordPress.com stays unreadable.
	 */
	public function test_a_just_failed_read_backs_off() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh();
		remove_all_actions( 'shutdown' );

		Backup_Feature_Check::has_backup();

		$this->assertFalse( $this->refresh_is_queued() );
	}

	/**
	 * A read that failed before any answer is recorded, so it is not retried every page load.
	 */
	public function test_failure_before_any_answer_comes_back_on_the_short_retry() {
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh();

		$stored = get_option( Backup_Feature_Check::OPTION );
		$this->assertFalse( $stored['has_backup'] );
		$this->assertGreaterThan( time(), $stored['stale_after'] );
		$this->assertLessThanOrEqual( time() + Backup_Feature_Check::RETRY_INTERVAL, $stored['stale_after'] );
	}

	/**
	 * A failed read comes back on the short retry, not the full TTL.
	 */
	public function test_a_failed_read_shortens_the_wait() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh();

		$stored = get_option( Backup_Feature_Check::OPTION );
		$this->assertTrue( $stored['has_backup'], 'The last clear answer must survive a failed read.' );
		$this->assertLessThanOrEqual( time() + Backup_Feature_Check::RETRY_INTERVAL, $stored['stale_after'] );
	}

	/**
	 * An answer is held for the full TTL, not the short retry.
	 */
	public function test_an_answer_is_held_for_the_full_ttl() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh();

		$stored = get_option( Backup_Feature_Check::OPTION );
		$this->assertGreaterThan( time() + Backup_Feature_Check::RETRY_INTERVAL, $stored['stale_after'] );
	}

	/**
	 * The queued refresh runs when the response ends, so a cold option self-heals
	 * within one request — no WP-Cron event, loopback request or system cron involved.
	 */
	public function test_queued_refresh_runs_on_shutdown() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		$this->assertFalse( Backup_Feature_Check::has_backup() );
		$this->assertSame( array(), $this->captured_urls );

		do_action( 'shutdown' );

		$this->assertCount( 1, $this->captured_urls );
		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * A queued refresh that something else answered first makes no second request.
	 *
	 * My Jetpack reading the site's features mid-request is the case: that fires
	 * refresh() as a listener, leaving the queued one nothing to ask for.
	 */
	public function test_queued_refresh_is_dropped_once_something_else_answers() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::has_backup();
		$this->assertTrue( $this->refresh_is_queued() );

		Backup_Feature_Check::refresh();
		do_action( 'shutdown' );

		$this->assertCount( 1, $this->captured_urls );
		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * My Jetpack reads its features on most page loads, and each read fires refresh() —
	 * so an unchanged answer must not restamp the option every time.
	 */
	public function test_an_unchanged_answer_is_not_rewritten() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		$before = get_option( Backup_Feature_Check::OPTION );

		Backup_Feature_Check::refresh();

		$this->assertSame( $before, get_option( Backup_Feature_Check::OPTION ) );
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
	 * Store an answer as though My Jetpack had just given it.
	 *
	 * @param bool     $has_backup  The answer to store.
	 * @param int|null $stale_after When it goes stale. Defaults to a full TTL from now.
	 */
	private function arrange_stored_answer( $has_backup, $stale_after = null ) {
		$stale_after ??= time() + Backup_Feature_Check::TTL;

		update_option(
			Backup_Feature_Check::OPTION,
			array(
				'has_backup'  => $has_backup,
				'stale_after' => $stale_after,
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
		return has_action( 'shutdown', array( Backup_Feature_Check::class, 'refresh_if_stale' ) ) !== false;
	}
}
