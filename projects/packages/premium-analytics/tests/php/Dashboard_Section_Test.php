<?php
/**
 * Tests for Premium Analytics dashboard sections.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../../src/dashboard-sections.php';

/**
 * Tests for Premium Analytics dashboard sections.
 */
class Dashboard_Section_Test extends BaseTestCase {

	/**
	 * Counter for unique test user logins.
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
	 * Set up a fresh REST server for each test.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		register_dashboard_sections_rest_routes();
	}

	/**
	 * Reset shared section registry state between tests.
	 */
	public function tear_down() {
		$instance = new \ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );

		parent::tear_down();
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * @return void
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
	 * Sections can be registered and retrieved.
	 */
	public function test_registers_dashboard_section() {
		$registry = new Dashboard_Section_Registry();
		$layout   = array(
			array(
				'uuid' => 'example-widget',
				'type' => 'example/widget',
			),
		);

		$section = $registry->register(
			'example_dashboard',
			'example/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 15,
				'default_layout' => $layout,
			)
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( $section, $registry->get_registered( 'example_dashboard', 'example/traffic' ) );
		$this->assertSame( 'example_dashboard', $section->dashboard_name );
		$this->assertSame( 'example/traffic', $section->id );
		$this->assertSame( 'Traffic', $section->label );
		$this->assertSame( 15, $section->order );
		$this->assertSame( $layout, $section->get_default_layout() );
	}

	/**
	 * Registration is rejected for dashboard names that break the route grammar.
	 */
	public function test_register_rejects_invalid_dashboard_name() {
		$registry = new Dashboard_Section_Registry();

		$this->capture_doing_it_wrong();

		$this->assertFalse( $registry->register( 'Invalid Name', 'example/traffic' ) );
		$this->assertNotEmpty( $this->doing_it_wrong );
		$this->assertNull( $registry->get_registered( 'Invalid Name', 'example/traffic' ) );
	}

	/**
	 * Registration is rejected for section IDs that lack a namespace prefix.
	 */
	public function test_register_rejects_invalid_section_id() {
		$registry = new Dashboard_Section_Registry();

		$this->capture_doing_it_wrong();

		$this->assertFalse( $registry->register( 'example_dashboard', 'traffic' ) );
		$this->assertNotEmpty( $this->doing_it_wrong );
		$this->assertNull( $registry->get_registered( 'example_dashboard', 'traffic' ) );
	}

	/**
	 * A section that is already registered cannot be registered again.
	 */
	public function test_register_rejects_duplicate_section() {
		$registry = new Dashboard_Section_Registry();

		$first = $registry->register( 'example_dashboard', 'example/traffic', array( 'label' => 'Traffic' ) );
		$this->assertInstanceOf( Dashboard_Section::class, $first );

		$this->capture_doing_it_wrong();

		$this->assertFalse( $registry->register( 'example_dashboard', 'example/traffic', array( 'label' => 'Duplicate' ) ) );
		$this->assertNotEmpty( $this->doing_it_wrong );
		$this->assertSame( $first, $registry->get_registered( 'example_dashboard', 'example/traffic' ) );
	}

	/**
	 * Non-array section arguments are ignored and defaults are retained.
	 */
	public function test_section_ignores_non_array_args() {
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Intentionally passing a non-array to exercise the defensive is_array() guard.
		$section = new Dashboard_Section( 'example_dashboard', 'example/traffic', 'not-an-array' );

		$this->assertSame( 'example/traffic', $section->label );
		$this->assertSame( 10, $section->order );
		$this->assertTrue( $section->is_available() );
		$this->assertSame( array(), $section->get_default_layout() );
	}

	/**
	 * The built-in traffic section resolves its layout from the dashboard default.
	 */
	public function test_traffic_section_default_layout_uses_dashboard_default() {
		register_default_dashboard_sections();

		$traffic = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/traffic' );

		$this->assertInstanceOf( Dashboard_Section::class, $traffic );
		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_NAME ),
			$traffic->get_default_layout()
		);
		$this->assertNotEmpty( $traffic->get_default_layout() );
	}

	/**
	 * Dashboard names can omit underscores when they match the REST route grammar.
	 */
	public function test_accepts_dashboard_names_without_underscores() {
		$section = register_dashboard_section(
			'analytics',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( $section, get_registered_dashboard_section( 'analytics', 'analytics/traffic' ) );

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/analytics/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'    => 'analytics/traffic',
					'label' => 'Traffic',
					'order' => 10,
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Sections route returns an empty list for syntactically valid unknown dashboards.
	 */
	public function test_sections_route_returns_empty_array_for_unknown_dashboard() {
		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/unregistered_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Available sections are ordered and unavailable sections are omitted.
	 */
	public function test_registry_returns_available_sections_sorted_by_order() {
		$registry = new Dashboard_Section_Registry();

		$registry->register(
			'ordered_dashboard',
			'example/later',
			array(
				'label' => 'Later',
				'order' => 20,
			)
		);
		$registry->register(
			'ordered_dashboard',
			'example/unavailable',
			array(
				'label'        => 'Unavailable',
				'order'        => 5,
				'is_available' => '__return_false',
			)
		);
		$registry->register(
			'ordered_dashboard',
			'example/first',
			array(
				'label' => 'First',
				'order' => 10,
			)
		);

		$this->assertSame(
			array( 'example/first', 'example/later' ),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
				},
				$registry->get_available_sections( 'ordered_dashboard' )
			)
		);
	}

	/**
	 * Sections sharing an order are tie-broken alphabetically by ID.
	 */
	public function test_registry_tie_breaks_equal_order_sections_by_id() {
		$registry = new Dashboard_Section_Registry();

		$registry->register( 'tie_dashboard', 'example/beta', array( 'order' => 10 ) );
		$registry->register( 'tie_dashboard', 'example/alpha', array( 'order' => 10 ) );

		$this->assertSame(
			array( 'example/alpha', 'example/beta' ),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
				},
				$registry->get_available_sections( 'tie_dashboard' )
			)
		);
	}

	/**
	 * The global helper registers sections in the singleton registry.
	 */
	public function test_global_register_dashboard_section_registers_with_singleton() {
		$section = register_dashboard_section(
			'helper_dashboard',
			'analytics/insights',
			array(
				'label' => 'Insights',
				'order' => 10,
			)
		);

		$this->assertSame( $section, get_registered_dashboard_section( 'helper_dashboard', 'analytics/insights' ) );
	}

	/**
	 * Built-in Premium Analytics sections are registered in the expected order.
	 */
	public function test_registers_built_in_dashboard_sections() {
		register_default_dashboard_sections();

		$this->assertSame(
			array(
				array(
					'id'    => 'analytics/traffic',
					'label' => 'Traffic',
					'order' => 10,
				),
				array(
					'id'    => 'analytics/insights',
					'label' => 'Insights',
					'order' => 20,
				),
				array(
					'id'    => 'analytics/subscribers',
					'label' => 'Subscribers',
					'order' => 30,
				),
			),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->to_array();
				},
				get_available_dashboard_sections( DASHBOARD_NAME )
			)
		);
	}

	/**
	 * Bootstrapping after init registers the default sections immediately.
	 */
	public function test_bootstrap_registers_defaults_when_init_has_run() {
		do_action( 'init' );

		bootstrap_dashboard_sections();

		$this->assertInstanceOf(
			Dashboard_Section::class,
			get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/traffic' )
		);
	}

	/**
	 * Sections route returns available sections.
	 */
	public function test_sections_route_returns_available_sections_sorted_by_order() {
		register_dashboard_section(
			'route_sections_dashboard',
			'example/later',
			array(
				'label' => 'Later',
				'order' => 20,
			)
		);
		register_dashboard_section(
			'route_sections_dashboard',
			'example/unavailable',
			array(
				'label'        => 'Unavailable',
				'order'        => 5,
				'is_available' => '__return_false',
			)
		);
		register_dashboard_section(
			'route_sections_dashboard',
			'example/first',
			array(
				'label' => 'First',
				'order' => 10,
			)
		);

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_sections_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'    => 'example/first',
					'label' => 'First',
					'order' => 10,
				),
				array(
					'id'    => 'example/later',
					'label' => 'Later',
					'order' => 20,
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Sections route requires manage_options.
	 */
	public function test_sections_route_requires_manage_options() {
		wp_set_current_user( 0 );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_sections_dashboard/sections' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Default-layout route returns a section default.
	 */
	public function test_default_layout_route_returns_section_default_layout() {
		$layout = array(
			array(
				'uuid' => 'default-route-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => static function () use ( $layout ) {
					return $layout;
				},
			)
		);

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/default-layout' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $layout, $response->get_data() );
	}

	/**
	 * Default-layout route returns 404 for unknown sections.
	 */
	public function test_default_layout_route_returns_404_for_unknown_section() {
		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/missing/default-layout' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_not_found', $response->as_error()->get_error_code() );
	}

	/**
	 * Default-layout route returns 404 for unavailable sections.
	 */
	public function test_default_layout_route_returns_404_for_unavailable_section() {
		register_dashboard_section(
			'route_unavailable_dashboard',
			'analytics/insights',
			array(
				'label'        => 'Insights',
				'order'        => 10,
				'is_available' => '__return_false',
			)
		);

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_unavailable_dashboard/sections/analytics/insights/default-layout' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_unavailable', $response->as_error()->get_error_code() );
	}

	/**
	 * Set current user to an administrator.
	 *
	 * @return void
	 */
	private function set_admin_user() {
		++self::$user_count;

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_dashboard_sections_admin_' . self::$user_count,
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $admin_id );
	}
}
