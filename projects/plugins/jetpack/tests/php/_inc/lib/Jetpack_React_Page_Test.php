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

		// Test the self-hosted path: wpcomsh hides My Jetpack on non-classic WoA sites.
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );

		// Manager::is_connected() caches in a static that option changes don't invalidate in tests.
		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();
	}

	/**
	 * Clear the connection, the coupon and the request.
	 */
	public function tear_down() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens', Partner_Coupon::$coupon_option ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		unset( $_GET['showCouponRedemption'] );
		unset( $_GET['page'] );

		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();

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
	 * Tests that Settings hashes, connection screens included, forward to the Settings page.
	 */
	public function test_settings_routes_forward_to_the_settings_page() {
		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), $table['settings'] );
		foreach ( array( '/settings', '/security', '/traffic', '/setup', '/connect-user', '/connect-user-setup' ) as $route ) {
			$this->assertContains( $route, $table['forward'] );
		}
		$this->assertNotContains( '/newsletter', $table['forward'] );
		$this->assertNotContains( '/dashboard', $table['forward'] );
	}

	/**
	 * Tests that the old Newsletter hash goes straight to the Newsletter page.
	 */
	public function test_newsletter_route_goes_to_the_newsletter_page() {
		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-newsletter' ), $table['routes']['/newsletter'] );
	}

	/**
	 * Tests that sites without My Jetpack fall back to the Settings page.
	 */
	public function test_sites_without_my_jetpack_fall_back_to_settings() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt', '/newsletter' ), array_keys( $table['routes'] ) );
	}

	/**
	 * Tests that non-admins fall back to the Settings page.
	 */
	public function test_non_admins_fall_back_to_settings() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
	}

	/**
	 * Tests that offline sites fall back to the Settings page, since My Jetpack requires a connection.
	 */
	public function test_offline_mode_falls_back_to_settings() {
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt', '/newsletter' ), array_keys( $table['routes'] ) );
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
	 * Tests that a coupon redemption link without a stored coupon gets the normal table.
	 */
	public function test_coupon_redemption_link_without_a_coupon_keeps_the_normal_table() {
		$_GET['showCouponRedemption'] = '1';

		$this->assertSame( admin_url( 'admin.php?page=my-jetpack' ), Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
		$this->assertTrue( Jetpack_React_Page::should_redirect_legacy_routes() );
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

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), $table['fallback'] );
		$this->assertSame( array( '/plans', '/plans-prompt', '/newsletter' ), array_keys( $table['routes'] ) );
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

		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), Jetpack_React_Page::get_legacy_route_redirects()['fallback'] );
	}

	/**
	 * Tests that a pending error sends every route to Settings, whose notices show it.
	 */
	public function test_pending_error_sends_every_route_to_settings() {
		Jetpack::state( 'error', 'some_error' );

		$table = Jetpack_React_Page::get_legacy_route_redirects();

		Jetpack::state( 'error', '' );

		$this->assertSame( array(), $table['routes'] );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-settings' ), $table['fallback'] );
		$this->assertSame( Jetpack_React_Page::SETTINGS_ROUTES, $table['forward'] );
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
		$this->assertStringContainsString( wp_json_encode( admin_url( 'admin.php?page=jetpack-settings' ), JSON_UNESCAPED_SLASHES ), $output );
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
	 * Tests that page=jetpack still builds the menu, then ends its load with the redirect document.
	 */
	public function test_page_load_ends_with_the_redirect_document() {
		$_GET['page'] = 'jetpack';
		$page         = new Jetpack_React_Page();
		$menu_built   = did_action( 'jetpack_admin_menu' );

		$page->add_page_actions( 'toplevel_page_jetpack' );

		$this->assertSame( $menu_built + 1, did_action( 'jetpack_admin_menu' ) );
		$this->assertSame( PHP_INT_MAX, has_action( 'load-toplevel_page_jetpack', array( $page, 'render_redirect_document' ) ) );
	}

	/**
	 * Tests that the redirect document is a bare page holding only the redirect.
	 */
	public function test_redirect_document_only_redirects() {
		ob_start();
		( new Jetpack_React_Page() )->print_redirect_document();
		$output = ob_get_clean();

		$this->assertStringStartsWith( '<!DOCTYPE html>', ltrim( $output ) );
		$this->assertStringContainsString( 'window.location.replace', $output );
		$this->assertStringContainsString( '<noscript><meta http-equiv="refresh" content="0; url=?page=jetpack_modules"></noscript>', $output );
		$this->assertStringNotContainsString( 'adminmenu', $output );
	}

	/**
	 * Tests that without the REST API the redirect document goes to the modules list.
	 */
	public function test_redirect_document_without_the_rest_api_goes_to_the_modules_list() {
		add_filter( 'rest_authentication_errors', '__return_false' );

		ob_start();
		( new Jetpack_React_Page() )->print_redirect_document();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<meta http-equiv="refresh" content="0; url=?page=jetpack_modules">', $output );
		$this->assertStringNotContainsString( '<script', $output );
	}

	/**
	 * The table that sends every route to the coupon screen.
	 *
	 * @return array
	 */
	private function coupon_forward() {
		return array(
			'settings' => admin_url( 'admin.php?page=jetpack-settings' ),
			'forward'  => array(),
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
