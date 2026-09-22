<?php
/**
 * Unit tests for Jetpack_Backup::maybe_refresh_backup_feature_check().
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Backup\V0005\REST\Wpcom_Request_Mock;
use Automattic\Jetpack\My_Jetpack\Product as My_Jetpack_Product;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use function remove_all_actions;
use function set_current_screen;
use function update_option;
use function wp_insert_user;
use function wp_rand;
use function wp_set_current_user;

require_once __DIR__ . '/trait-wpcom-request-mock.php';

/**
 * Tests for the synchronous reads that run while the admin menu is built.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Jetpack_Backup
 */
#[CoversClass( Jetpack_Backup::class )]
class Backup_Feature_Refresh_Test extends TestCase {

	use Wpcom_Request_Mock;

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		$this->reset_wpcom_request_mock();
		My_Jetpack_Product::reset_site_features_cache();

		unset( $_GET['page'] );
		set_current_screen( 'front' );
		remove_all_actions( 'shutdown' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * The standalone plugin's menu never depends on the plan, so it never reads.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_an_ungated_host_never_refreshes() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		Jetpack_Backup::initialize();
		$this->enter_backup_admin_request();

		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * Only an admin can drive this synchronous remote read.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_user_without_manage_options_never_refreshes() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->enter_backup_admin_request();
		$this->sign_in_as_subscriber();

		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * An entitled site opening the page asks nothing: it already has its answer.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_opening_the_page_with_the_feature_asks_nothing() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );
		$this->enter_backup_admin_request();

		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertSame( array(), $this->captured_urls );
	}

	/**
	 * The checkout return: the plan that arrived is seen past the cache that predates it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_opening_the_page_looks_past_a_cache_from_before_the_purchase() {
		$this->arrange_wpcom_answers(
			array(
				array( 'body' => $this->features_body( array() ) ),
				array( 'body' => $this->features_body( array( 'backups-self-serve' ) ) ),
			)
		);
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );

		// The My Jetpack render that sent them to checkout, caching the plan they had then.
		My_Jetpack_Product::get_site_features_from_wpcom();
		$this->assertFalse( Backup_Feature_Check::has_backup() );

		$this->enter_backup_admin_request();
		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertCount( 2, $this->captured_urls );
		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * Any other admin page answers a site that has never been asked, so its menu shows now.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_an_ordinary_admin_page_answers_an_unasked_site() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		set_current_screen( 'dashboard' );

		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertCount( 1, $this->captured_urls );
		$this->assertTrue( Backup_Feature_Check::has_backup() );
	}

	/**
	 * And leaves an answered site alone, so this costs one read per site, not per page.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_an_ordinary_admin_page_leaves_an_answered_site_alone() {
		$this->arrange_wpcom_features( array( 'backups-self-serve' ) );
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );
		set_current_screen( 'dashboard' );

		Jetpack_Backup::maybe_refresh_backup_feature_check();

		$this->assertSame( array(), $this->captured_urls );
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
	 * A site features response body with this active list.
	 *
	 * @param string[] $active The site's active features.
	 * @return string
	 */
	private function features_body( array $active ) {
		return (string) wp_json_encode(
			array(
				'active'    => $active,
				'available' => array(),
			),
			JSON_UNESCAPED_SLASHES
		);
	}

	/**
	 * Store an answer as though My Jetpack had just given it.
	 *
	 * @param bool $has_backup The answer to store.
	 */
	private function arrange_stored_answer( $has_backup ) {
		update_option(
			Backup_Feature_Check::OPTION,
			array(
				'has_backup'  => $has_backup,
				'stale_after' => time() + Backup_Feature_Check::TTL,
			),
			false
		);
	}

	/**
	 * Replace the signed-in administrator with someone who cannot manage options.
	 */
	private function sign_in_as_subscriber() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_' . wp_rand( 1, PHP_INT_MAX ),
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );
	}

	/** `is_backup_admin_request()` reads `is_admin()` and `$_GET['page']`. */
	private function enter_backup_admin_request() {
		set_current_screen( 'jetpack_page_jetpack-backup' );
		$_GET['page'] = Jetpack_Backup::JETPACK_BACKUP_SLUG;
	}
}
