<?php
/**
 * Test class for wpcom-admin-menu.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Cache as Status_Cache;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Class WPCOM_Admin_Menu_Test
 */
class WPCOM_Admin_Menu_Test extends \WorDBless\BaseTestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Domain for the test site.
	 *
	 * @var string
	 */
	private static $domain;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_pass'  => 'pass',
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			)
		);

		self::$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	}

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		global $menu, $submenu;
		$menu    = array();
		$submenu = array();

		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Tear down each test.
	 *
	 * Undo the platform constants, Host cache and modernization filter the rollout
	 * tests set, so they don't leak into the next case. (`jetpack_options['id']` is
	 * stored in the WorDBless DB, which is reset between tests.)
	 */
	public function tear_down() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		Status_Cache::clear();
		remove_all_filters( 'rsm_jetpack_ui_modernization_newsletter' );

		parent::tear_down();
	}

	/**
	 * The Jetpack submenu slug for the legacy Calypso "Subscribers" link, or null when
	 * it isn't present. `wpcom_add_jetpack_submenu()` registers
	 * `https://wordpress.com/subscribers/<domain>` while the Newsletter modernization
	 * gate is off, and retires it once the gate is on.
	 *
	 * @return string|null
	 */
	private function get_legacy_subscribers_submenu_slug() {
		global $submenu;

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( isset( $item[2] ) && str_starts_with( $item[2], 'https://wordpress.com/subscribers/' ) ) {
				return $item[2];
			}
		}

		return null;
	}

	/**
	 * The Newsletter modernization gate now defaults on for every site, so by default
	 * `wpcom_add_jetpack_submenu()` retires the legacy Calypso "Subscribers" submenu —
	 * the unified Newsletter page owns the Subscribers tab.
	 */
	public function test_jetpack_submenu_retires_legacy_subscribers_link_by_default() {
		\Jetpack_Options::update_option( 'id', 200 );

		wpcom_add_jetpack_submenu();

		$this->assertNull(
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must be retired by default now that the rollout is at 100%.'
		);
	}

	/**
	 * Hosts (and a11ns who want the legacy view back) can still opt out with
	 * `add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' )`,
	 * which keeps the legacy Calypso "Subscribers" submenu instead of retiring it.
	 */
	public function test_jetpack_submenu_keeps_legacy_subscribers_link_when_modernization_filter_off() {
		\Jetpack_Options::update_option( 'id', 200 );
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );

		wpcom_add_jetpack_submenu();

		$this->assertSame(
			'https://wordpress.com/subscribers/' . self::$domain,
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must remain when the modernization gate is filtered off.'
		);
	}

	/**
	 * When the Newsletter modernization gate is forced on, the unified Newsletter page
	 * owns the Subscribers tab and the legacy Calypso "Subscribers" submenu is retired.
	 */
	public function test_jetpack_submenu_retires_legacy_subscribers_link_when_modernization_filter_on() {
		\Jetpack_Options::update_option( 'id', 200 );
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_true' );

		wpcom_add_jetpack_submenu();

		$this->assertNull(
			$this->get_legacy_subscribers_submenu_slug(),
			'The legacy Subscribers submenu must be retired when the modernization gate is on.'
		);
	}

	/**
	 * Tests wpcom_add_hosting_menu
	 */
	public function test_add_hosting_menu() {
		global $menu;

		wpcom_add_hosting_menu();

		// Find the Hosting menu item.
		$hosting_menu = null;
		foreach ( $menu as $item ) {
			if ( strpos( $item[2], 'https://wordpress.com/overview/' ) !== false ) {
				$hosting_menu = $item;
				break;
			}
		}

		$this->assertNotNull( $hosting_menu, 'Hosting menu item should exist.' );
		$this->assertSame( 'https://wordpress.com/overview/' . self::$domain, $hosting_menu[2] );
		$this->assertStringContainsString( 'inline-icon', $hosting_menu[0] );
		$this->assertStringContainsString( 'dashicons-external', $hosting_menu[0] );
	}

	/**
	 * Tests wpcom_add_upgrades_menu
	 */
	public function test_add_upgrades_menu() {
		global $submenu;

		wpcom_add_upgrades_menu();

		$this->assertSame( 'https://wordpress.com/plans/' . self::$domain, $submenu['paid-upgrades.php'][1][2] );
		$this->assertSame( 'https://wordpress.com/add-ons/' . self::$domain, $submenu['paid-upgrades.php'][2][2] );
		$this->assertSame( 'https://wordpress.com/domains/manage/' . self::$domain, $submenu['paid-upgrades.php'][3][2] );
		$this->assertSame( 'https://wordpress.com/email/' . self::$domain, $submenu['paid-upgrades.php'][4][2] );
		$this->assertSame( 'https://wordpress.com/purchases/subscriptions/' . self::$domain, $submenu['paid-upgrades.php'][5][2] );
	}

	/**
	 * Tests wpcom_add_upgrades_menu is not added on staging sites.
	 */
	public function test_add_upgrades_menu_not_on_staging() {
		global $menu;

		update_option( 'wpcom_is_staging_site', true );
		wpcom_add_upgrades_menu();

		$upgrades_menu = null;
		foreach ( $menu as $item ) {
			if ( $item[2] === 'paid-upgrades.php' ) {
				$upgrades_menu = $item;
				break;
			}
		}

		$this->assertNull( $upgrades_menu, 'Upgrades menu should not exist on staging sites.' );

		delete_option( 'wpcom_is_staging_site' );
	}

	/**
	 * Runs the retired Tools > Marketing redirect and reports where it tried to send
	 * the request.
	 *
	 * The function calls `exit` once it has redirected, which would take the test
	 * runner with it, so this throws from the `wp_redirect` filter to unwind before
	 * that line is reached.
	 *
	 * @param string|null $page The `page` query arg to set, or null to omit it.
	 * @return string|null The redirect target, or null when the request was left alone.
	 */
	private function capture_retired_marketing_page_redirect( $page ) {
		unset( $_GET['page'] );
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}

		/**
		 * Unwinds out of `wp_safe_redirect()` carrying the target, so the `exit` that
		 * follows it is never reached.
		 *
		 * @param string $location The redirect target.
		 * @return never
		 * @throws RuntimeException Always, carrying the redirect target.
		 */
		$capture = static function ( $location ) {
			throw new RuntimeException( $location );
		};
		add_filter( 'wp_redirect', $capture );

		try {
			wpcom_redirect_retired_marketing_page();
			return null;
		} catch ( RuntimeException $e ) {
			return $e->getMessage();
		} finally {
			remove_filter( 'wp_redirect', $capture );
			unset( $_GET['page'] );
		}
	}

	/**
	 * The page is gone, so the URL the Calypso sidebar used to point at has to land
	 * somewhere sensible instead of core's "Cannot load wpcom-marketing-tools." screen.
	 */
	public function test_retired_marketing_page_redirects_to_the_dashboard() {
		$this->assertSame(
			admin_url(),
			$this->capture_retired_marketing_page_redirect( 'wpcom-marketing-tools' ),
			'The retired Tools > Marketing URL must land on the dashboard.'
		);
	}

	/**
	 * The redirect keys off one slug, so every other admin page has to pass through
	 * untouched.
	 */
	public function test_retired_marketing_page_redirect_leaves_other_pages_alone() {
		$this->assertNull(
			$this->capture_retired_marketing_page_redirect( 'activitypub' ),
			'An unrelated page slug must not be redirected.'
		);
	}

	/**
	 * Most admin requests carry no `page` at all, and this runs on every one of them.
	 */
	public function test_retired_marketing_page_redirect_leaves_requests_without_a_page_alone() {
		$this->assertNull(
			$this->capture_retired_marketing_page_redirect( null ),
			'A request with no page query arg must not be redirected.'
		);
	}

	/**
	 * WordPress slashes `$_GET` on the way in, so the comparison unslashes before
	 * matching. Guards against someone dropping the `wp_unslash()` call as redundant.
	 */
	public function test_retired_marketing_page_redirect_unslashes_the_page_arg() {
		$this->assertSame(
			admin_url(),
			$this->capture_retired_marketing_page_redirect( 'wpcom-marketing-tools\\' ),
			'The slug must still match once the added slashes are stripped.'
		);
	}
}
