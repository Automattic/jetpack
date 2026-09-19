<?php
/**
 * Legacy route redirect tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Partner_Coupon;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-react-page.php';

/**
 * @covers \Jetpack_React_Page
 */
#[CoversClass( Jetpack_React_Page::class )]
class Jetpack_React_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Log in as an administrator of a connected site.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );

		// Manager::is_connected() caches in a static that option changes don't invalidate in tests.
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Clear the connection, the coupon and the request.
	 */
	public function tear_down() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens', Partner_Coupon::$coupon_option ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		unset( $_GET['showCouponRedemption'] );

		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Tests that removed routes redirect admins to My Jetpack.
	 */
	public function test_removed_routes_go_to_my_jetpack_for_admins() {
		$table      = Jetpack_React_Page::get_legacy_route_redirects();
		$my_jetpack = admin_url( 'admin.php?page=my-jetpack' );

		$this->assertSame( $my_jetpack, $table['fallback'] );
		$this->assertSame( $my_jetpack . '#/add-backup', $table['routes']['/product/backup'] );
		$this->assertSame( $my_jetpack . '#/add-security', $table['routes']['/product/security'] );
		$this->assertSame( $my_jetpack . '#/add-license', $table['routes']['/license/activation'] );
		$this->assertSame( $my_jetpack . '#/connection', $table['routes']['/reconnect'] );
		$this->assertSame( $my_jetpack . '#/connection', $table['routes']['/woo-setup'] );
	}

	/**
	 * Tests that plans routes redirect to the pricing page.
	 */
	public function test_plans_routes_go_to_pricing() {
		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertStringStartsWith( 'https://jetpack.com/redirect/?source=jetpack-plans', $table['routes']['/plans'] );
		$this->assertSame( $table['routes']['/plans'], $table['routes']['/plans-prompt'] );
	}

	/**
	 * Tests that the Settings app's own routes are kept, not redirected.
	 */
	public function test_the_settings_app_keeps_its_own_routes() {
		$keep = Jetpack_React_Page::get_legacy_route_redirects()['keep'];

		foreach ( array( '/settings', '/security', '/newsletter', '/setup', '/connect-user', '/connect-user-setup' ) as $route ) {
			$this->assertContains( $route, $keep );
		}
		$this->assertNotContains( '/dashboard', $keep );
		$this->assertNotContains( '/recommendations', $keep );
	}

	/**
	 * Tests that sites without My Jetpack fall back to keeping the Settings route.
	 */
	public function test_sites_without_my_jetpack_fall_back_to_settings() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertNull( $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt' ), array_keys( $table['routes'] ) );
	}

	/**
	 * Tests that non-admins fall back to keeping the Settings route.
	 */
	public function test_non_admins_fall_back_to_settings() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertNull( Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
	}

	/**
	 * Tests that offline-mode sites only get the plans routes, since My Jetpack requires a connection.
	 */
	public function test_offline_mode_only_has_plans_routes() {
		Status_Cache::clear(); // is_offline_mode() memoizes; earlier tests cached the default.
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertNull( $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt' ), array_keys( $table['routes'] ) );

		Status_Cache::clear();
	}

	/**
	 * Tests that a coupon redemption link forwards every route to the coupon screen in My Jetpack.
	 */
	public function test_coupon_redemption_link_forwards_every_route_to_my_jetpack() {
		$this->set_up_partner_coupon();
		$_GET['showCouponRedemption'] = '1';

		$this->assertSame( $this->coupon_forward(), Jetpack_React_Page::get_legacy_route_redirects() );
		$this->assertTrue( Jetpack_React_Page::should_redirect_legacy_routes() );
	}

	/**
	 * Tests that an unconnected site with a partner coupon forwards to the coupon screen.
	 */
	public function test_unconnected_site_with_a_partner_coupon_forwards_to_my_jetpack() {
		foreach ( array( 'blog_token', 'id', 'master_user', 'user_tokens' ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		( new Connection_Manager() )->reset_connection_status();
		$this->set_up_partner_coupon();

		$this->assertSame( $this->coupon_forward(), Jetpack_React_Page::get_legacy_route_redirects() );
	}

	/**
	 * Tests that a blog token without a connected owner still forwards (the gate is has_connected_owner()).
	 */
	public function test_site_with_blog_token_but_no_connected_owner_forwards_to_my_jetpack() {
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
		$this->set_up_partner_coupon();

		$this->assertSame( $this->coupon_forward(), Jetpack_React_Page::get_legacy_route_redirects() );
	}

	/**
	 * Tests that a connected owner without a redemption link gets the normal table.
	 */
	public function test_connected_site_with_a_partner_coupon_keeps_the_normal_table() {
		$this->set_up_partner_coupon();

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack' ), Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
	}

	/**
	 * Tests that the coupon screen is dropped where My Jetpack is off.
	 */
	public function test_partner_coupon_is_dropped_where_my_jetpack_is_off() {
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
		$this->set_up_partner_coupon();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertNull( $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt' ), array_keys( $table['routes'] ) );
	}

	/**
	 * Tests that non-admins are not forwarded to the coupon screen.
	 */
	public function test_partner_coupon_is_not_forwarded_for_non_admins() {
		Jetpack_Options::delete_option( 'master_user' );
		Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
		$this->set_up_partner_coupon();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertNull( Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
	}

	/**
	 * Tests that a pending error keeps the request in the app so its state notice can render.
	 */
	public function test_pending_error_is_not_redirected() {
		Jetpack::state( 'error', 'some_error' );

		$this->assertFalse( Jetpack_React_Page::should_redirect_legacy_routes() );

		Jetpack::state( 'error', '' );
	}

	/**
	 * Tests that the redirect table is printed into an inline script.
	 */
	public function test_prints_the_table_into_an_inline_script() {
		ob_start();
		( new Jetpack_React_Page() )->print_legacy_route_redirect();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<script', $output );
		$this->assertStringContainsString( 'window.location.replace', $output );
		$this->assertStringContainsString( 'hasOwnProperty', $output );
		$this->assertStringContainsString( wp_json_encode( admin_url( 'admin.php?page=my-jetpack#/add-backup' ), JSON_UNESCAPED_SLASHES ), $output );
	}

	/**
	 * Tests that the coupon forward is printed into the inline script.
	 */
	public function test_prints_the_coupon_forward() {
		$this->set_up_partner_coupon();
		$_GET['showCouponRedemption'] = '1';

		ob_start();
		( new Jetpack_React_Page() )->print_legacy_route_redirect();
		$output = ob_get_clean();

		$this->assertStringContainsString(
			wp_json_encode( admin_url( 'admin.php?page=my-jetpack&showCouponRedemption=1' ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ),
			$output
		);
	}

	/**
	 * The table that sends every route to the coupon screen.
	 *
	 * @return array
	 */
	private function coupon_forward() {
		return array(
			'keep'     => array(),
			'routes'   => array(),
			'fallback' => admin_url( 'admin.php?page=my-jetpack&showCouponRedemption=1' ),
		);
	}

	/**
	 * Store a coupon that Partner_Coupon::get_coupon() accepts.
	 */
	private function set_up_partner_coupon() {
		add_filter(
			'jetpack_partner_coupon_supported_partners',
			function () {
				return array(
					'JPTST' => array(
						'name' => 'Jetpack Test Partner',
						'logo' => array(
							'src'    => '/images/ionos-logo.jpg',
							'width'  => 119,
							'height' => 32,
						),
					),
				);
			}
		);
		add_filter(
			'jetpack_partner_coupon_supported_presets',
			function () {
				return array( 'JPTA' => 'jetpack_backup_daily' );
			}
		);
		add_filter(
			'jetpack_partner_coupon_products',
			function () {
				return array(
					array(
						'title'       => 'Jetpack Backup',
						'slug'        => 'jetpack_backup_daily',
						'description' => 'Backups.',
						'features'    => array( 'Daily backups' ),
					),
				);
			},
			99
		);
		Jetpack_Options::update_option( Partner_Coupon::$coupon_option, 'JPTST_JPTA_abc123' );
	}
}
