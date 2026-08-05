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
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * Tests for Premium Analytics dashboard sections.
 */
class Dashboard_Section_Test extends BaseTestCase {

	use Analytics_Capabilities_Trait;

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

		// Hooked by the package's entry points in production; the routes under test
		// are gated on the capability it maps.
		Capabilities::register();
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

		// Drops the package's mapping along with any per-user view_stats grant a
		// test added; set_up() hooks the mapping again.
		$this->reset_analytics_capabilities();

		wp_set_current_user( 0 );

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
		$this->assertSame( 'traffic', $section->slug );
		$this->assertSame( 'Traffic', $section->label );
		$this->assertSame( 15, $section->order );
		$this->assertSame( Dashboard_Section::DATE_FILTER_RANGE, $section->date_filter );
		$this->assertSame( $layout, $section->get_default_layout() );
	}

	/**
	 * A section can opt into the year date filter.
	 */
	public function test_section_accepts_the_year_date_filter() {
		$registry = new Dashboard_Section_Registry();

		$section = $registry->register(
			'example_dashboard',
			'example/insights',
			array( 'date_filter' => Dashboard_Section::DATE_FILTER_YEAR )
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( Dashboard_Section::DATE_FILTER_YEAR, $section->date_filter );
		$this->assertSame( Dashboard_Section::DATE_FILTER_YEAR, $section->to_array()['date_filter'] );
	}

	/**
	 * An unrecognized date filter keeps the default instead of reaching the dashboard.
	 */
	public function test_section_ignores_unknown_date_filter() {
		$section = new Dashboard_Section(
			'example_dashboard',
			'example/traffic',
			array( 'date_filter' => 'fortnight' )
		);

		$this->assertSame( Dashboard_Section::DATE_FILTER_RANGE, $section->date_filter );
	}

	/**
	 * Sections default to the date-range filter when the arg is omitted.
	 */
	public function test_section_defaults_to_the_range_date_filter() {
		$section = new Dashboard_Section( 'example_dashboard', 'example/traffic' );

		$this->assertSame( Dashboard_Section::DATE_FILTER_RANGE, $section->date_filter );
		$this->assertSame( 'range', $section->to_array()['date_filter'] );
	}

	/**
	 * The built-in Insights section offers the year date filter; the rest keep the range.
	 */
	public function test_built_in_sections_declare_their_date_filters() {
		// Store needs both gates: the filter stands in for WooCommerce being active,
		// and the admin user satisfies the capability check added in #50889.
		$this->set_admin_user();
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		register_default_dashboard_sections();

		$this->assertSame(
			array(
				'traffic'     => Dashboard_Section::DATE_FILTER_RANGE,
				'insights'    => Dashboard_Section::DATE_FILTER_YEAR,
				'subscribers' => Dashboard_Section::DATE_FILTER_RANGE,
				'store'       => Dashboard_Section::DATE_FILTER_RANGE,
			),
			array_column(
				array_map(
					static function ( Dashboard_Section $section ) {
						return $section->to_array();
					},
					get_available_dashboard_sections( DASHBOARD_NAME )
				),
				'date_filter',
				'slug'
			)
		);
	}

	/**
	 * The sections schema documents the date-filter surfaces and their default.
	 */
	public function test_sections_schema_documents_the_date_filter() {
		$schema = get_dashboard_section_schema();

		$this->assertSame(
			array( 'id', 'slug', 'label', 'order', 'date_filter', 'default_layout' ),
			array_keys( $schema['properties'] )
		);
		$this->assertSame(
			array( 'range', 'year' ),
			$schema['properties']['date_filter']['enum']
		);
		$this->assertSame( 'range', $schema['properties']['date_filter']['default'] );
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
	 * Slugs are derived from the section ID segment after the namespace.
	 */
	public function test_section_slug_is_derived_from_id() {
		register_default_dashboard_sections();

		$expected = array(
			'analytics/traffic'     => 'traffic',
			'analytics/insights'    => 'insights',
			'analytics/subscribers' => 'subscribers',
			'woocommerce/store'     => 'store',
		);

		foreach ( $expected as $id => $slug ) {
			$section = get_registered_dashboard_section( DASHBOARD_NAME, $id );

			$this->assertInstanceOf( Dashboard_Section::class, $section );
			$this->assertSame( $slug, $section->slug );
		}
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
	 * Section to_array() carries its default layout.
	 */
	public function test_to_array_includes_default_layout() {
		register_default_dashboard_sections();

		$traffic = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/traffic' );
		$data    = $traffic->to_array();

		$this->assertArrayHasKey( 'default_layout', $data );
		$this->assertSame( $traffic->get_default_layout(), $data['default_layout'] );
		$this->assertNotEmpty( $data['default_layout'] );
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/analytics/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'             => 'analytics/traffic',
					'slug'           => 'traffic',
					'label'          => 'Traffic',
					'order'          => 10,
					'date_filter'    => 'range',
					'default_layout' => array(),
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/unregistered_dashboard/sections' )
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
					'id'          => 'analytics/traffic',
					'slug'        => 'traffic',
					'label'       => 'Traffic',
					'order'       => 10,
					'date_filter' => 'range',
				),
				array(
					'id'          => 'analytics/insights',
					'slug'        => 'insights',
					'label'       => 'Insights',
					'order'       => 20,
					'date_filter' => 'year',
				),
				array(
					'id'          => 'analytics/subscribers',
					'slug'        => 'subscribers',
					'label'       => 'Subscribers',
					'order'       => 30,
					'date_filter' => 'range',
				),
			),
			array_map(
				static function ( Dashboard_Section $section ) {
					// Assert on the metadata shape here; the default layout is
					// covered by test_to_array_includes_default_layout().
					$data = $section->to_array();
					unset( $data['default_layout'] );

					return $data;
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
		$this->set_admin_user();

		register_default_dashboard_sections();

		$woocommerce = get_registered_dashboard_section( DASHBOARD_NAME, 'woocommerce/store' );

		$this->assertInstanceOf( Dashboard_Section::class, $woocommerce );
		$this->assertTrue( $woocommerce->is_available() );
		$this->assertSame( 'Store', $woocommerce->label );
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
	 * Store data is only served to administrators, so a reader who reached the
	 * dashboard through view_stats is not offered the section at all.
	 */
	public function test_omits_woocommerce_dashboard_section_from_a_view_stats_reader() {
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );
		$user_id = $this->set_editor_user();
		$this->grant_view_stats_to( $user_id );

		register_default_dashboard_sections();

		$woocommerce = get_registered_dashboard_section( DASHBOARD_NAME, 'woocommerce/store' );

		$this->assertFalse( $woocommerce->is_available() );
		$this->assertNotContains(
			'woocommerce/store',
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
				},
				get_available_dashboard_sections( DASHBOARD_NAME )
			)
		);
	}

	/**
	 * That reader still gets the section routes: the dashboard itself is theirs.
	 */
	public function test_sections_route_serves_a_view_stats_reader() {
		$user_id = $this->set_editor_user();
		$this->grant_view_stats_to( $user_id );

		register_default_dashboard_sections();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * A user with neither capability gets nothing.
	 */
	public function test_sections_route_refuses_a_plain_editor() {
		$this->set_editor_user();

		register_default_dashboard_sections();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 403, $response->get_status() );
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_sections_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'             => 'example/first',
					'slug'           => 'first',
					'label'          => 'First',
					'order'          => 10,
					'date_filter'    => 'range',
					'default_layout' => array(),
				),
				array(
					'id'             => 'example/later',
					'slug'           => 'later',
					'label'          => 'Later',
					'order'          => 20,
					'date_filter'    => 'range',
					'default_layout' => array(),
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Sections route includes the store section only when WooCommerce is detected.
	 */
	public function test_sections_route_reflects_woocommerce_availability() {
		register_default_dashboard_sections();

		$this->set_admin_user();

		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array( 'traffic', 'insights', 'subscribers' ),
			array_column( $response->get_data(), 'slug' )
		);

		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array( 'traffic', 'insights', 'subscribers', 'store' ),
			array_column( $response->get_data(), 'slug' )
		);
	}

	/**
	 * Sections route responses carry the definition fields and the default layout.
	 */
	public function test_sections_route_returns_section_shape() {
		register_dashboard_section(
			'route_sections_dashboard',
			'analytics/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 10,
				'default_layout' => array(
					array(
						'uuid' => 'default-route-widget',
						'type' => 'example/widget',
					),
				),
			)
		);

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_sections_dashboard/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'             => 'analytics/traffic',
					'slug'           => 'traffic',
					'label'          => 'Traffic',
					'order'          => 10,
					'date_filter'    => 'range',
					'default_layout' => array(
						array(
							'uuid' => 'default-route-widget',
							'type' => 'example/widget',
						),
					),
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_sections_dashboard/sections' )
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_layout_dashboard/sections/analytics/traffic/default-layout' )
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_layout_dashboard/sections/analytics/missing/default-layout' )
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
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/route_unavailable_dashboard/sections/analytics/insights/default-layout' )
		);

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'dashboard_section_unavailable', $response->as_error()->get_error_code() );
	}

	/**
	 * Retired section-layout write routes are no longer registered.
	 */
	public function test_retired_layout_write_routes_are_not_registered() {
		register_dashboard_section(
			'route_layout_dashboard',
			'analytics/traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		$this->set_admin_user();

		$retired_requests = array(
			'PUT section layout'    => array( 'PUT', '/wpcom/v2/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' ),
			'DELETE section layout' => array( 'DELETE', '/wpcom/v2/dashboards/route_layout_dashboard/sections/analytics/traffic/layout' ),
			'DELETE all sections'   => array( 'DELETE', '/wpcom/v2/dashboards/route_layout_dashboard/sections' ),
		);

		foreach ( $retired_requests as $case => $retired_request ) {
			list( $method, $route ) = $retired_request;

			$request = new WP_REST_Request( $method, $route );
			if ( 'PUT' === $method ) {
				$request->set_param( 'layout', array() );
			}

			$response = rest_get_server()->dispatch( $request );

			$this->assertSame( 404, $response->get_status(), $case );
			$this->assertSame( 'rest_no_route', $response->as_error()->get_error_code(), $case );
		}
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
	 * Set current user to an editor: a dashboard reader once granted view_stats,
	 * and never an administrator.
	 *
	 * @return int User ID.
	 */
	private function set_editor_user() {
		++self::$user_count;

		$editor_id = wp_insert_user(
			array(
				'user_login' => 'jpa_dashboard_sections_editor_' . self::$user_count,
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);

		wp_set_current_user( $editor_id );

		return $editor_id;
	}
}
