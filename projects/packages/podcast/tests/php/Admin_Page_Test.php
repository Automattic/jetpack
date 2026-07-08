<?php
/**
 * Tests for the Podcast admin page menu registration.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Podcast\Admin_Page;
use Automattic\Jetpack\Podcast\Podcast_Gate;
use Automattic\Jetpack\Podcast\Settings;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * @covers \Automattic\Jetpack\Podcast\Admin_Page
 */
#[CoversClass( Admin_Page::class )]
class Admin_Page_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// WorDBless does not reset the admin menu globals between tests.
		$GLOBALS['menu']    = array();
		$GLOBALS['submenu'] = array();
		$this->reset_admin_menu_state();
		remove_all_actions( 'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG );
	}

	protected function tearDown(): void {
		Constants::clear_constants();
		remove_all_actions( 'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG );
		unset( $GLOBALS['menu'], $GLOBALS['submenu'] );
		unset( $_GET[ Admin_Page::PURCHASE_RETURN_QUERY_VAR ] );
		// Drops the transient and the request-scoped memo so neither leaks into
		// a sibling test.
		Podcast_Gate::flush_purchases_cache();
		( new Connection_Manager() )->reset_connection_status();
		WorDBless_Options::init()->clear_options();
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Reset the shared Admin_Menu queue between tests.
	 */
	private function reset_admin_menu_state(): void {
		$reflection = new \ReflectionClass( Admin_Menu::class );

		foreach (
			array(
				'initialized' => false,
				'menu_items'  => array(),
			) as $property_name => $value
		) {
			if ( ! $reflection->hasProperty( $property_name ) ) {
				continue;
			}

			$property = $reflection->getProperty( $property_name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, $value );
		}
	}

	/**
	 * Self-hosted: the page registers through the shared Admin_Menu, which sorts
	 * items by position. We assert the page-load callback Admin_Menu wires for us.
	 */
	public function test_registers_via_admin_menu_on_self_hosted() {
		Admin_Page::add_wp_admin_submenu();

		$this->assertNotFalse(
			has_action(
				'load-jetpack_page_' . Admin_Page::ADMIN_PAGE_SLUG,
				array( Admin_Page::class, 'admin_init' )
			),
			'Self-hosted should register the page through Admin_Menu'
		);
	}

	/**
	 * The Podcast submenu should remain above Jetpack Settings.
	 */
	public function test_registers_before_settings_on_self_hosted() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'podcast_menu_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		Admin_Menu::add_menu(
			__( 'Settings', 'jetpack-podcast' ),
			__( 'Settings', 'jetpack-podcast' ),
			'manage_options',
			'jetpack#/settings',
			null,
			13
		);
		Admin_Page::add_wp_admin_submenu();

		Admin_Menu::admin_menu_hook_callback();

		$slugs = wp_list_pluck( (array) ( $GLOBALS['submenu']['jetpack'] ?? array() ), 2 );

		$this->assertContains( Admin_Page::ADMIN_PAGE_SLUG, $slugs );
		$this->assertContains( 'jetpack#/settings', $slugs );
		$this->assertLessThan(
			array_search( 'jetpack#/settings', $slugs, true ),
			array_search( Admin_Page::ADMIN_PAGE_SLUG, $slugs, true ),
			'The Podcast submenu should appear before Jetpack Settings.'
		);
	}

	/**
	 * WPCOM (Simple/Atomic): registers directly under the Jetpack menu, where
	 * wpcom-admin-menu.php has already created the parent.
	 */
	public function test_registers_directly_under_jetpack_on_wpcom() {
		Constants::set_constant( 'IS_WPCOM', true );

		// add_submenu_page() checks the current user's capability.
		$user_id = wp_insert_user(
			array(
				'user_login' => 'podcast_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		// Provide the Jetpack parent menu wpcom-admin-menu.php would have created.
		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );

		Admin_Page::add_wp_admin_submenu();

		$slugs = wp_list_pluck( (array) ( $GLOBALS['submenu']['jetpack'] ?? array() ), 2 );
		$this->assertContains(
			Admin_Page::ADMIN_PAGE_SLUG,
			$slugs,
			'WPCOM should register the Podcast page directly under the Jetpack menu'
		);
	}

	/**
	 * The host allowlist + max length reach the dashboard verbatim.
	 */
	public function test_inject_script_data_exposes_show_url_hosts() {
		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertSame( Settings::SHOW_URL_HOSTS, $data['podcast']['show_url_hosts'] );
		$this->assertSame( Settings::SHOW_URL_MAX_LENGTH, $data['podcast']['show_url_max_length'] );
	}

	/**
	 * The preload map is present in script data.
	 */
	public function test_inject_script_data_includes_preload_map() {
		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertArrayHasKey( 'preload', $data['podcast'] );
		$this->assertIsArray( $data['podcast']['preload'] );
	}

	/**
	 * WPCOM (Simple/Atomic): the injected upsell points at Premium + WordPress.com checkout.
	 */
	public function test_inject_script_data_targets_premium_on_wpcom() {
		Constants::set_constant( 'IS_WPCOM', true );

		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertSame(
			array(
				'product_slug' => 'premium',
				'plan_name'    => 'Premium',
			),
			$data['podcast']['upgrade']
		);
	}

	/**
	 * Self-hosted Jetpack: the injected upsell points at the Growth plan. The
	 * gate's purchases lookup is seeded so this stays a hermetic unit test (no
	 * `/upgrades` request).
	 */
	public function test_inject_script_data_targets_growth_on_self_hosted() {
		// Clear the memo first, then seed, so the transient is read fresh.
		Podcast_Gate::flush_purchases_cache();
		set_transient(
			Podcast_Gate::PURCHASES_TRANSIENT,
			array( array( 'product_slug' => 'jetpack_growth_yearly' ) )
		);

		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertSame(
			array(
				'product_slug' => 'jetpack_growth_yearly',
				'plan_name'    => 'Growth',
			),
			$data['podcast']['upgrade']
		);
		$this->assertTrue( $data['podcast']['has_product_access'] );
	}

	/**
	 * Self-hosted: the blog ID is mirrored into `site.wpcom.blog_id` (nothing
	 * else populates it off WordPress.com) so the dashboard can address the
	 * stats proxy. Purchases are seeded empty to keep the gate's access check
	 * hermetic.
	 */
	public function test_inject_script_data_sets_blog_id_from_option_on_self_hosted() {
		Podcast_Gate::flush_purchases_cache();
		set_transient( Podcast_Gate::PURCHASES_TRANSIENT, array() );
		Jetpack_Options::update_option( 'id', 456 );

		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertSame( 456, $data['site']['wpcom']['blog_id'] );
	}

	/**
	 * Self-hosted disconnected: no token, so `podcast.is_connected` is false and
	 * there's no blog ID to mirror. The dashboard reads the falsy connection flag
	 * and renders a connect prompt instead of the paid upsell.
	 */
	public function test_inject_script_data_leaves_blog_id_unset_when_disconnected() {
		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertFalse( $data['podcast']['is_connected'] );
		$this->assertEmpty( $data['site']['wpcom']['blog_id'] ?? null );
	}

	/**
	 * WPCOM platforms (Simple/Atomic) have no Jetpack site connection, so the
	 * raw connection check is false. The flag must still report connected so the
	 * dashboard skips the connect prompt that only makes sense for self-hosted.
	 */
	public function test_inject_script_data_reports_connected_on_wpcom_platform() {
		Constants::set_constant( 'IS_WPCOM', true );

		$data = Admin_Page::inject_podcast_script_data( array() );

		$this->assertTrue( $data['podcast']['is_connected'] );
	}

	/**
	 * WordPress.com platforms already get `site.wpcom.blog_id` from
	 * jetpack-mu-wpcom, so the podcast injection must not overwrite it.
	 */
	public function test_inject_script_data_preserves_existing_blog_id() {
		Constants::set_constant( 'IS_WPCOM', true );

		$data = Admin_Page::inject_podcast_script_data(
			array( 'site' => array( 'wpcom' => array( 'blog_id' => 789 ) ) )
		);

		$this->assertSame( 789, $data['site']['wpcom']['blog_id'] );
	}

	/**
	 * A buyer returning from checkout carries the purchase marker, which drops
	 * the stale (pre-purchase) cached purchases so access is recomputed fresh.
	 */
	public function test_inject_script_data_busts_stale_purchases_on_return() {
		// Stale "free" lookup cached before the purchase completed.
		Podcast_Gate::flush_purchases_cache();
		set_transient( Podcast_Gate::PURCHASES_TRANSIENT, array() );
		$_GET[ Admin_Page::PURCHASE_RETURN_QUERY_VAR ] = '1';

		Admin_Page::inject_podcast_script_data( array() );

		$this->assertFalse(
			get_transient( Podcast_Gate::PURCHASES_TRANSIENT ),
			'The purchase marker should drop the stale cached purchases.'
		);
	}
}
