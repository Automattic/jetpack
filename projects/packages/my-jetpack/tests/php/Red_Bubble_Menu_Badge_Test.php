<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests that Initializer::maybe_show_red_bubble() reports alerts to the central
 * menu-badges registry instead of writing the legacy `$menu[3]` "awaiting-mod" markup.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Initializer::maybe_show_red_bubble
 */
class Red_Bubble_Menu_Badge_Test extends TestCase {

	/**
	 * The red bubble transient key, mirrored from Red_Bubble_Notifications
	 * (private there) so tests can seed the cached-alerts code path directly.
	 *
	 * @var string
	 */
	const RED_BUBBLE_TRANSIENT_KEY = 'my-jetpack-red-bubble-transient';

	/**
	 * The admin user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		Notification_Counts::reset();

		global $pagenow;
		$pagenow = 'index.php';
		unset( $_GET['page'] );

		// Mock site connection so maybe_show_red_bubble() doesn't bail out early.
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
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		Notification_Counts::reset();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Seed the red-bubble transient cache the same way Red_Bubble_Notifications does,
	 * so maybe_show_red_bubble() takes the cached (non-blocking) code path instead of
	 * recomputing real product alerts.
	 *
	 * @param array $alerts Alerts keyed by slug.
	 */
	private function seed_cached_alerts( array $alerts ) {
		set_transient( self::RED_BUBBLE_TRANSIENT_KEY, $alerts, 3600 );
	}

	/**
	 * Installs and activates a mock jetpack-protect standalone plugin so
	 * Products\Protect::is_standalone_plugin_active() reports true, mirroring the
	 * scenario where the standalone Protect plugin registers its own count.
	 */
	private function activate_standalone_protect_plugin() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Protect::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		copy( __DIR__ . '/assets/protect-mock-plugin.txt', $plugin_dir . '/jetpack-protect.php' );
		wp_cache_delete( 'plugins', 'plugins' );
		$plugin_file = Protect::get_installed_plugin_filename();
		if ( $plugin_file ) {
			activate_plugins( $plugin_file );
		}
	}

	/**
	 * Non-silent alerts should each register as an 'attention' entry against the
	 * 'my-jetpack' submenu, keyed uniquely so they don't overwrite one another.
	 */
	public function test_registers_non_silent_alerts_as_attention_entries() {
		$this->seed_cached_alerts(
			array(
				'backup_failure'           => array( 'message' => 'Backup failed' ),
				'plan--plan_expiring_soon' => array( 'product_name' => 'Plan' ),
				'silent-thing'             => array( 'is_silent' => true ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$entries = Notification_Counts::all();

		$this->assertArrayHasKey( 'my-jetpack-backup_failure', $entries );
		$this->assertArrayHasKey( 'my-jetpack-plan--plan_expiring_soon', $entries );
		$this->assertArrayNotHasKey( 'my-jetpack-silent-thing', $entries, 'Silent alerts should not be registered.' );

		$this->assertSame( 'my-jetpack', $entries['my-jetpack-backup_failure']['menu_slug'] );
		$this->assertSame( 'attention', $entries['my-jetpack-backup_failure']['type'] );
	}

	/**
	 * Protect reports its own count directly to the registry when its standalone
	 * plugin is active (Task 8); My Jetpack must skip it in the menu-count
	 * registration loop in that case, to avoid double-counting the top-level menu
	 * total.
	 */
	public function test_skips_protect_has_threats_when_standalone_plugin_active() {
		$this->activate_standalone_protect_plugin();
		$this->assertTrue(
			Protect::is_standalone_plugin_active(),
			'Precondition: the mock standalone Protect plugin should be active.'
		);

		$this->seed_cached_alerts(
			array(
				'protect_has_threats' => array( 'count' => 3 ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$this->assertArrayNotHasKey( 'my-jetpack-protect_has_threats', Notification_Counts::all() );
		$this->assertSame( 0, Notification_Counts::get_for_menu( 'my-jetpack' ) );
	}

	/**
	 * When the standalone Protect plugin is NOT active, nothing else registers the
	 * protect_has_threats count (class-jetpack-protect.php::admin_page_init() only
	 * runs from the standalone plugin). My Jetpack must NOT skip it in that case,
	 * or a security-relevant alert silently disappears from the top-level menu
	 * total on full Jetpack + Scan installs.
	 */
	public function test_registers_protect_has_threats_when_standalone_plugin_inactive() {
		$this->assertFalse(
			Protect::is_standalone_plugin_active(),
			'Precondition: the standalone Protect plugin should not be installed/active.'
		);

		$this->seed_cached_alerts(
			array(
				'protect_has_threats' => array( 'count' => 3 ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$entries = Notification_Counts::all();
		$this->assertArrayHasKey( 'my-jetpack-protect_has_threats', $entries );
		$this->assertSame( 'my-jetpack', $entries['my-jetpack-protect_has_threats']['menu_slug'] );
		$this->assertSame( 'attention', $entries['my-jetpack-protect_has_threats']['type'] );
		$this->assertSame( 1, Notification_Counts::get_for_menu( 'my-jetpack' ) );
		$this->assertSame( 1, Notification_Counts::get_total() );
	}

	/**
	 * The registered total for the my-jetpack submenu should equal the number of
	 * non-silent alerts (each attention entry contributes 1 to the total), excluding
	 * Protect's alert when the standalone plugin is active and reports it directly.
	 */
	public function test_total_reflects_non_silent_non_protect_alert_count() {
		$this->activate_standalone_protect_plugin();

		$this->seed_cached_alerts(
			array(
				'backup_failure'           => array( 'message' => 'Backup failed' ),
				'protect_has_threats'      => array( 'count' => 3 ),
				'plan--plan_expiring_soon' => array( 'product_name' => 'Plan' ),
				'silent-thing'             => array( 'is_silent' => true ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$this->assertSame( 2, Notification_Counts::get_for_menu( 'my-jetpack' ) );
		$this->assertSame( 2, Notification_Counts::get_total() );
	}

	/**
	 * Users without manage_options should not have anything registered.
	 */
	public function test_skips_registration_for_non_admin_users() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $editor_id );

		$this->seed_cached_alerts(
			array(
				'backup_failure' => array( 'message' => 'Backup failed' ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$this->assertSame( array(), Notification_Counts::all() );
	}

	/**
	 * On a cold red-bubble cache (no transient) off the My Jetpack page, the alert
	 * data is fetched asynchronously. maybe_show_red_bubble() must still register a
	 * hidden zero-count 'my-jetpack' placeholder so Menu_Renderer emits a badge
	 * element the async warmer (async-notification-bubble.ts) can reveal without a
	 * reload, and it must enqueue that warmer script.
	 */
	public function test_cold_cache_registers_hidden_placeholder_and_enqueues_warmer() {
		// No transient seeded in setUp(): get_cached_alerts() returns false -> cold path.
		Initializer::maybe_show_red_bubble();

		$entries = Notification_Counts::all();
		$this->assertArrayHasKey( 'my-jetpack', $entries );
		$this->assertSame( 'my-jetpack', $entries['my-jetpack']['menu_slug'] );
		$this->assertSame( 0, Notification_Counts::get_for_menu( 'my-jetpack' ) );
		$this->assertSame( 0, Notification_Counts::get_total() );
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Initializer::class, 'enqueue_red_bubble_script' ) ),
			'The async warmer script should be enqueued on a cold cache.'
		);
	}

	/**
	 * Disconnected sites should not have anything registered.
	 */
	public function test_skips_registration_when_disconnected() {
		Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();

		$this->seed_cached_alerts(
			array(
				'backup_failure' => array( 'message' => 'Backup failed' ),
			)
		);

		Initializer::maybe_show_red_bubble();

		$this->assertSame( array(), Notification_Counts::all() );
	}

	/**
	 * Notification_Counts registration must happen on `admin_menu` (not `admin_init`),
	 * and at a priority earlier than the menu-badges Menu_Renderer, which runs on
	 * `admin_menu` at priority 100000. Getting the hook or priority wrong here is
	 * exactly how the renderer would silently miss My Jetpack's contribution to the
	 * top-level badge total: registering on `admin_init` runs too early (before
	 * `admin_menu` fires at all), while a priority at or after 100000 on `admin_menu`
	 * would run after the renderer already read the registry.
	 */
	public function test_registers_on_admin_menu_at_priority_30_not_admin_init() {
		Initializer::init();

		$this->assertSame(
			30,
			has_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ) ),
			'maybe_show_red_bubble must be registered on admin_menu at priority 30, well before the menu-badges renderer at priority 100000.'
		);
		$this->assertFalse(
			has_action( 'admin_init', array( Initializer::class, 'maybe_show_red_bubble' ) ),
			'maybe_show_red_bubble must not be registered on admin_init.'
		);
	}
}
