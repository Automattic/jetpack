<?php
/**
 * Tests for Turned_Off_Page.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Users as WorDBless_Users;

/**
 * Tests for Turned_Off_Page.
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Turned_Off_Page
 */
#[CoversClass( Turned_Off_Page::class )]
class Turned_Off_Page_Test extends TestCase {

	/**
	 * Offer the Activity Log module, switched off.
	 */
	public function setUp(): void {
		parent::setUp();
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_activity_log' ) );
		add_filter( 'jetpack_get_available_modules', array( $this, 'offer_activity_log_with_version' ) );
		Menu_Visibility::forget_resolved_gates();
	}

	/**
	 * Undo the request and the pages registered.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_activity_log' ) );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'offer_activity_log_with_version' ) );
		remove_filter( 'jetpack_active_modules', array( $this, 'offer_activity_log' ) );
		unset( $_GET['page'] );
		remove_all_actions( 'load-admin_page_jetpack-activity-log' );
		$GLOBALS['_registered_pages'] = array();
		Menu_Visibility::forget_resolved_gates();
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		parent::tearDown();
	}

	/**
	 * Data provider for test_get_feature_for_page.
	 *
	 * @return array[] Page slug, expected feature slug.
	 */
	public static function provide_pages() {
		return array(
			'listed in off_pages' => array( 'jetpack-forms-responses-wp-admin', 'jetpack-forms' ),
			'its admin_page'      => array( 'jetpack-activity-log', 'activity-log' ),
			'Protect'             => array( 'jetpack-protect', 'protect-dashboard' ),
			'not a feature page'  => array( 'jetpack-settings', null ),
		);
	}

	/**
	 * A page slug maps to the feature it belongs to.
	 *
	 * @dataProvider provide_pages
	 *
	 * @param string      $page     Page slug.
	 * @param string|null $expected Feature slug.
	 */
	#[DataProvider( 'provide_pages' )]
	public function test_get_feature_for_page( $page, $expected ) {
		$this->assertSame( $expected, Turned_Off_Page::get_feature_for_page( $page )['slug'] ?? null );
	}

	/**
	 * Data provider for test_maybe_register.
	 *
	 * @return array[] Whether the module is on, whether its page is registered, role, whether the stand-in registers.
	 */
	public static function provide_registrations() {
		return array(
			'feature off, page missing'    => array( false, false, 'editor', true ),
			'feature on, page missing'     => array( true, false, 'administrator', false ),
			'feature off, page registered' => array( false, true, 'administrator', false ),
			'author'                       => array( false, false, 'author', false ),
		);
	}

	/**
	 * The stand-in takes the slug only when its feature is off and nothing else registered the page.
	 *
	 * @dataProvider provide_registrations
	 *
	 * @param bool   $module_on  Whether the module is on.
	 * @param bool   $registered Whether the feature registered its page.
	 * @param string $role       Role of the current user.
	 * @param bool   $expected   Whether the stand-in registers.
	 */
	#[DataProvider( 'provide_registrations' )]
	public function test_maybe_register( $module_on, $registered, $role, $expected ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'turned_off_page_' . $role,
					'user_pass'  => '123',
					'role'       => $role,
				)
			)
		);
		if ( $module_on ) {
			add_filter( 'jetpack_active_modules', array( $this, 'offer_activity_log' ) );
		}
		$GLOBALS['_registered_pages'] = $registered ? array( 'jetpack_page_jetpack-activity-log' => true ) : array();
		$_GET['page']                 = 'jetpack-activity-log';

		Turned_Off_Page::maybe_register();

		$this->assertSame( $expected, isset( $GLOBALS['_registered_pages']['admin_page_jetpack-activity-log'] ) );
		$this->assertSame( $expected, false !== has_action( 'load-admin_page_jetpack-activity-log', array( Turned_Off_Page::class, 'remove_admin_notices' ) ), 'notices are kept off the page' );
	}

	/**
	 * Data provider for test_card_offers_turn_on_only_to_those_who_can.
	 *
	 * @return array[] Role, whether the role may manage modules, whether the card has the Turn on form.
	 */
	public static function provide_card_roles() {
		return array(
			'administrator'                => array( 'administrator', true, true ),
			// Activity Log turns on by its module alone, so activating plugins is no help.
			'administrator without module' => array( 'administrator', false, false ),
			'editor'                       => array( 'editor', true, false ),
		);
	}

	/**
	 * The card shows the feature's illustration, and offers Turn on only to a user who can.
	 *
	 * @dataProvider provide_card_roles
	 *
	 * @param string $role       Role of the current user.
	 * @param bool   $module_cap Whether the role may manage modules, as Sync maps it on a connected site.
	 * @param bool   $expected   Whether the card has the Turn on form.
	 */
	#[DataProvider( 'provide_card_roles' )]
	public function test_card_offers_turn_on_only_to_those_who_can( $role, $module_cap, $expected ) {
		$map = static function ( $caps, $cap ) use ( $module_cap ) {
			return 'jetpack_manage_modules' === $cap ? array( $module_cap ? 'manage_options' : 'do_not_allow' ) : $caps;
		};
		add_filter( 'map_meta_cap', $map, 10, 2 );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'turned_off_card_' . $role . (int) $module_cap,
					'user_pass'  => '123',
					'role'       => $role,
				)
			)
		);

		$html = Turned_Off_Page::get_card_html( Turned_Off_Page::get_feature_for_page( 'jetpack-activity-log' ), admin_url() );
		remove_filter( 'map_meta_cap', $map );

		$this->assertStringContainsString( 'features/images/activity-log.webp', $html );
		$this->assertSame( $expected, str_contains( $html, 'name="action" value="' . Turned_Off_Page::ACTION . '"' ) );
	}

	/**
	 * Adds the Activity Log module to a list of module slugs.
	 *
	 * @param array $modules Module slugs.
	 * @return array
	 */
	public function offer_activity_log( $modules ) {
		$modules[] = 'activity-log';
		return $modules;
	}

	/**
	 * Adds the Activity Log module to a map of module slug to version.
	 *
	 * @param array $modules Module versions keyed by slug.
	 * @return array
	 */
	public function offer_activity_log_with_version( $modules ) {
		$modules['activity-log'] = '1.0';
		return $modules;
	}
}
