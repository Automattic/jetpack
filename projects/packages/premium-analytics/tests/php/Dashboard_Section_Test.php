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
		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );

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
	 * The built-in insights and subscribers sections resolve their tab defaults.
	 */
	public function test_non_traffic_section_default_layouts_use_tab_defaults() {
		register_default_dashboard_sections();

		$insights    = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/insights' );
		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $insights );
		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertSame(
			get_dashboard_default_layout_for( 'analytics/insights' ),
			$insights->get_default_layout()
		);
		$this->assertSame(
			get_dashboard_default_layout_for( 'analytics/subscribers' ),
			$subscribers->get_default_layout()
		);
		$this->assertNotEmpty( $insights->get_default_layout() );
		$this->assertNotEmpty( $subscribers->get_default_layout() );
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
					'id'              => 'analytics/traffic',
					'label'           => 'Traffic',
					'order'           => 10,
					'layout'          => array(),
					'hasCustomLayout' => false,
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
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

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
	 * The WooCommerce section is registered when WooCommerce is available.
	 */
	public function test_registers_woocommerce_dashboard_section_when_available() {
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		register_default_dashboard_sections();

		$woocommerce = get_registered_dashboard_section( DASHBOARD_NAME, 'woocommerce/store' );

		$this->assertInstanceOf( Dashboard_Section::class, $woocommerce );
		$this->assertTrue( $woocommerce->is_available() );
		$this->assertSame( 'WooCommerce', $woocommerce->label );
		$this->assertSame( 40, $woocommerce->order );
		$this->assertSame(
			array(
				'analytics/traffic',
				'analytics/insights',
				'analytics/subscribers',
				'woocommerce/store',
			),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
				},
				get_available_dashboard_sections( DASHBOARD_NAME )
			)
		);
		$this->assertSame(
			get_dashboard_default_layout_for( 'woocommerce/store' ),
			$woocommerce->get_default_layout()
		);
	}

	/**
	 * The WooCommerce section is omitted from available sections when WooCommerce is unavailable.
	 */
	public function test_omits_woocommerce_dashboard_section_when_unavailable() {
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

		register_default_dashboard_sections();

		$woocommerce = get_registered_dashboard_section( DASHBOARD_NAME, 'woocommerce/store' );

		$this->assertInstanceOf( Dashboard_Section::class, $woocommerce );
		$this->assertFalse( $woocommerce->is_available() );
		$this->assertSame(
			array(
				'analytics/traffic',
				'analytics/insights',
				'analytics/subscribers',
			),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
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
					'id'              => 'example/first',
					'label'           => 'First',
					'order'           => 10,
					'layout'          => array(),
					'hasCustomLayout' => false,
				),
				array(
					'id'              => 'example/later',
					'label'           => 'Later',
					'order'           => 20,
					'layout'          => array(),
					'hasCustomLayout' => false,
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Sections route includes resolved default layouts.
	 */
	public function test_sections_route_resolves_default_layouts() {
		$default_layout = array(
			array(
				'uuid' => 'default-route-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_sections_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => $default_layout,
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
					'id'              => 'analytics/traffic',
					'label'           => 'Traffic',
					'order'           => 10,
					'layout'          => $default_layout,
					'hasCustomLayout' => false,
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Sections route treats an empty stored layout as a deliberate customization.
	 */
	public function test_sections_route_resolves_customized_empty_layouts() {
		$default_layout = array(
			array(
				'uuid' => 'default-route-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_sections_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => $default_layout,
			)
		);

		$user_id = $this->set_admin_user();
		$this->set_section_layouts_preference(
			$user_id,
			array(
				'analytics/traffic' => array(),
			)
		);

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_sections_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'              => 'analytics/traffic',
					'label'           => 'Traffic',
					'order'           => 10,
					'layout'          => array(),
					'hasCustomLayout' => true,
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
	 * Layout route persists a custom layout for the current user.
	 */
	public function test_update_layout_route_persists_current_user_layout() {
		$custom_layout = array(
			array(
				'uuid'       => 'custom-route-widget',
				'type'       => 'example/widget',
				'attributes' => array(
					'example' => true,
				),
				'placement'  => array(
					'width'  => 2,
					'height' => 1,
					'order'  => 0,
				),
			),
		);

		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$user_id = $this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param( 'layout', $custom_layout );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'id'              => 'analytics/traffic',
				'label'           => 'Traffic',
				'order'           => 10,
				'layout'          => $custom_layout,
				'hasCustomLayout' => true,
			),
			$response->get_data()
		);

		$stored = get_stored_persisted_preferences_for_user( $user_id );

		$this->assertSame(
			$custom_layout,
			$stored[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ]['analytics/traffic']
		);
	}

	/**
	 * Layout route does not persist the injected dashboard default layout.
	 */
	public function test_update_layout_route_does_not_persist_injected_dashboard_layout() {
		$custom_layout = array(
			array(
				'uuid' => 'custom-route-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$user_id = $this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param( 'layout', $custom_layout );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$stored = get_stored_persisted_preferences_for_user( $user_id );

		$this->assertArrayHasKey( DASHBOARD_SECTION_LAYOUTS_KEY, $stored[ DASHBOARD_LAYOUT_SCOPE ] );
		$this->assertSame(
			$custom_layout,
			$stored[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ]['analytics/traffic']
		);
		$this->assertArrayNotHasKey( DASHBOARD_LAYOUT_KEY, $stored[ DASHBOARD_LAYOUT_SCOPE ] );
	}

	/**
	 * Layout route accepts an empty custom layout.
	 */
	public function test_update_layout_route_persists_empty_layout_as_custom() {
		$default_layout = array(
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
				'default_layout' => $default_layout,
			)
		);

		$this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param( 'layout', array() );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'id'              => 'analytics/traffic',
				'label'           => 'Traffic',
				'order'           => 10,
				'layout'          => array(),
				'hasCustomLayout' => true,
			),
			$response->get_data()
		);
	}

	/**
	 * Layout route rejects invalid widget layout entries.
	 */
	public function test_update_layout_route_rejects_invalid_layout() {
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param(
			'layout',
			array(
				array(
					'uuid' => 'missing-type-widget',
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Layout route rejects non-array widget attributes.
	 */
	public function test_update_layout_route_rejects_invalid_attributes() {
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param(
			'layout',
			array(
				array(
					'uuid'       => 'invalid-attributes-widget',
					'type'       => 'example/widget',
					'attributes' => 'oops',
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Layout route requires manage_options.
	 */
	public function test_update_layout_route_requires_manage_options() {
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' );
		$request->set_param( 'layout', array() );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Layout route returns 404 for unknown sections.
	 */
	public function test_update_layout_route_returns_404_for_unknown_section() {
		$this->set_admin_user();

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/missing/layout' );
		$request->set_param( 'layout', array() );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_not_found', $response->as_error()->get_error_code() );
	}

	/**
	 * Layout route returns 404 for unavailable sections.
	 */
	public function test_update_layout_route_returns_404_for_unavailable_section() {
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

		$request = new WP_REST_Request( 'PUT', '/jetpack/v4/dashboards/route_unavailable_dashboard/sections/analytics/insights/layout' );
		$request->set_param( 'layout', array() );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_unavailable', $response->as_error()->get_error_code() );
	}

	/**
	 * Delete layout route resets a section to its default layout.
	 */
	public function test_delete_layout_route_resets_to_default_layout() {
		$default_layout = array(
			array(
				'uuid' => 'default-route-widget',
				'type' => 'example/widget',
			),
		);
		$custom_layout  = array(
			array(
				'uuid' => 'custom-route-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => $default_layout,
			)
		);

		$user_id = $this->set_admin_user();
		$this->set_section_layouts_preference(
			$user_id,
			array(
				'analytics/traffic' => $custom_layout,
			)
		);

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'id'              => 'analytics/traffic',
				'label'           => 'Traffic',
				'order'           => 10,
				'layout'          => $default_layout,
				'hasCustomLayout' => false,
			),
			$response->get_data()
		);

		$stored = get_stored_persisted_preferences_for_user( $user_id );

		$this->assertArrayNotHasKey( DASHBOARD_SECTION_LAYOUTS_KEY, $stored[ DASHBOARD_LAYOUT_SCOPE ] );
		$this->assertSame( 'keep-me', $stored[ DASHBOARD_LAYOUT_SCOPE ]['unrelatedPreference'] );
	}

	/**
	 * Delete layout route returns 404 for unknown sections.
	 */
	public function test_delete_layout_route_returns_404_for_unknown_section() {
		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_layout_dashboard/sections/analytics/missing/layout' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_not_found', $response->as_error()->get_error_code() );
	}

	/**
	 * Delete layout route returns 404 for unavailable sections.
	 */
	public function test_delete_layout_route_returns_404_for_unavailable_section() {
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
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_unavailable_dashboard/sections/analytics/insights/layout' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_unavailable', $response->as_error()->get_error_code() );
	}

	/**
	 * Delete sections route resets every custom section layout.
	 */
	public function test_delete_sections_route_resets_all_section_layouts() {
		$traffic_default  = array(
			array(
				'uuid' => 'default-traffic-widget',
				'type' => 'example/widget',
			),
		);
		$insights_default = array(
			array(
				'uuid' => 'default-insights-widget',
				'type' => 'example/widget',
			),
		);
		$traffic_custom   = array(
			array(
				'uuid' => 'custom-traffic-widget',
				'type' => 'example/widget',
			),
		);
		$insights_custom  = array(
			array(
				'uuid' => 'custom-insights-widget',
				'type' => 'example/widget',
			),
		);

		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => $traffic_default,
			)
		);
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/insights',
			array(
				'label'          => 'Insights',
				'order'          => 20,
				'default_layout' => $insights_default,
			)
		);

		$user_id = $this->set_admin_user();
		$this->set_section_layouts_preference(
			$user_id,
			array(
				'analytics/traffic'  => $traffic_custom,
				'analytics/insights' => $insights_custom,
			)
		);

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_layout_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'              => 'analytics/traffic',
					'label'           => 'Traffic',
					'order'           => 10,
					'layout'          => $traffic_default,
					'hasCustomLayout' => false,
				),
				array(
					'id'              => 'analytics/insights',
					'label'           => 'Insights',
					'order'           => 20,
					'layout'          => $insights_default,
					'hasCustomLayout' => false,
				),
			),
			$response->get_data()
		);

		$stored = get_stored_persisted_preferences_for_user( $user_id );

		$this->assertArrayNotHasKey( DASHBOARD_SECTION_LAYOUTS_KEY, $stored[ DASHBOARD_LAYOUT_SCOPE ] );
		$this->assertSame( 'keep-me', $stored[ DASHBOARD_LAYOUT_SCOPE ]['unrelatedPreference'] );
	}

	/**
	 * Delete sections route removes the empty dashboard scope.
	 */
	public function test_delete_sections_route_removes_empty_dashboard_scope() {
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$user_id = $this->set_admin_user();
		update_user_meta(
			$user_id,
			get_persisted_preferences_meta_key(),
			array(
				DASHBOARD_LAYOUT_SCOPE => array(
					DASHBOARD_SECTION_LAYOUTS_KEY => array(
						'analytics/traffic' => array(
							array(
								'uuid' => 'custom-traffic-widget',
								'type' => 'example/widget',
							),
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_layout_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );

		$stored = get_stored_persisted_preferences_for_user( $user_id );

		$this->assertArrayNotHasKey( DASHBOARD_LAYOUT_SCOPE, $stored );
	}

	/**
	 * Delete sections route requires manage_options.
	 */
	public function test_delete_sections_route_requires_manage_options() {
		wp_set_current_user( 0 );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'DELETE', '/jetpack/v4/dashboards/route_layout_dashboard/sections' )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Set current user to an administrator.
	 *
	 * @return int User ID.
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

		return $admin_id;
	}

	/**
	 * Store section layout preferences for a user.
	 *
	 * @param int   $user_id         User ID.
	 * @param array $section_layouts Section layout map.
	 * @return void
	 */
	private function set_section_layouts_preference( $user_id, $section_layouts ) {
		update_user_meta(
			$user_id,
			get_persisted_preferences_meta_key(),
			array(
				DASHBOARD_LAYOUT_SCOPE => array(
					'unrelatedPreference'         => 'keep-me',
					DASHBOARD_SECTION_LAYOUTS_KEY => $section_layouts,
				),
			)
		);
	}
}
