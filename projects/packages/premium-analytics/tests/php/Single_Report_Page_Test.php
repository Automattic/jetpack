<?php
/**
 * Tests for the single-report page registry, its records, script data and REST route.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../../src/single-report-pages.php';
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Single_Report_Page
 * @covers \Automattic\Jetpack\PremiumAnalytics\Single_Report_Page_Registry
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_single_report_page
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_registered_single_report_page
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_single_report_pages
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_single_report_page_records
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_single_report_pages_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_single_report_pages_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\check_single_report_pages_permission
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_single_report_page_controls_schema
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_single_report_page_schema
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_single_report_pages_response
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_single_report_pages_rest_routes
 */
#[CoversClass( Single_Report_Page::class )]
#[CoversClass( Single_Report_Page_Registry::class )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_single_report_page' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_registered_single_report_page' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_single_report_pages' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_single_report_page_records' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_single_report_pages_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_single_report_pages_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\check_single_report_pages_permission' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_single_report_page_controls_schema' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_single_report_page_schema' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_single_report_pages_response' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_single_report_pages_rest_routes' )]
class Single_Report_Page_Test extends BaseTestCase {
	use Analytics_Capabilities_Trait;

	/**
	 * Users created so far, for unique logins.
	 *
	 * @var int
	 */
	private static $user_count = 0;

	/**
	 * _doing_it_wrong() method names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Callbacks hooked by the test, removed on tear down so the package's own hooks survive.
	 *
	 * @var array<int, array{0: string, 1: callable, 2: int}>
	 */
	private $hooked = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		register_single_report_pages_rest_routes();
		Capabilities::register();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$instance = new \ReflectionProperty( Single_Report_Page_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		foreach ( $this->hooked as list( $hook, $callback, $priority ) ) {
			remove_filter( $hook, $callback, $priority );
		}
		$this->hooked = array();

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		wp_set_current_user( 0 );
		$this->reset_analytics_capabilities();

		parent::tear_down();
	}

	public function test_register_derives_the_path_from_the_id_and_fills_the_defaults() {
		$page = register_single_report_page( DASHBOARD_NAME, 'example/video', array( 'label' => 'Video' ) );

		$this->assertInstanceOf( Single_Report_Page::class, $page );
		$this->assertSame( $page, get_registered_single_report_page( DASHBOARD_NAME, 'example/video' ) );
		$this->assertSame(
			array(
				'id'                => 'example/video',
				'path'              => 'video',
				'label'             => 'Video',
				'dashboard_section' => null,
				'feature'           => null,
				'scope_param'       => 'post_id',
				'id_pattern'        => '^[1-9]\d*$',
				'icon'              => null,
				'controls'          => null,
				'reports_page'      => null,
				'preferences_scope' => 'jetpack-premium-analytics/video-detail',
				'default_layout'    => array(),
				'sections'          => array(),
			),
			$page->to_array()
		);
	}

	public function test_register_keeps_a_declared_path_and_ignores_an_invalid_one() {
		$declared = register_single_report_page( DASHBOARD_NAME, 'example/video', array( 'path' => 'clip' ) );
		$invalid  = register_single_report_page( DASHBOARD_NAME, 'example/author', array( 'path' => 'Author Page' ) );

		$this->assertSame( 'clip', $declared->path );
		$this->assertSame( 'jetpack-premium-analytics/clip-detail', $declared->preferences_scope );
		$this->assertSame( 'author', $invalid->path );
		$this->assertSame( $declared, Single_Report_Page_Registry::get_instance()->get_registered_by_path( DASHBOARD_NAME, 'clip' ) );
	}

	public function test_register_refuses_an_unnamespaced_id_a_duplicate_id_and_a_duplicate_path() {
		$this->capture_doing_it_wrong();

		$this->assertFalse( register_single_report_page( DASHBOARD_NAME, 'video' ) );
		$this->assertInstanceOf( Single_Report_Page::class, register_single_report_page( DASHBOARD_NAME, 'example/video' ) );
		$this->assertFalse( register_single_report_page( DASHBOARD_NAME, 'example/video' ) );
		$this->assertFalse( register_single_report_page( DASHBOARD_NAME, 'other/clip', array( 'path' => 'video' ) ) );

		$this->assertCount( 3, $this->doing_it_wrong );
		$this->assertCount( 1, Single_Report_Page_Registry::get_instance()->get_all_registered( DASHBOARD_NAME ) );
	}

	public function test_a_read_before_init_does_not_hydrate_the_registry() {
		global $wp_actions;
		$init_runs = $wp_actions['init'] ?? null;
		unset( $wp_actions['init'] );

		try {
			$this->capture_doing_it_wrong();
			$calls = 0;
			$this->hook(
				Single_Report_Page_Registry::REGISTER_ACTION,
				static function () use ( &$calls ) {
					++$calls;
				}
			);

			$this->assertSame( array(), Single_Report_Page_Registry::get_instance()->get_all_registered( DASHBOARD_NAME ) );
			$this->assertSame( 0, $calls );
			$this->assertNotEmpty( $this->doing_it_wrong );
		} finally {
			if ( null !== $init_runs ) {
				$wp_actions['init'] = $init_runs;
			}
		}
	}

	public function test_the_first_read_after_init_fires_the_action_once_with_the_registry() {
		$calls = array();
		$this->hook(
			Single_Report_Page_Registry::REGISTER_ACTION,
			static function ( $registry ) use ( &$calls ) {
				$calls[] = $registry;
				$registry->register( DASHBOARD_NAME, 'example/video', array( 'label' => 'Video' ) );
			}
		);

		$registry = Single_Report_Page_Registry::get_instance();
		$first    = $registry->get_all_registered( DASHBOARD_NAME );
		$second   = $registry->get_all_registered( DASHBOARD_NAME );

		$this->assertSame( array( $registry ), $calls );
		$this->assertSame( array( 'example/video' ), array_keys( $first ) );
		$this->assertSame( $first, $second );
	}

	public function test_sections_carry_their_own_layouts_through_the_filter() {
		$seen = array();
		$this->hook(
			SINGLE_REPORT_PAGE_DEFAULT_LAYOUT_FILTER,
			static function ( $layout, $page_id, $section_slug, $page ) use ( &$seen ) {
				$seen[] = array( $page_id, $section_slug, $page instanceof Single_Report_Page );
				if ( 'emails' === $section_slug ) {
					$layout[] = get_dashboard_default_widget_instance( 'added', 'example/added', 2 );
				}
				return $layout;
			},
			10,
			4
		);

		$range = array(
			'id'       => 'reportParams',
			'type'     => 'jpa/report-params',
			'elements' => array(
				array(
					'value' => 'last-30-days',
					'label' => 'Last 30 days',
				),
			),
		);
		$page  = register_single_report_page(
			DASHBOARD_NAME,
			'example/post',
			array(
				'sections' => array(
					array(
						'slug'           => 'traffic',
						'label'          => 'Traffic',
						'default_layout' => array( get_dashboard_default_widget_instance( 'a', 'example/a', 1 ) ),
						'controls'       => array( $range ),
					),
					array(
						'slug'           => 'emails',
						'default_layout' => static function () {
							return array( get_dashboard_default_widget_instance( 'b', 'example/b', 1 ) );
						},
						'controls'       => false,
					),
					array( 'slug' => 'Bad Slug' ),
					array( 'slug' => 'traffic' ),
				),
			)
		);

		$record = $page->to_array();

		$this->assertSame( array(), $record['default_layout'] );
		$this->assertSame( array( 'traffic', 'emails' ), array_column( $record['sections'], 'slug' ) );
		$this->assertSame( array( 'Traffic', 'emails' ), array_column( $record['sections'], 'label' ) );
		$this->assertSame( array( array( $range ), array() ), array_column( $record['sections'], 'controls' ) );
		$this->assertSame( array( 'a' ), array_column( $record['sections'][0]['default_layout'], 'uuid' ) );
		$this->assertSame( array( 'b', 'added' ), array_column( $record['sections'][1]['default_layout'], 'uuid' ) );
		$this->assertContains( array( 'example/post', 'emails', true ), $seen );
	}

	public function test_a_page_is_available_to_stats_readers_unless_its_rule_says_otherwise() {
		register_single_report_page( DASHBOARD_NAME, 'example/video' );
		register_single_report_page( DASHBOARD_NAME, 'example/open', array( 'is_available' => '__return_true' ) );
		register_single_report_page( DASHBOARD_NAME, 'example/closed', array( 'is_available' => '__return_false' ) );

		$this->set_admin_user();
		$this->assertSame(
			array( 'example/video', 'example/open' ),
			array_column( get_available_single_report_page_records(), 'id' )
		);

		$this->login_as( 'subscriber' );
		$this->assertSame(
			array( 'example/open' ),
			array_column( get_available_single_report_page_records(), 'id' )
		);
	}

	/**
	 * @param array       $args     The declared icon and controls.
	 * @param string|null $icon     The icon the record serves.
	 * @param mixed       $controls The controls the record serves.
	 *
	 * @dataProvider provide_declared_icon_and_controls
	 */
	#[DataProvider( 'provide_declared_icon_and_controls' )]
	public function test_the_record_keeps_a_valid_icon_and_controls_and_drops_the_rest( $args, $icon, $controls ) {
		$record = register_single_report_page( DASHBOARD_NAME, 'example/video', $args )->to_array();

		$this->assertSame( $icon, $record['icon'] );
		$this->assertSame( $controls, $record['controls'] );
	}

	/**
	 * Declared icon and controls, with what the record serves.
	 *
	 * @return array[]
	 */
	public static function provide_declared_icon_and_controls() {
		$range = array(
			'id'       => 'reportParams',
			'type'     => 'jpa/report-params',
			'elements' => array(
				array(
					'value' => 'last-7-days',
					'label' => 'Last 7 days',
				),
			),
		);

		return array(
			'registered icon, one field per bound type' => array(
				array(
					'icon'     => 'jpa/video',
					'controls' => array(
						$range,
						array(
							'id'   => 'other',
							'type' => 'jpa/report-params',
						),
						array(
							'id'   => 'view',
							'type' => 'jpa/select',
						),
					),
				),
				'jpa/video',
				array( $range ),
			),
			'no controls'                               => array( array( 'controls' => false ), null, array() ),
			'an empty list'                             => array( array( 'controls' => array() ), null, array() ),
			'bare icon name, controls not a list'       => array(
				array(
					'icon'     => 'video',
					'controls' => 'reportParams',
				),
				null,
				null,
			),
			'no field of a bound type'                  => array(
				array(
					'controls' => array(
						array(
							'id'   => 'view',
							'type' => 'jpa/select',
						),
						array( 'type' => 'jpa/report-params' ),
					),
				),
				null,
				null,
			),
		);
	}

	public function test_the_rest_schema_names_every_record_and_section_field() {
		$record = register_single_report_page( DASHBOARD_NAME, 'example/post', array( 'sections' => array( array( 'slug' => 'traffic' ) ) ) )->to_array();
		$schema = get_single_report_page_schema();

		$this->assertSame( array_keys( $record ), array_keys( $schema['properties'] ) );
		$this->assertSame( array_keys( $record['sections'][0] ), array_keys( $schema['properties']['sections']['items']['properties'] ) );
	}

	public function test_script_data_lists_the_available_pages_on_the_dashboard_once_one_is_registered() {
		$this->set_admin_user();
		configure_single_report_pages_script_data();
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );

		$before = apply_filters( 'jetpack_admin_js_script_data', array() );
		$this->assertArrayNotHasKey( 'single_report_pages', $before['premium_analytics'] ?? array() );

		register_single_report_page( DASHBOARD_NAME, 'example/video', array( 'label' => 'Video' ) );

		$after = apply_filters( 'jetpack_admin_js_script_data', array() );
		$this->assertSame( array( 'example/video' ), array_column( $after['premium_analytics']['single_report_pages'], 'id' ) );

		// Every other admin screen loads the same script data, without the pages.
		$_GET['page'] = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );
		$this->assertArrayNotHasKey( 'premium_analytics', apply_filters( 'jetpack_admin_js_script_data', array() ) );
	}

	public function test_rest_route_lists_the_available_pages_for_a_dashboard_reader() {
		register_single_report_page( DASHBOARD_NAME, 'example/video', array( 'label' => 'Video' ) );

		$anonymous = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/single-report-pages' )
		);
		$this->assertSame( 401, $anonymous->get_status() );

		$this->set_admin_user();
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/single-report-pages' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'example/video' ), array_column( $response->get_data(), 'id' ) );
		$this->assertSame( 'video', $response->get_data()[0]['path'] );
	}

	/**
	 * Hook a callback for the duration of the test.
	 *
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback.
	 * @param int      $priority Priority.
	 * @param int      $args     Accepted arguments.
	 */
	private function hook( $hook, $callback, $priority = 10, $args = 1 ) {
		add_filter( $hook, $callback, $priority, $args );
		$this->hooked[] = array( $hook, $callback, $priority );
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
	}

	/**
	 * Log in as a fresh administrator.
	 */
	private function set_admin_user() {
		++self::$user_count;

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_single_report_pages_admin_' . self::$user_count,
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $admin_id );
	}
}
