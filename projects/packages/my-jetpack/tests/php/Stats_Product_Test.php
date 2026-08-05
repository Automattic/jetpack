<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Stats;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the Stats product's destination URLs.
 *
 * The Premium Analytics dashboard replaces the Stats page, so both URLs this
 * product hands the UI have to follow it. The flag lives on the Jetpack plugin,
 * mocked here through ./assets/jetpack-mock-plugin.txt.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Stats
 */
class Stats_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );
		activate_plugins( 'jetpack/jetpack.php' );

		// Mock site connection, so the purchase URL is not short-circuited by the
		// needs-first-site-connection status.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Installs the mock plugin present in the test assets folder as the Jetpack plugin.
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- It's declared on the mock from ./assets/jetpack-mock-plugin.txt
		\Jetpack::$mock_premium_analytics_enabled = false;

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Put the mocked Jetpack plugin's Premium Analytics flag into a known state.
	 *
	 * @param bool $enabled Whether Premium Analytics replaces the Stats page.
	 */
	private function set_premium_analytics_enabled( $enabled ) {
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- It's declared on the mock from ./assets/jetpack-mock-plugin.txt
		\Jetpack::$mock_premium_analytics_enabled = $enabled;
	}

	public function test_manage_url_points_at_the_stats_page_by_default() {
		$this->set_premium_analytics_enabled( false );

		$this->assertSame( admin_url( 'admin.php?page=stats' ), Stats::get_manage_url() );
	}

	public function test_manage_url_follows_premium_analytics_when_enabled() {
		$this->set_premium_analytics_enabled( true );

		$manage_url = Stats::get_manage_url();

		$this->assertSame( admin_url( 'admin.php?page=' . Stats::PREMIUM_ANALYTICS_PAGE_SLUG ), $manage_url );
		$this->assertStringNotContainsString( 'page=stats', (string) $manage_url );
	}

	public function test_purchase_url_points_at_the_stats_purchase_screen_by_default() {
		$this->set_premium_analytics_enabled( false );

		$purchase_url = Stats::get_purchase_url();

		$this->assertIsString( $purchase_url );
		$this->assertStringContainsString( 'page=stats', $purchase_url );
		$this->assertStringContainsString( '#!/stats/purchase/123', $purchase_url );
	}

	/**
	 * The tier purchase screen was a Calypso route inside the Odyssey bundle, so
	 * it left with the Stats dashboard. Returning null — the base class default —
	 * makes the action button fall back to the `#/add-stats` interstitial instead
	 * of linking to a route that no longer resolves.
	 */
	public function test_purchase_url_is_null_when_premium_analytics_is_enabled() {
		$this->set_premium_analytics_enabled( true );

		$this->assertNull( Stats::get_purchase_url() );
	}
}
