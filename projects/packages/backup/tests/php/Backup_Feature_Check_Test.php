<?php
/**
 * Unit tests for Backup_Feature_Check.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use function do_action;
use function get_option;
use function has_action;
use function remove_all_actions;
use function remove_filter;
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
	 * A clear answer is stored and then served without further reads.
	 */
	public function test_stored_answer_is_served_without_calling_wpcom() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh();
		$this->assertCount( 1, $this->captured_urls );
		$this->assertStringContainsString( '/sites/999/features', $this->captured_url );

		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * A failed read keeps the last clear answer, and asks again on the short retry.
	 */
	public function test_failed_read_keeps_the_last_clear_answer() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh();

		$stored = get_option( Backup_Feature_Check::OPTION );
		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertGreaterThan( time(), $stored['stale_after'] );
		$this->assertLessThanOrEqual( time() + Backup_Feature_Check::RETRY_INTERVAL, $stored['stale_after'] );
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
	 * Backups managed elsewhere (`backups` without self-serve) do not open this dashboard.
	 */
	public function test_a_plan_without_self_serve_answers_no() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'backups', 'scan' ) );

		Backup_Feature_Check::refresh();

		$this->assertFalse( Backup_Feature_Check::has_backup() );
	}

	/**
	 * A site with no blog token answers no, rather than keeping what it last had.
	 */
	public function test_a_disconnected_site_answers_no() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		$this->arrange_disconnected_site();

		Backup_Feature_Check::refresh();

		$this->assertFalse( Backup_Feature_Check::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * A stale answer is still served, with its refresh queued last on shutdown.
	 */
	public function test_stale_answer_is_served_while_a_refresh_is_queued() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		$this->assertTrue( Backup_Feature_Check::has_backup() );
		$this->assertSame( array(), $this->captured_urls );
		$this->assertSame( PHP_INT_MAX, has_action( 'shutdown', array( Backup_Feature_Check::class, 'refresh_if_stale' ) ) );
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
	 * An unread site answers no, and the queued refresh answers it when the response ends.
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
	 * Each My Jetpack read fires refresh(), so an unchanged answer must not restamp the option.
	 */
	public function test_an_unchanged_answer_is_not_rewritten() {
		$this->arrange_stored_answer( true );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		$before = get_option( Backup_Feature_Check::OPTION );

		Backup_Feature_Check::refresh();

		$this->assertSame( $before, get_option( Backup_Feature_Check::OPTION ) );
	}

	/**
	 * A prime that failed still counts as asked, so the next page load does not ask again.
	 */
	public function test_a_failed_prime_is_not_repeated_on_the_next_page() {
		$this->arrange_wpcom( array(), 500 );

		Backup_Feature_Check::refresh_if_never_answered();
		$this->assertCount( 1, $this->captured_urls );

		Backup_Feature_Check::refresh_if_never_answered();
		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * An ordinary refresh rides My Jetpack's cache; the page-open read looks past it.
	 */
	public function test_only_the_page_open_read_looks_past_my_jetpacks_cache() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		My_Jetpack_Product::get_site_features_from_wpcom();

		Backup_Feature_Check::refresh();
		$this->assertCount( 1, $this->captured_urls );

		Backup_Feature_Check::refresh_from_wpcom();
		$this->assertCount( 2, $this->captured_urls );
	}

	/**
	 * Requests that reach the queued refresh together make one read between them.
	 */
	public function test_concurrent_stale_requests_read_once() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh_if_stale();
		$this->assertCount( 1, $this->captured_urls );

		// The racing request saw the stale answer, and missed My Jetpack's cache too.
		$this->arrange_stored_answer( true, time() - 1 );
		My_Jetpack_Product::reset_site_features_cache();
		Backup_Feature_Check::refresh_if_stale();

		$this->assertCount( 1, $this->captured_urls );
	}

	/**
	 * A refreshed answer is held for the full TTL, not the short retry.
	 */
	public function test_a_refreshed_answer_is_held_for_the_full_ttl() {
		$this->arrange_stored_answer( true, time() - 1 );
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );

		Backup_Feature_Check::refresh_if_stale();

		$stored = get_option( Backup_Feature_Check::OPTION );
		$this->assertGreaterThan( time() + Backup_Feature_Check::RETRY_INTERVAL, $stored['stale_after'] );
	}

	/**
	 * Drop the fake connection the request mock installs.
	 */
	private function arrange_disconnected_site() {
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );
		( new Connection_Manager() )->reset_connection_status();
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
