<?php
/**
 * Tests for DIFM_Lite_Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class DIFM_Lite_Admin_Menu_Test.
 *
 * The menu shown while a DIFM Express build is awaiting the customer's content.
 * It is the domain-only menu plus Posts, Media and Pages, so the customer can
 * read their existing content while filling in the content form.
 *
 * @covers Automattic\Jetpack\Masterbar\DIFM_Lite_Admin_Menu
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
#[CoversClass( DIFM_Lite_Admin_Menu::class )]
class DIFM_Lite_Admin_Menu_Test extends TestCase {

	/**
	 * Test domain.
	 *
	 * @var string
	 */
	public static $domain;

	/**
	 * Admin menu instance.
	 *
	 * @var DIFM_Lite_Admin_Menu
	 */
	public static $admin_menu;

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $menu, $submenu;

		static::$domain = ( new Status() )->get_site_suffix();

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		static::$admin_menu = DIFM_Lite_Admin_Menu::get_instance();
		$menu               = get_menu_fixture();
		$submenu            = get_submenu_fixture();

		$mock_email_checker = $this->getMockBuilder( WPCOM_Email_Subscription_Checker::class )->onlyMethods( array( 'has_email' ) )->getMock();
		$mock_email_checker->method( 'has_email' )->willReturn( false );
		static::$admin_menu->set_email_subscription_checker( $mock_email_checker );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Collects the menu slugs currently registered.
	 *
	 * @return array
	 */
	private function get_menu_slugs() {
		global $menu;
		return array_column( $menu, 2 );
	}

	/**
	 * The customer must be able to reach their existing content while the
	 * content form is still open — this is the whole point of the menu.
	 */
	public function test_reregister_menu_items_exposes_posts_media_and_pages() {
		static::$admin_menu->reregister_menu_items();

		$slugs = $this->get_menu_slugs();

		$this->assertContains( 'edit.php', $slugs, 'Posts should be reachable while awaiting content.' );
		$this->assertContains( 'upload.php', $slugs, 'Media should be reachable while awaiting content.' );
		$this->assertContains( 'edit.php?post_type=page', $slugs, 'Pages should be reachable while awaiting content.' );
	}

	/**
	 * The domain-only entries are the baseline this menu extends; losing them
	 * would strip the customer's access to their domain and purchases.
	 */
	public function test_reregister_menu_items_keeps_the_domain_only_entries() {
		static::$admin_menu->reregister_menu_items();

		$slugs = $this->get_menu_slugs();

		$this->assertContains( 'https://wordpress.com/domains/manage/' . static::$domain . '/edit/' . static::$domain, $slugs );
		$this->assertContains( 'https://wordpress.com/purchases/subscriptions/' . static::$domain, $slugs );
		$this->assertContains( 'https://wordpress.com/mailboxes/' . static::$domain, $slugs );
	}

	/**
	 * The build is still in progress, so everything the domain-only menu
	 * withholds stays withheld — this menu only adds the three content links.
	 */
	public function test_reregister_menu_items_does_not_restore_the_full_menu() {
		static::$admin_menu->reregister_menu_items();

		$slugs = $this->get_menu_slugs();

		$this->assertNotContains( 'themes.php', $slugs, 'Appearance must stay hidden during a build.' );
		$this->assertNotContains( 'plugins.php', $slugs, 'Plugins must stay hidden during a build.' );
		$this->assertNotContains( 'options-general.php', $slugs, 'Settings must stay hidden during a build.' );
		$this->assertCount( 6, $slugs, 'Exactly the domain-only entries plus Posts, Media and Pages.' );
	}
}
