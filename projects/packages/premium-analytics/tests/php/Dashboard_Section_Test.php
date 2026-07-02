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

		parent::tear_down();
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
			'traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 15,
				'default_layout' => $layout,
			)
		);

		$this->assertInstanceOf( Dashboard_Section::class, $section );
		$this->assertSame( $section, $registry->get_registered( 'example_dashboard', 'traffic' ) );
		$this->assertSame( 'example_dashboard', $section->dashboard_name );
		$this->assertSame( 'traffic', $section->id );
		$this->assertSame( 'Traffic', $section->label );
		$this->assertSame( 15, $section->order );
		$this->assertSame( $layout, $section->get_default_layout() );
	}

	/**
	 * Dashboard names must match the REST route grammar.
	 */
	public function test_rejects_dashboard_names_without_underscores() {
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$registry = new Dashboard_Section_Registry();
		$section  = $registry->register(
			'analytics',
			'traffic',
			array(
				'label' => 'Traffic',
				'order' => 10,
			)
		);

		remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$this->assertFalse( $section );
		$this->assertNull( $registry->get_registered( 'analytics', 'traffic' ) );
	}

	/**
	 * Available sections are ordered and unavailable sections are omitted.
	 */
	public function test_registry_returns_available_sections_sorted_by_order() {
		$registry = new Dashboard_Section_Registry();

		$registry->register(
			'ordered_dashboard',
			'later',
			array(
				'label' => 'Later',
				'order' => 20,
			)
		);
		$registry->register(
			'ordered_dashboard',
			'unavailable',
			array(
				'label'        => 'Unavailable',
				'order'        => 5,
				'is_available' => '__return_false',
			)
		);
		$registry->register(
			'ordered_dashboard',
			'first',
			array(
				'label' => 'First',
				'order' => 10,
			)
		);

		$this->assertSame(
			array( 'first', 'later' ),
			array_map(
				static function ( Dashboard_Section $section ) {
					return $section->id;
				},
				$registry->get_available_sections( 'ordered_dashboard' )
			)
		);
	}

	/**
	 * The global helper registers sections in the singleton registry.
	 */
	public function test_global_register_dashboard_section_registers_with_singleton() {
		$section = register_dashboard_section(
			'helper_dashboard',
			'insights',
			array(
				'label' => 'Insights',
				'order' => 10,
			)
		);

		$this->assertSame( $section, get_registered_dashboard_section( 'helper_dashboard', 'insights' ) );
	}

	/**
	 * Built-in Premium Analytics sections are registered in the expected order.
	 */
	public function test_registers_built_in_dashboard_sections() {
		register_default_dashboard_sections();

		$this->assertSame(
			array(
				array(
					'id'    => 'traffic',
					'label' => 'Traffic',
					'order' => 10,
				),
				array(
					'id'    => 'insights',
					'label' => 'Insights',
					'order' => 20,
				),
				array(
					'id'    => 'subscribers',
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
	 * Sections route returns available sections.
	 */
	public function test_sections_route_returns_available_sections_sorted_by_order() {
		register_dashboard_section(
			'route_sections_dashboard',
			'later',
			array(
				'label' => 'Later',
				'order' => 20,
			)
		);
		register_dashboard_section(
			'route_sections_dashboard',
			'unavailable',
			array(
				'label'        => 'Unavailable',
				'order'        => 5,
				'is_available' => '__return_false',
			)
		);
		register_dashboard_section(
			'route_sections_dashboard',
			'first',
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
					'id'    => 'first',
					'label' => 'First',
					'order' => 10,
				),
				array(
					'id'    => 'later',
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
			'traffic',
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
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_layout_dashboard/sections/traffic/default-layout' )
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
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_layout_dashboard/sections/missing/default-layout' )
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
			'insights',
			array(
				'label'        => 'Insights',
				'order'        => 10,
				'is_available' => '__return_false',
			)
		);

		$this->set_admin_user();

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack/v4/dashboards/route_unavailable_dashboard/sections/insights/default-layout' )
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
