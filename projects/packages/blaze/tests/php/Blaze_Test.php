<?php
/**
 * This file contains PHPUnit tests for the Blaze class.
 * To run the package unit tests, run jetpack test php packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Blaze class.
 *
 * @covers \Automattic\Jetpack\Blaze
 */
#[CoversClass( Blaze::class )]
class Blaze_Test extends BaseTestCase {
	/**
	 * Admin user id
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		Blaze::$script_path = 'js/editor.js';
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_dequeue_script( Blaze::SCRIPT_HANDLE );
		wp_deregister_script( Blaze::SCRIPT_HANDLE );
		wp_set_current_user( 0 );
	}

	/**
	 * Test that Blaze::init() does not run everything by default.
	 */
	public function test_should_not_check_eligibility_by_default() {
		/*
		 * The post_row_actions action should not be available on init.
		 * It only happens on a specific screen.
		 */
		$this->assertFalse( has_action( 'post_row_actions' ) );
		/**
		 * The jetpack_blaze_enabled filter should not be available on init.
		 * It should only be available after you've made a remote request to WordPress.com.
		 */
		$this->assertFalse( has_filter( 'jetpack_blaze_enabled' ) );
	}

	/**
	 * Test that the jetpack_blaze_dashboard_enable filter overwrites eligibility for the dashboard page.
	 */
	public function test_dashboard_filter_enable() {
		$this->assertTrue( Blaze::is_dashboard_enabled() );
		add_filter( 'jetpack_blaze_dashboard_enable', '__return_false' );
		$this->assertFalse( Blaze::is_dashboard_enabled() );
		add_filter( 'jetpack_blaze_dashboard_enable', '__return_true' );
	}

	/**
	 * Test that the jetpack_blaze_enabled filter overwrites eligibility, for admins.
	 */
	public function test_filter_overwrites_eligibility() {
		$this->assertFalse( Blaze::should_initialize()['can_init'] );
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		$this->assertTrue( Blaze::should_initialize()['can_init'] );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that Blaze is not available to editors.
	 */
	public function test_editor_not_eligible() {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Blaze::should_initialize()['can_init'] );
	}

	/**
	 * As a control when testing add_filters_and_actions_for_screen() make sure it always starts clean.
	 */
	private function confirm_add_filters_and_actions_for_screen_starts_clean() {
		$this->assertFalse( has_action( 'post_row_actions' ) );
	}

	/**
	 * Tests if the post_row action is added for admins when we force Blaze to be enabled.
	 */
	public function test_post_row_added() {
		$this->confirm_add_filters_and_actions_for_screen_starts_clean();

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		Blaze::add_post_links_actions();

		$this->assertNotFalse( has_action( 'post_row_actions' ) );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test if the admin menu is added for admins when we force Blaze to be enabled.
	 */
	public function test_admin_menu_added() {
		$this->confirm_add_filters_and_actions_for_screen_starts_clean();

		// Ensure that no menu is added by default.
		$this->assertEmpty( menu_page_url( 'advertising', false ) );

		wp_set_current_user( $this->admin_id );

		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		Blaze::enable_blaze_menu();
		$this->assertNotEmpty( menu_page_url( 'advertising', false ) );

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that the menu label is "Blaze Ads" (not "Advertising").
	 */
	public function test_admin_menu_label_is_blaze_ads() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		Blaze::enable_blaze_menu();

		// Find the "advertising" submenu entry and verify its label.
		$parent_slug = Blaze::get_menu_parent();
		$found_label = null;
		if ( isset( $submenu[ $parent_slug ] ) ) {
			foreach ( $submenu[ $parent_slug ] as $item ) {
				if ( 'advertising' === $item[2] ) {
					$found_label = $item[0];
					break;
				}
			}
		}

		$this->assertSame( 'Blaze Ads', $found_label );

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that get_menu_parent() returns 'tools.php' when neither WooCommerce
	 * nor Jetpack connection is present.
	 */
	public function test_get_menu_parent_fallback() {
		// In the test environment, WooCommerce class does not exist and
		// the site is not WPCOM or Jetpack-connected, so we should get tools.php.
		$this->assertSame( 'tools.php', Blaze::get_menu_parent() );
	}

	/**
	 * Test that has_active_campaigns() returns false when there is no site ID
	 * (the typical test-environment scenario).
	 */
	public function test_has_active_campaigns_returns_false_without_site_id() {
		$this->assertFalse( Blaze::has_active_campaigns() );
	}

	/**
	 * Test that has_active_campaigns() reads the cached transient.
	 */
	public function test_has_active_campaigns_cached_yes() {
		// Seed the site ID in the compact jetpack_options array (where
		// Jetpack_Options::get_option( 'id' ) actually reads it).
		update_option( 'jetpack_options', array( 'id' => 12345 ) );
		set_transient( 'jetpack_blaze_has_active_campaigns_12345', 'yes', HOUR_IN_SECONDS );

		$this->assertTrue( Blaze::has_active_campaigns() );

		delete_transient( 'jetpack_blaze_has_active_campaigns_12345' );
		delete_option( 'jetpack_options' );
	}

	/**
	 * Test that has_active_campaigns() reads cached "no" transient.
	 */
	public function test_has_active_campaigns_cached_no() {
		update_option( 'jetpack_options', array( 'id' => 12345 ) );
		set_transient( 'jetpack_blaze_has_active_campaigns_12345', 'no', HOUR_IN_SECONDS );

		$this->assertFalse( Blaze::has_active_campaigns() );

		delete_transient( 'jetpack_blaze_has_active_campaigns_12345' );
		delete_option( 'jetpack_options' );
	}

	/**
	 * Test that enable_blaze_menu() registers a top-level menu when the site
	 * has active campaigns (transient cached as 'yes').
	 */
	public function test_top_level_menu_when_active_campaigns() {
		global $menu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		// Seed the site ID and campaign transient.
		update_option( 'jetpack_options', array( 'id' => 12345 ) );
		set_transient( 'jetpack_blaze_has_active_campaigns_12345', 'yes', HOUR_IN_SECONDS );

		Blaze::enable_blaze_menu();

		// Verify a top-level menu entry exists for 'advertising'.
		$found_top_level = false;
		foreach ( (array) $menu as $item ) {
			if ( isset( $item[2] ) && 'advertising' === $item[2] ) {
				$found_top_level = true;
				break;
			}
		}

		$this->assertTrue( $found_top_level, 'Expected a top-level menu entry for advertising when active campaigns exist.' );

		delete_transient( 'jetpack_blaze_has_active_campaigns_12345' );
		delete_option( 'jetpack_options' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that enable_blaze_menu() registers a submenu (not top-level)
	 * when the site has no active campaigns.
	 */
	public function test_submenu_when_no_active_campaigns() {
		global $menu, $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		Blaze::enable_blaze_menu();

		// Verify 'advertising' is NOT in the top-level menu.
		$found_top_level = false;
		foreach ( (array) $menu as $item ) {
			if ( isset( $item[2] ) && 'advertising' === $item[2] ) {
				$found_top_level = true;
				break;
			}
		}
		$this->assertFalse( $found_top_level, 'Did not expect a top-level menu entry when no active campaigns.' );

		// Verify it exists as a submenu instead.
		$parent_slug   = Blaze::get_menu_parent();
		$found_submenu = false;
		if ( isset( $submenu[ $parent_slug ] ) ) {
			foreach ( $submenu[ $parent_slug ] as $item ) {
				if ( 'advertising' === $item[2] ) {
					$found_submenu = true;
					break;
				}
			}
		}
		$this->assertTrue( $found_submenu, 'Expected a submenu entry for advertising under ' . $parent_slug );

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that get_campaign_management_url() uses admin.php (not tools.php).
	 */
	public function test_campaign_management_url_uses_admin_php() {
		$url_data = Blaze::get_campaign_management_url( 42 );
		$this->assertStringContainsString( 'admin.php?page=advertising', $url_data['link'] );
		$this->assertStringNotContainsString( 'tools.php', $url_data['link'] );
	}

	/**
	 * Test that redirect_legacy_advertising_url is hooked on admin_init.
	 */
	public function test_redirect_legacy_url_is_hooked() {
		Blaze::init();
		$this->assertIsInt( has_action( 'admin_init', array( Blaze::class, 'redirect_legacy_advertising_url' ) ) );
	}

	/**
	 * Test that we avoid enqueuing assets when Blaze is not enabled.
	 *
	 * @dataProvider get_enqueue_scenarios
	 *
	 * @param string $hook           The current admin page.
	 * @param bool   $blaze_enabled  Whether Blaze is force-enabled or not.
	 * @param bool   $is_user_admin  Whether the current user is an admin or not.
	 * @param bool   $should_enqueue Whether we should enqueue Blaze assets or not.
	 */
	#[DataProvider( 'get_enqueue_scenarios' )]
	public function test_enqueue_block_editor_assets( $hook, $blaze_enabled, $is_user_admin, $should_enqueue ) {
		// Confirm that our script is not added by default.
		$this->assertFalse( wp_script_is( Blaze::SCRIPT_HANDLE, 'registered' ) );

		if ( $is_user_admin ) {
			wp_set_current_user( $this->admin_id );
		}

		if ( $blaze_enabled ) {
			add_filter( 'jetpack_blaze_enabled', '__return_true' );
		}

		// Set the current admin page.
		set_current_screen( $hook );

		Blaze::enqueue_block_editor_assets();

		// Assert that our style, filter, and action has been added.
		if ( $should_enqueue ) {
			$this->assertTrue( wp_script_is( Blaze::SCRIPT_HANDLE, 'enqueued' ) );
		} else {
			$this->assertFalse( wp_script_is( Blaze::SCRIPT_HANDLE, 'registered' ) );
		}

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test the different scenarios for Blaze eligibility.
	 *
	 * @dataProvider get_blaze_eligibility_responses
	 *
	 * @param array $eligibility_details  Details about the site status and the expected response.
	 * @param bool  $expected_eligibility The expected result of the Blaze eligibility check.
	 */
	#[DataProvider( 'get_blaze_eligibility_responses' )]
	public function test_site_supports_blaze( $eligibility_details, $expected_eligibility ) {
		$remote_request_happened = false;
		$has_transient           = ! empty( $eligibility_details['transient'] );

		if ( $has_transient ) {
			set_transient( 'jetpack_blaze_site_supports_blaze_0', $eligibility_details['transient'] );
		} else {
			if ( isset( $eligibility_details['body'] ) ) {
				$eligibility_details['body'] = wp_json_encode( $eligibility_details['body'], JSON_UNESCAPED_SLASHES );
			}

			$remote_request_happened = true;

			Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
			update_option( 'jetpack_private_options', array( 'blog_token' => 'blog.token' ) );

			add_filter(
				'pre_http_request',
				function () use ( $eligibility_details ) {
					return $eligibility_details;
				}
			);
		}

		$site_supports_blaze = Blaze::site_supports_blaze( 0 );

		if ( ! $has_transient ) {
			remove_filter(
				'pre_http_request',
				function () use ( $eligibility_details ) {
					return $eligibility_details;
				}
			);
		}

		$this->assertEquals( $expected_eligibility, $site_supports_blaze );
		$this->assertEquals( $remote_request_happened, ! $has_transient );

		delete_transient( 'jetpack_blaze_site_supports_blaze_0' );
	}

	/**
	 * Different scenarios (pages, Blaze eligibility) to test if Blaze js is enqueued in the editor.
	 *
	 * @return array
	 */
	public static function get_enqueue_scenarios() {
		return array(
			'In site editor, Blaze enabled, site admin'  => array(
				'site-editor',
				true,
				true,
				false,
			),
			'In post editor, Blaze disabled, site admin' => array(
				'post',
				false,
				true,
				false,
			),
			'In post editor, Blaze enabled, site admin'  => array(
				'post',
				true,
				true,
				true,
			),
			'In random admin page, Blaze enabled, site admin' => array(
				'tools',
				true,
				true,
				false,
			),
			'In post editor, Blaze enabled, editor role' => array(
				'post',
				true,
				false,
				false,
			),
		);
	}

	/**
	 * Different potential responses from the Blaze eligibility check.
	 *
	 * @return array[]
	 */
	public static function get_blaze_eligibility_responses() {
		return array(
			'no cache, successful request, blog eligible' => array(
				array(
					'response'    => array( 'code' => 200 ),
					'status_code' => 200,
					'body'        => array( 'approved' => true ),
				),
				true,
			),
			'no cache, successful request, blog not eligible' => array(
				array(
					'response'    => array( 'code' => 200 ),
					'status_code' => 200,
					'body'        => array( 'approved' => false ),
				),
				false,
			),
			'no cache, unsuccessful request, 403'         => array(
				array(
					'response'    => array( 'code' => 403 ),
					'status_code' => 403,
				),
				false,
			),
			'cache, boolean transient, blog eligible'     => array(
				array(
					'transient' => true,
				),
				true,
			),
			'cache, boolean transient, blog not eligible' => array(
				array(
					'transient' => false,
				),
				false,
			),
			'cache, array transient, blog eligible'       => array(
				array(
					'transient' => array( 'approved' => true ),
				),
				true,
			),
			'cache, array transient, blog not eligible'   => array(
				array(
					'transient' => array( 'approved' => false ),
				),
				false,
			),
		);
	}
}
