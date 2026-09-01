<?php
/**
 * Tests for Premium Analytics dashboard sections.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
	 * Standalone-module filter callback registered by a test.
	 *
	 * @var callable|null
	 */
	private $available_modules_filter = null;

	/**
	 * Set up a fresh REST server for each test.
	 */
	public function set_up() {
		parent::set_up();

		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features'] = array();

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
		remove_all_filters( SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER );
		remove_all_filters( ADS_DASHBOARD_SECTION_AVAILABLE_FILTER );

		if ( null !== $this->available_modules_filter ) {
			remove_filter( 'jetpack_get_available_standalone_modules', $this->available_modules_filter );
			$this->available_modules_filter = null;
		}

		Jetpack_Options::delete_option( 'active_modules' );
		Constants::clear_constants();
		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features'] = array();

		// Drops the package's mapping along with any per-user view_stats grant a
		// test added; set_up() hooks the mapping again.
		$this->reset_analytics_capabilities();

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Mark a Jetpack module as both active and available.
	 *
	 * @param string $slug Module slug.
	 * @return void
	 */
	private function activate_module( $slug ) {
		Jetpack_Options::update_option( 'active_modules', array( $slug ) );

		$this->available_modules_filter = static function ( $modules ) use ( $slug ) {
			$modules[] = $slug;

			return $modules;
		};

		add_filter( 'jetpack_get_available_standalone_modules', $this->available_modules_filter );
	}

	/**
	 * Load the Jetpack class mock for a separate-process test.
	 *
	 * @return void
	 */
	private function fake_jetpack_plugin() {
		require_once __DIR__ . '/mocks/jetpack-plugin-mock.php';
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
	 * A section carries a heading distinct from its tab label.
	 */
	public function test_section_accepts_a_title() {
		$registry = new Dashboard_Section_Registry();

		$section = $registry->register(
			'example_dashboard',
			'example/traffic',
			array(
				'label' => 'Traffic',
				'title' => 'Site traffic',
			)
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( 'Traffic', $section->label );
		$this->assertSame( 'Site traffic', $section->title );

		$data = $section->to_array();
		$this->assertSame( 'Site traffic', $data['title'] );
	}

	/**
	 * The title stays null when unregistered, so the dashboard can fall back to the label.
	 */
	public function test_section_title_defaults_to_null() {
		$section = new Dashboard_Section( 'example_dashboard', 'example/traffic', array( 'label' => 'Traffic' ) );

		$this->assertNull( $section->title );

		$data = $section->to_array();
		$this->assertNull( $data['title'] );
	}

	/**
	 * An empty string registers as "no copy" rather than an empty heading.
	 */
	public function test_section_normalises_an_empty_title_to_null() {
		$section = new Dashboard_Section(
			'example_dashboard',
			'example/traffic',
			array(
				'label' => 'Traffic',
				'title' => '',
			)
		);

		$this->assertNull( $section->title );
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
	 * A section can hand the date control to its widgets and keep its surface.
	 */
	public function test_section_can_opt_out_of_the_header_date_control() {
		$registry = new Dashboard_Section_Registry();

		$section = $registry->register(
			'example_dashboard',
			'example/ads',
			array(
				'date_filter'         => Dashboard_Section::DATE_FILTER_RANGE,
				'date_filter_options' => array(
					'with_header_date_control' => false,
					'with_date_comparison'     => false,
				),
			)
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );

		$this->assertSame( Dashboard_Section::DATE_FILTER_RANGE, $section->date_filter );
		$this->assertSame(
			array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			$section->to_array()['date_filter_options']
		);
	}

	/**
	 * Placement and comparison are independent: a widget-hosted control can
	 * still offer comparison.
	 */
	public function test_section_can_move_the_date_control_without_dropping_comparison() {
		$section = new Dashboard_Section(
			'example_dashboard',
			'example/ads',
			array( 'date_filter_options' => array( 'with_header_date_control' => false ) )
		);

		$this->assertSame(
			array(
				'with_date_comparison'     => true,
				'with_header_date_control' => false,
			),
			$section->to_array()['date_filter_options']
		);
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
				'ads'         => Dashboard_Section::DATE_FILTER_RANGE,
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
	 * A section can turn off an optional date-filter control.
	 */
	public function test_section_accepts_date_filter_options() {
		$section = new Dashboard_Section(
			'example_dashboard',
			'example/insights',
			array( 'date_filter_options' => array( 'with_date_comparison' => false ) )
		);

		$this->assertSame(
			array(
				'with_date_comparison'     => false,
				'with_header_date_control' => true,
			),
			$section->date_filter_options
		);
		$this->assertSame(
			array(
				'with_date_comparison'     => false,
				'with_header_date_control' => true,
			),
			$section->to_array()['date_filter_options']
		);
	}

	/**
	 * Unknown options are dropped and known ones normalised to booleans.
	 */
	public function test_section_normalises_date_filter_options() {
		$section = new Dashboard_Section(
			'example_dashboard',
			'example/traffic',
			array(
				'date_filter_options' => array(
					'with_date_comparison' => 1,
					'with_moon_phase'      => true,
				),
			)
		);

		$this->assertSame(
			array(
				'with_date_comparison'     => true,
				'with_header_date_control' => true,
			),
			$section->date_filter_options
		);
	}

	/**
	 * Every optional control is offered when the arg is omitted.
	 */
	public function test_section_defaults_to_offering_every_date_filter_option() {
		$section = new Dashboard_Section( 'example_dashboard', 'example/traffic' );

		$this->assertSame(
			array(
				'with_date_comparison'     => true,
				'with_header_date_control' => true,
			),
			$section->to_array()['date_filter_options']
		);
	}

	/**
	 * Ads alone moves its date control to widgets; Ads and Insights disable comparison.
	 */
	public function test_built_in_sections_declare_their_date_filter_options() {
		// Store needs both gates: the filter stands in for WooCommerce being active,
		// and the admin user satisfies the capability check added in #50889.
		$this->set_admin_user();
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		register_default_dashboard_sections();

		$this->assertSame(
			array(
				'traffic'     => array(
					'with_date_comparison'     => true,
					'with_header_date_control' => true,
				),
				'insights'    => array(
					'with_date_comparison'     => false,
					'with_header_date_control' => true,
				),
				'subscribers' => array(
					'with_date_comparison'     => true,
					'with_header_date_control' => true,
				),
				'store'       => array(
					'with_date_comparison'     => true,
					'with_header_date_control' => true,
				),
				'ads'         => array(
					'with_date_comparison'     => false,
					'with_header_date_control' => false,
				),
			),
			array_column(
				array_map(
					static function ( Dashboard_Section $section ) {
						return $section->to_array();
					},
					get_available_dashboard_sections( DASHBOARD_NAME )
				),
				'date_filter_options',
				'slug'
			)
		);
	}

	/**
	 * Only store data waits on the analytics sync; the site sections render at once.
	 */
	public function test_only_the_store_section_requires_the_sync() {
		$this->set_admin_user();
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		register_default_dashboard_sections();

		$this->assertSame(
			array(
				'traffic'     => false,
				'insights'    => false,
				'subscribers' => false,
				'store'       => true,
				'ads'         => false,
			),
			array_column(
				array_map(
					static function ( Dashboard_Section $section ) {
						return $section->to_array();
					},
					get_available_dashboard_sections( DASHBOARD_NAME )
				),
				'requires_sync',
				'slug'
			)
		);
	}

	/**
	 * The analytics sections carry their own heading; Store still falls back to its label.
	 */
	public function test_built_in_sections_declare_their_headings() {
		// Store needs both gates: the filter stands in for WooCommerce being active,
		// and the admin user satisfies the capability check added in #50889.
		$this->set_admin_user();
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		register_default_dashboard_sections();

		$sections = array_map(
			static function ( Dashboard_Section $section ) {
				return $section->to_array();
			},
			get_available_dashboard_sections( DASHBOARD_NAME )
		);

		$this->assertSame(
			array(
				'traffic'     => 'Site traffic',
				'insights'    => 'Activity insights',
				'subscribers' => 'Subscribers stats',
				'store'       => null,
				'ads'         => null,
			),
			array_column( $sections, 'title', 'slug' )
		);
	}

	/**
	 * The sections schema documents the date-filter surfaces and their default.
	 *
	 * `routes/dashboard/config/date-filter.ts` re-declares these and falls back to `range`
	 * silently — widen `DateFilterSurface` there too, or new surfaces won't render.
	 */
	public function test_sections_schema_documents_the_date_filter() {
		$schema = get_dashboard_section_schema();

		$this->assertSame(
			array(
				'id',
				'slug',
				'label',
				'title',
				'order',
				'date_filter',
				'date_filter_options',
				'requires_sync',
				'default_layout',
			),
			array_keys( $schema['properties'] )
		);
		$this->assertSame(
			array( 'range', 'year' ),
			$schema['properties']['date_filter']['enum']
		);
		$this->assertSame( 'range', $schema['properties']['date_filter']['default'] );
		$this->assertSame(
			array( 'with_date_comparison', 'with_header_date_control' ),
			array_keys( $schema['properties']['date_filter_options']['properties'] )
		);
		$this->assertTrue(
			$schema['properties']['date_filter_options']['properties']['with_date_comparison']['default']
		);
		$this->assertTrue(
			$schema['properties']['date_filter_options']['properties']['with_header_date_control']['default']
		);
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
					'id'                  => 'analytics/traffic',
					'slug'                => 'traffic',
					'label'               => 'Traffic',
					'title'               => null,
					'order'               => 10,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
					'default_layout'      => array(),
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
					'id'                  => 'analytics/traffic',
					'slug'                => 'traffic',
					'label'               => 'Traffic',
					'title'               => 'Site traffic',
					'order'               => 10,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
				),
				array(
					'id'                  => 'analytics/insights',
					'slug'                => 'insights',
					'label'               => 'Insights',
					'title'               => 'Activity insights',
					'order'               => 20,
					'date_filter'         => 'year',
					'date_filter_options' => array(
						'with_date_comparison'     => false,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
				),
				array(
					'id'                  => 'analytics/subscribers',
					'slug'                => 'subscribers',
					'label'               => 'Subscribers',
					'title'               => 'Subscribers stats',
					'order'               => 30,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
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
				'analytics/ads',
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
	 * Section IDs the registry currently offers.
	 *
	 * @return string[]
	 */
	private function available_section_ids() {
		return array_map(
			static function ( Dashboard_Section $section ) {
				return $section->id;
			},
			get_available_dashboard_sections( DASHBOARD_NAME )
		);
	}

	/**
	 * Section slugs the sections route currently serves.
	 *
	 * @return string[]
	 */
	private function request_section_slugs() {
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 200, $response->get_status() );

		return array_column( $response->get_data(), 'slug' );
	}

	/**
	 * A site without a local module system keeps the tab.
	 */
	public function test_registers_subscribers_dashboard_section_without_a_module_system() {
		register_default_dashboard_sections();

		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertTrue( $subscribers->is_available() );
		$this->assertContains( 'analytics/subscribers', $this->available_section_ids() );
	}

	/**
	 * A Jetpack site with the module inactive hides the tab.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_omits_subscribers_dashboard_section_when_module_is_inactive() {
		$this->fake_jetpack_plugin();

		register_default_dashboard_sections();

		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertFalse( $subscribers->is_available() );

		$ids = $this->available_section_ids();

		$this->assertNotContains( 'analytics/subscribers', $ids );
		$this->assertContains( 'analytics/traffic', $ids );
	}

	/**
	 * A Jetpack site with the module active offers the tab.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_registers_subscribers_dashboard_section_when_module_is_active() {
		$this->fake_jetpack_plugin();
		$this->activate_module( 'subscriptions' );

		register_default_dashboard_sections();

		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertTrue( $subscribers->is_available() );
		$this->assertContains( 'analytics/subscribers', $this->available_section_ids() );
	}

	/**
	 * WPCOM Simple offers the tab without the module.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_offers_subscribers_dashboard_section_without_the_module() {
		$this->fake_jetpack_plugin();
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		register_default_dashboard_sections();

		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertTrue( $subscribers->is_available() );
	}

	/**
	 * Consumers can refuse the section through its availability filter.
	 */
	public function test_subscribers_availability_filter_overrides_the_module_state() {
		add_filter( SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

		register_default_dashboard_sections();

		$subscribers = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/subscribers' );

		$this->assertInstanceOf( Dashboard_Section::class, $subscribers );
		$this->assertFalse( $subscribers->is_available() );
		$this->assertNotContains( 'analytics/subscribers', $this->available_section_ids() );
	}

	/**
	 * The Ads tab is available without a local module system.
	 */
	public function test_registers_ads_dashboard_section_without_a_module_system() {
		$this->set_admin_user();

		register_default_dashboard_sections();

		$ads = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $ads );
		$this->assertTrue( $ads->is_available() );
		$this->assertSame( 'Ads', $ads->label );
		$this->assertSame( 50, $ads->order );
		$this->assertContains( 'analytics/ads', $this->available_section_ids() );
		$this->assertSame(
			get_dashboard_default_layout_for( 'analytics/ads' ),
			$ads->get_default_layout()
		);
	}

	/**
	 * The Ads tab is hidden when the WordAds module is inactive.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_omits_ads_dashboard_section_when_module_is_inactive() {
		$this->set_admin_user();
		$this->fake_jetpack_plugin();

		register_default_dashboard_sections();

		$ads = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $ads );
		$this->assertFalse( $ads->is_available() );

		$ids = $this->available_section_ids();

		$this->assertNotContains( 'analytics/ads', $ids );
		$this->assertContains( 'analytics/traffic', $ids );
	}

	/**
	 * The Ads tab is available when the WordAds module is active.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_registers_ads_dashboard_section_when_module_is_active() {
		$this->set_admin_user();
		$this->fake_jetpack_plugin();
		$this->activate_module( 'wordads' );

		register_default_dashboard_sections();

		$ads = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $ads );
		$this->assertTrue( $ads->is_available() );
		$this->assertContains( 'analytics/ads', $this->available_section_ids() );
	}

	/**
	 * On the WPCOM platform the plan feature decides, never the module list.
	 *
	 * The module stays active throughout, so each assertion also proves the
	 * platform branch was the one taken.
	 *
	 * @dataProvider provide_wpcom_platform_sites
	 *
	 * @param array<string, mixed> $constants Constants that place the site on the platform.
	 */
	#[DataProvider( 'provide_wpcom_platform_sites' )]
	public function test_ads_dashboard_section_follows_the_plan_feature_on_the_wpcom_platform( $constants ) {
		$this->set_admin_user();
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		$this->activate_module( 'wordads' );

		register_default_dashboard_sections();

		$this->assertNotContains(
			'analytics/ads',
			$this->available_section_ids(),
			'A plan without the feature has no ad surfaces.'
		);

		$GLOBALS['jpa_test_wpcom_features'] = array( 'wordads' );

		$this->assertContains(
			'analytics/ads',
			$this->available_section_ids(),
			'The wordads plan feature turns the tab on.'
		);
	}

	/**
	 * A plan carrying the feature keeps the tab with the module off, the routine
	 * state on Atomic.
	 *
	 * @dataProvider provide_wpcom_platform_sites
	 *
	 * @param array<string, mixed> $constants Constants that place the site on the platform.
	 */
	#[DataProvider( 'provide_wpcom_platform_sites' )]
	public function test_ads_dashboard_section_ignores_the_module_on_the_wpcom_platform( $constants ) {
		$this->set_admin_user();
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		$GLOBALS['jpa_test_wpcom_features'] = array( 'wordads' );

		register_default_dashboard_sections();

		$this->assertContains( 'analytics/ads', $this->available_section_ids() );
	}

	/**
	 * The constants that place a site on each half of the WPCOM platform.
	 *
	 * @return array<string, array{array<string, mixed>}>
	 */
	public static function provide_wpcom_platform_sites() {
		return array(
			'Simple' => array( array( 'IS_WPCOM' => true ) ),
			'Atomic' => array(
				array(
					'ATOMIC_SITE_ID'       => 123,
					'ATOMIC_CLIENT_ID'     => 456,
					'WPCOMSH__PLUGIN_FILE' => '/plugins/wpcomsh/wpcomsh.php',
				),
			),
		);
	}

	/**
	 * The availability filter can hide the Ads tab.
	 */
	public function test_ads_availability_filter_overrides_the_module_state() {
		$this->set_admin_user();
		add_filter( ADS_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

		register_default_dashboard_sections();

		$ads = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/ads' );

		$this->assertInstanceOf( Dashboard_Section::class, $ads );
		$this->assertFalse( $ads->is_available() );
		$this->assertNotContains( 'analytics/ads', $this->available_section_ids() );
	}

	/**
	 * A stats reader cannot access the Ads tab.
	 */
	public function test_omits_ads_dashboard_section_from_a_view_stats_reader() {
		$user_id = $this->set_editor_user();
		$this->grant_view_stats_to( $user_id );

		register_default_dashboard_sections();

		$ads = get_registered_dashboard_section( DASHBOARD_NAME, 'analytics/ads' );

		$this->assertFalse( $ads->is_available() );
		$this->assertNotContains( 'analytics/ads', $this->available_section_ids() );
	}

	/**
	 * The sections route drops the Subscribers tab once it is unavailable.
	 */
	public function test_sections_route_reflects_subscribers_availability() {
		$this->set_admin_user();

		register_default_dashboard_sections();

		$this->assertSame(
			array( 'traffic', 'insights', 'subscribers', 'ads' ),
			$this->request_section_slugs()
		);

		add_filter( SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_false' );

		$this->assertSame(
			array( 'traffic', 'insights', 'ads' ),
			$this->request_section_slugs()
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
					'id'                  => 'example/first',
					'slug'                => 'first',
					'label'               => 'First',
					'title'               => null,
					'order'               => 10,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
					'default_layout'      => array(),
				),
				array(
					'id'                  => 'example/later',
					'slug'                => 'later',
					'label'               => 'Later',
					'title'               => null,
					'order'               => 20,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
					'default_layout'      => array(),
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
			array( 'traffic', 'insights', 'subscribers', 'ads' ),
			array_column( $response->get_data(), 'slug' )
		);

		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/wpcom/v2/dashboards/' . DASHBOARD_NAME . '/sections' )
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array( 'traffic', 'insights', 'subscribers', 'store', 'ads' ),
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
					'id'                  => 'analytics/traffic',
					'slug'                => 'traffic',
					'label'               => 'Traffic',
					'title'               => null,
					'order'               => 10,
					'date_filter'         => 'range',
					'date_filter_options' => array(
						'with_date_comparison'     => true,
						'with_header_date_control' => true,
					),
					'requires_sync'       => false,
					'default_layout'      => array(
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
