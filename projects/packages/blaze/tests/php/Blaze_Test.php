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
		// Reset admin menu globals to avoid state leakage between tests.
		global $menu, $submenu, $_parent_pages, $_registered_pages;
		$menu              = array();
		$submenu           = array();
		$_parent_pages     = array();
		$_registered_pages = array();

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
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10 );
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
	 * Test the active campaign status check.
	 *
	 * @dataProvider get_active_campaign_status_responses
	 *
	 * @param array $response_details The mocked remote response.
	 * @param array $expected_status  The expected status response.
	 */
	#[DataProvider( 'get_active_campaign_status_responses' )]
	public function test_get_active_campaigns_status( $response_details, $expected_status ) {
		$request_url   = '';
		$request_count = 0;

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		if ( isset( $response_details['body'] ) ) {
			$response_details['body'] = wp_json_encode( $response_details['body'], JSON_UNESCAPED_SLASHES );
		}

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response_details, &$request_url, &$request_count ) {
				if ( false !== strpos( $url, '/sites/123/wordads/dsp/api/v1/search/campaigns/site/123' ) ) {
					$request_url = $url;
					++$request_count;

					return $response_details;
				}

				return $preempt;
			},
			10,
			3
		);

		$status = Blaze::get_active_campaigns_status( 123 );

		$this->assertSame( $expected_status, $status );
		$this->assertSame( 1, $request_count );
		$this->assertStringContainsString( 'status=active', $request_url );
		$this->assertStringContainsString( 'limit=1', $request_url );

		delete_transient( 'jetpack_blaze_active_campaigns_status_123' );
	}

	/**
	 * Test that active status responses use the transient cache.
	 */
	public function test_get_active_campaigns_status_uses_active_cache() {
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		set_transient(
			'jetpack_blaze_active_campaigns_status_123',
			array(
				'has_active_campaigns' => true,
				'status'               => 'active',
			),
			HOUR_IN_SECONDS
		);

		add_filter(
			'pre_http_request',
			function () {
				$this->fail( 'The remote active campaigns request should not run when active status is cached.' );
			}
		);

		$this->assertSame(
			array(
				'has_active_campaigns' => true,
				'status'               => 'active',
			),
			Blaze::get_active_campaigns_status( 123 )
		);

		delete_transient( 'jetpack_blaze_active_campaigns_status_123' );
	}

	/**
	 * Test that unknown status responses use a transient cache.
	 */
	public function test_get_active_campaigns_status_uses_unknown_cache() {
		$request_count = 0;
		$expected      = array(
			'has_active_campaigns' => false,
			'status'               => 'unknown',
		);

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count ) {
				if ( false !== strpos( $url, '/sites/123/wordads/dsp/api/v1/search/campaigns/site/123' ) ) {
					++$request_count;

					return array(
						'response' => array( 'code' => 500 ),
						'body'     => wp_json_encode( array( 'error' => 'server_error' ), JSON_UNESCAPED_SLASHES ),
					);
				}

				return $preempt;
			},
			10,
			3
		);

		$first_status  = Blaze::get_active_campaigns_status( 123 );
		$second_status = Blaze::get_active_campaigns_status( 123 );

		$this->assertSame( $expected, $first_status );
		$this->assertSame( $expected, $second_status );
		$this->assertSame( 1, $request_count );

		delete_transient( 'jetpack_blaze_active_campaigns_status_123' );
	}

	/**
	 * Test that statuses without active campaigns are not cached.
	 */
	public function test_get_active_campaigns_status_does_not_cache_none_status() {
		$request_count = 0;
		$responses     = array(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'campaigns' => array() ), JSON_UNESCAPED_SLASHES ),
			),
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'campaigns' => array(
							array(
								'campaign_id' => 1,
								'status'      => 'active',
							),
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			),
		);

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$request_count, $responses ) {
				if ( false !== strpos( $url, '/sites/123/wordads/dsp/api/v1/search/campaigns/site/123' ) ) {
					$response_index = min( $request_count, count( $responses ) - 1 );
					$response       = $responses[ $response_index ];
					++$request_count;

					return $response;
				}

				return $preempt;
			},
			10,
			3
		);

		$this->assertSame(
			array(
				'has_active_campaigns' => false,
				'status'               => 'none',
			),
			Blaze::get_active_campaigns_status( 123 )
		);
		$this->assertSame(
			array(
				'has_active_campaigns' => true,
				'status'               => 'active',
			),
			Blaze::get_active_campaigns_status( 123 )
		);
		$this->assertSame( 2, $request_count );

		delete_transient( 'jetpack_blaze_active_campaigns_status_123' );
	}

	/**
	 * Test that empty blog IDs return an unknown status.
	 */
	public function test_get_active_campaigns_status_returns_unknown_without_blog_id() {
		$this->assertSame(
			array(
				'has_active_campaigns' => false,
				'status'               => 'unknown',
			),
			Blaze::get_active_campaigns_status( 0 )
		);
	}

	/**
	 * Mock Jetpack site ID and tokens for API requests.
	 *
	 * @param mixed  $value The option value.
	 * @param string $name  The option name.
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'blog.token.123';
			case 'id':
				return 123;
			case 'user_tokens':
				$current_user_id = get_current_user_id();
				if ( $current_user_id ) {
					return array(
						$current_user_id => sprintf( 'token%d.secret%d.%d', $current_user_id, $current_user_id, $current_user_id ),
					);
				}
		}

		return $value;
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
	 * Test that no Blaze Ads menu is registered when the standalone Blaze Ads plugin
	 * is active and still uses the default 'advertising' slug (legacy behavior), so the
	 * two plugins do not produce a duplicate menu entry.
	 */
	public function test_no_menu_when_standalone_active_and_default_slug() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter( 'jetpack_blaze_standalone_active', '__return_true' );

		Blaze::enable_blaze_menu();

		$parent_slug   = Blaze::get_menu_parent();
		$found_default = false;
		if ( isset( $submenu[ $parent_slug ] ) ) {
			foreach ( $submenu[ $parent_slug ] as $item ) {
				if ( 'advertising' === $item[2] ) {
					$found_default = true;
					break;
				}
			}
		}
		$this->assertFalse( $found_default, 'This package must not register its own menu when the standalone plugin owns it.' );

		remove_all_filters( 'jetpack_blaze_standalone_active' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that when the standalone Blaze Ads plugin delegates registration to this
	 * package by filtering the slug (e.g. to 'wp-blaze'), this package DOES register the
	 * menu (it is the only registrant) instead of bailing out.
	 */
	public function test_menu_registered_when_standalone_delegates_via_slug() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter( 'jetpack_blaze_standalone_active', '__return_true' );
		add_filter(
			'jetpack_blaze_menu_slug',
			function () {
				return 'wp-blaze';
			}
		);

		Blaze::enable_blaze_menu();

		$parent_slug     = Blaze::get_menu_parent();
		$found_delegated = false;
		if ( isset( $submenu[ $parent_slug ] ) ) {
			foreach ( $submenu[ $parent_slug ] as $item ) {
				if ( 'wp-blaze' === $item[2] ) {
					$found_delegated = true;
					break;
				}
			}
		}
		$this->assertTrue( $found_delegated, 'When the standalone delegates via the slug filter, this package must register the menu.' );

		remove_all_filters( 'jetpack_blaze_menu_slug' );
		remove_all_filters( 'jetpack_blaze_standalone_active' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that no temporary migration notice is registered under Tools when the
	 * standalone plugin owns the menu (we bail before registering anything).
	 */
	public function test_no_migration_notice_when_standalone_active() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter( 'jetpack_blaze_standalone_active', '__return_true' );
		Constants::set_constant( 'IS_WPCOM', true );

		Blaze::enable_blaze_menu();

		$found_notice = false;
		if ( isset( $submenu['tools.php'] ) ) {
			foreach ( $submenu['tools.php'] as $item ) {
				if ( 'advertising-moved' === $item[2] ) {
					$found_notice = true;
					break;
				}
			}
		}
		$this->assertFalse( $found_notice, 'No migration notice should be registered when the standalone plugin owns the menu.' );

		Constants::clear_single_constant( 'IS_WPCOM' );
		remove_all_filters( 'jetpack_blaze_standalone_active' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that when the standalone plugin is active, BOTH the admin.php and the tools.php
	 * page=advertising entry points are forwarded to the standalone's wp-blaze page. This
	 * package handles both itself rather than depending on the standalone shipping its own
	 * redirect, so the matrix works against any standalone release.
	 */
	public function test_redirect_target_forwards_both_entrypoints_to_standalone() {
		global $pagenow;
		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter( 'jetpack_blaze_standalone_active', '__return_true' );
		$_GET['page'] = 'advertising';

		$pagenow = 'admin.php';
		$this->assertStringContainsString(
			'admin.php?page=wp-blaze',
			(string) Blaze::get_legacy_advertising_redirect_target()
		);

		$pagenow = 'tools.php';
		$this->assertStringContainsString(
			'admin.php?page=wp-blaze',
			(string) Blaze::get_legacy_advertising_redirect_target()
		);

		unset( $_GET['page'] );
		remove_all_filters( 'jetpack_blaze_standalone_active' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that without the standalone, tools.php?page=advertising redirects to
	 * admin.php?page=advertising once the menu has moved off Tools (WPCOM platform here).
	 */
	public function test_redirect_target_standard_move_to_admin_php() {
		global $pagenow;
		wp_set_current_user( $this->admin_id );
		$pagenow      = 'tools.php';
		$_GET['page'] = 'advertising';
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertStringContainsString(
			'admin.php?page=advertising',
			(string) Blaze::get_legacy_advertising_redirect_target()
		);

		Constants::clear_single_constant( 'IS_WPCOM' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
		unset( $_GET['page'] );
	}

	/**
	 * Test that no redirect happens when the menu is still under Tools (fallback context).
	 */
	public function test_redirect_target_null_when_menu_under_tools() {
		global $pagenow;
		wp_set_current_user( $this->admin_id );
		$pagenow      = 'tools.php';
		$_GET['page'] = 'advertising';
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		// Test env: no Woo / WPCOM / connection => parent is tools.php => no redirect.
		$this->assertNull( Blaze::get_legacy_advertising_redirect_target() );

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
		unset( $_GET['page'] );
	}

	/**
	 * Test that get_menu_parent() returns 'tools.php' when neither WooCommerce
	 * nor a Jetpack connection is present.
	 */
	public function test_get_menu_parent_fallback() {
		// In the test environment, the WooCommerce class does not exist and
		// the site is not WPCOM or Jetpack-connected, so we should get tools.php.
		$this->assertSame( 'tools.php', Blaze::get_menu_parent() );
	}

	/**
	 * Test that get_menu_parent() returns 'woocommerce-marketing' when WooCommerce
	 * is active and the marketing menu is registered.
	 */
	public function test_get_menu_parent_woocommerce() {
		global $menu;

		if ( ! class_exists( 'WooCommerce' ) ) {
			$this->markTestSkipped( 'WooCommerce class not available.' );
		}

		// Simulate the WooCommerce marketing menu being registered.
		$menu[] = array( 'Marketing', 'manage_options', 'woocommerce-marketing', '', '', '', '' );

		$this->assertSame( 'woocommerce-marketing', Blaze::get_menu_parent() );
	}

	/**
	 * Test that get_menu_parent() returns 'jetpack' on the WPCOM platform.
	 */
	public function test_get_menu_parent_wpcom_platform() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertSame( 'jetpack', Blaze::get_menu_parent() );

		Constants::clear_single_constant( 'IS_WPCOM' );
	}

	/**
	 * Test that the jetpack_blaze_menu_parent filter can override the parent slug.
	 */
	public function test_menu_parent_filter() {
		add_filter(
			'jetpack_blaze_menu_parent',
			function () {
				return 'custom-parent';
			}
		);

		$parent = Blaze::get_menu_parent();
		$this->assertSame( 'custom-parent', $parent );

		remove_all_filters( 'jetpack_blaze_menu_parent' );
	}

	/**
	 * Test that the jetpack_blaze_menu_slug filter changes the registered menu slug.
	 */
	public function test_menu_slug_filter() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter(
			'jetpack_blaze_menu_slug',
			function () {
				return 'wp-blaze';
			}
		);

		Blaze::enable_blaze_menu();

		$parent_slug   = Blaze::get_menu_parent();
		$found_submenu = false;
		$found_default = false;
		if ( isset( $submenu[ $parent_slug ] ) ) {
			foreach ( $submenu[ $parent_slug ] as $item ) {
				if ( 'wp-blaze' === $item[2] ) {
					$found_submenu = true;
				}
				if ( 'advertising' === $item[2] ) {
					$found_default = true;
				}
			}
		}
		$this->assertTrue( $found_submenu, 'Expected a submenu entry with slug wp-blaze when the filter is applied.' );
		$this->assertFalse( $found_default, 'Default slug "advertising" should not be registered when the filter overrides it.' );

		remove_all_filters( 'jetpack_blaze_menu_slug' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that the jetpack_blaze_menu_label filter changes the menu label.
	 */
	public function test_menu_label_filter() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter(
			'jetpack_blaze_menu_label',
			function () {
				return 'Custom Ads';
			}
		);

		Blaze::enable_blaze_menu();

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

		$this->assertSame( 'Custom Ads', $found_label );

		remove_all_filters( 'jetpack_blaze_menu_label' );
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
	 * Test that get_campaign_management_url() uses the filtered slug.
	 */
	public function test_campaign_management_url_uses_filtered_slug() {
		add_filter(
			'jetpack_blaze_menu_slug',
			function () {
				return 'wp-blaze';
			}
		);

		$url_data = Blaze::get_campaign_management_url( 42 );
		$this->assertStringContainsString( 'admin.php?page=wp-blaze', $url_data['link'] );
		$this->assertStringNotContainsString( 'page=advertising', $url_data['link'] );

		remove_all_filters( 'jetpack_blaze_menu_slug' );
	}

	/**
	 * Test that campaign/promote links point directly at the standalone Blaze Ads page
	 * (both the ?page= slug and the #! route prefix) when the standalone plugin owns the
	 * menu, so the deep-link fragment is preserved instead of being dropped by the
	 * admin.php?page=advertising redirect.
	 */
	public function test_campaign_management_url_targets_standalone_when_active() {
		add_filter( 'jetpack_blaze_standalone_active', '__return_true' );

		$url_data = Blaze::get_campaign_management_url( 42 );

		$this->assertStringContainsString( 'admin.php?page=wp-blaze', $url_data['link'] );
		$this->assertStringContainsString( '#!/wp-blaze/posts/promote/post-42/', $url_data['link'] );
		$this->assertStringNotContainsString( 'page=advertising', $url_data['link'] );
		$this->assertStringNotContainsString( '#!/advertising/', $url_data['link'] );

		remove_all_filters( 'jetpack_blaze_standalone_active' );
	}

	/**
	 * Test that redirect_legacy_advertising_url() does not redirect when not on tools.php.
	 */
	public function test_redirect_legacy_url_no_redirect_on_other_pages() {
		global $pagenow;
		$pagenow = 'edit.php';

		// Should not redirect (no exit), just return.
		Blaze::redirect_legacy_advertising_url();

		// If we get here, no redirect happened.
		$this->assertTrue( true );
	}

	/**
	 * Test that redirect_legacy_advertising_url() does not redirect when the menu
	 * is still under Tools (fallback context).
	 */
	public function test_redirect_legacy_url_no_redirect_when_menu_under_tools() {
		global $pagenow;
		$pagenow      = 'tools.php';
		$_GET['page'] = 'advertising';

		// In the test environment the parent is tools.php, so no redirect happens.
		Blaze::redirect_legacy_advertising_url();

		$this->assertTrue( true );

		unset( $_GET['page'] );
	}

	/**
	 * Test that redirect_legacy_advertising_url() is hooked on admin_menu.
	 */
	public function test_redirect_legacy_url_is_hooked() {
		Blaze::init();
		// Must run late on admin_menu: get_menu_parent() needs WooCommerce/core
		// menus registered to resolve the real parent, while still running before
		// WordPress validates the page parameter.
		$this->assertSame(
			999,
			has_action( 'admin_menu', array( Blaze::class, 'redirect_legacy_advertising_url' ) )
		);
	}

	/**
	 * Test that a migration notice entry is registered under Tools when the menu
	 * moves to another parent.
	 */
	public function test_migration_notice_added_when_menu_moves() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		Constants::set_constant( 'IS_WPCOM', true );

		Blaze::enable_blaze_menu();

		$found_notice = false;
		$notice_label = null;
		if ( isset( $submenu['tools.php'] ) ) {
			foreach ( $submenu['tools.php'] as $item ) {
				if ( 'advertising-moved' === $item[2] ) {
					$found_notice = true;
					$notice_label = $item[0];
					break;
				}
			}
		}
		$this->assertTrue( $found_notice, 'Expected a migration notice entry under Tools when the menu moves.' );
		// The temporary entry keeps the old "Advertising" label so users still
		// recognize it; it must not be renamed to "Blaze Ads".
		$this->assertSame( 'Advertising', $notice_label );

		Constants::clear_single_constant( 'IS_WPCOM' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that no migration notice is registered when the menu stays under Tools.
	 */
	public function test_migration_notice_not_added_when_menu_stays_in_tools() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		// Test environment: parent is tools.php (no WooCommerce, WPCOM, or connection).
		Blaze::enable_blaze_menu();

		$found_notice = false;
		if ( isset( $submenu['tools.php'] ) ) {
			foreach ( $submenu['tools.php'] as $item ) {
				if ( 'advertising-moved' === $item[2] ) {
					$found_notice = true;
					break;
				}
			}
		}
		$this->assertFalse( $found_notice, 'No migration notice should be registered when the menu stays under Tools.' );

		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that the migration notice can be disabled via filter.
	 */
	public function test_migration_notice_disabled_by_filter() {
		global $submenu;

		wp_set_current_user( $this->admin_id );
		add_filter( 'jetpack_blaze_enabled', '__return_true' );
		add_filter( 'jetpack_blaze_show_migration_notice', '__return_false' );
		Constants::set_constant( 'IS_WPCOM', true );

		Blaze::enable_blaze_menu();

		$found_notice = false;
		if ( isset( $submenu['tools.php'] ) ) {
			foreach ( $submenu['tools.php'] as $item ) {
				if ( 'advertising-moved' === $item[2] ) {
					$found_notice = true;
					break;
				}
			}
		}
		$this->assertFalse( $found_notice, 'The migration notice should not be registered when disabled via filter.' );

		Constants::clear_single_constant( 'IS_WPCOM' );
		remove_all_filters( 'jetpack_blaze_show_migration_notice' );
		add_filter( 'jetpack_blaze_enabled', '__return_false' );
	}

	/**
	 * Test that the migration notice renders a link to the new menu location.
	 */
	public function test_render_migration_notice_outputs_link() {
		ob_start();
		Blaze::render_migration_notice();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'admin.php?page=advertising', $output );
		$this->assertStringContainsString( 'Blaze Ads', $output );
	}

	/**
	 * Different potential responses from the active campaign status check.
	 *
	 * @return array[]
	 */
	public static function get_active_campaign_status_responses() {
		return array(
			'active campaign exists'    => array(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => array(
						'campaigns' => array(
							array(
								'campaign_id' => 1,
								'status'      => 'active',
							),
						),
					),
				),
				array(
					'has_active_campaigns' => true,
					'status'               => 'active',
				),
			),
			'no active campaigns exist' => array(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => array(
						'campaigns' => array(),
					),
				),
				array(
					'has_active_campaigns' => false,
					'status'               => 'none',
				),
			),
			'remote request fails'      => array(
				array(
					'response' => array( 'code' => 500 ),
					'body'     => array( 'error' => 'server_error' ),
				),
				array(
					'has_active_campaigns' => false,
					'status'               => 'unknown',
				),
			),
			'malformed response'        => array(
				array(
					'response' => array( 'code' => 200 ),
					'body'     => array( 'unexpected' => 'shape' ),
				),
				array(
					'has_active_campaigns' => false,
					'status'               => 'unknown',
				),
			),
		);
	}
}
