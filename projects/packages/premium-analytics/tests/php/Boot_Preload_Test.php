<?php
/**
 * Tests for the dashboard boot preload.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-modules.php';
require_once __DIR__ . '/../../src/dashboard-layout.php';
require_once __DIR__ . '/../../src/dashboard-sections.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';

/**
 * Tests for the dashboard boot preload.
 */
class Boot_Preload_Test extends BaseTestCase {
	use Widget_Manifest_Fixture_Trait;

	const PREFIX = 'jetpack-premium-analytics/routes/';

	/**
	 * Stage the route registry, two sections and their widget types.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_routes_file( __DIR__ . '/fixtures/boot-preload/registry.php' );
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );

		remove_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
		add_action( Dashboard_Section_Registry::REGISTER_ACTION, array( $this, 'register_sections' ) );
		add_filter( WIDGET_TYPES_FILTER, array( $this, 'widget_types' ) );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'boot_preload_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Restore the registries and request state.
	 */
	public function tear_down() {
		unset( $_GET['p'] );
		$this->set_routes_file( null );

		$instance = new \ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		remove_action( Dashboard_Section_Registry::REGISTER_ACTION, array( $this, 'register_sections' ) );
		add_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
		remove_filter( WIDGET_TYPES_FILTER, array( $this, 'widget_types' ) );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Register a traffic and a store section.
	 */
	public function register_sections() {
		register_dashboard_section(
			DASHBOARD_NAME,
			'test/traffic',
			array(
				'label'          => 'Traffic',
				'order'          => 1,
				'default_layout' => array( get_dashboard_default_widget_instance( 'a', 'test/chart', 1 ) ),
			)
		);
		register_dashboard_section(
			DASHBOARD_NAME,
			'test/store',
			array(
				'label'          => 'Store',
				'order'          => 2,
				'default_layout' => array( get_dashboard_default_widget_instance( 'b', 'test/orders', 1 ) ),
			)
		);
	}

	/**
	 * Widget types keyed by name, carrying only the fields the preload reads.
	 *
	 * @return object[]
	 */
	public function widget_types() {
		$types = array();
		foreach ( array( 'test/chart', 'test/orders', 'test/table' ) as $name ) {
			$types[ $name ] = (object) array(
				'widget_module' => $name . '/widget',
				'render_module' => $name . '/render',
			);
		}
		return $types;
	}

	/**
	 * Set the route registry path.
	 *
	 * @param string|null $path Registry path.
	 */
	private function set_routes_file( $path ) {
		$property = new \ReflectionProperty( Boot_Preload::class, 'routes_file' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $path );
	}

	/**
	 * The dependencies the generated page and widget-modules.php pass to the filter.
	 *
	 * @return array
	 */
	private function boot_dependencies() {
		$dependencies = array(
			array(
				'import' => 'static',
				'id'     => '@wordpress/boot',
			),
		);
		foreach ( array( 'dashboard', 'post-detail', 'reports' ) as $route ) {
			$dependencies[] = array(
				'import' => 'static',
				'id'     => self::PREFIX . $route . '/route',
			);
			$dependencies[] = array(
				'import' => 'dynamic',
				'id'     => self::PREFIX . $route . '/content',
			);
		}
		foreach ( array_keys( $this->widget_types() ) as $name ) {
			$dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $name . '/widget',
			);
			$dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $name . '/render',
			);
		}
		return $dependencies;
	}

	/**
	 * Filter the fixture dependencies and return the IDs imported statically.
	 *
	 * @param string|null $location The `p` query arg, or null for none.
	 * @return string[]
	 */
	private function static_ids( $location ) {
		if ( null !== $location ) {
			$_GET['p'] = $location;
		}

		$filtered = Boot_Preload::filter_boot_dependencies( $this->boot_dependencies() );
		$static   = array_filter(
			$filtered,
			static function ( $dependency ) {
				return 'static' === $dependency['import'];
			}
		);

		return array_values( wp_list_pluck( $static, 'id' ) );
	}

	/**
	 * The dashboard preloads its own modules and the first section's default widgets.
	 */
	public function test_dashboard_preloads_its_route_and_default_widgets() {
		$this->assertSame(
			array(
				'@wordpress/boot',
				self::PREFIX . 'dashboard/route',
				self::PREFIX . 'dashboard/content',
				'test/chart/widget',
				'test/chart/render',
			),
			$this->static_ids( null )
		);
	}

	/**
	 * The `section` param picks the section whose widgets preload; the router JSON-encodes it.
	 */
	public function test_dashboard_preloads_the_requested_section() {
		$ids = $this->static_ids( '/?section=%22store%22&from=%222026-01-01%22' );

		$this->assertContains( 'test/orders/render', $ids );
		$this->assertNotContains( 'test/chart/render', $ids );
	}

	/**
	 * A customized layout wins over the section default.
	 */
	public function test_dashboard_preloads_the_stored_layout() {
		global $wpdb;
		update_user_meta(
			get_current_user_id(),
			$wpdb->get_blog_prefix() . 'persisted_preferences',
			array(
				Enablement_Setting::PREFERENCES_SCOPE => array(
					'dashboardSectionLayouts' => array(
						'traffic' => array( get_dashboard_default_widget_instance( 'c', 'test/table', 1 ) ),
					),
				),
			)
		);

		$ids = $this->static_ids( '/' );

		$this->assertContains( 'test/table/widget', $ids );
		$this->assertNotContains( 'test/chart/widget', $ids );
	}

	/**
	 * A detail route preloads its own modules, and no dashboard widgets.
	 */
	public function test_detail_route_preloads_only_its_own_modules() {
		$this->assertSame(
			array(
				'@wordpress/boot',
				self::PREFIX . 'post-detail/route',
				self::PREFIX . 'post-detail/content',
			),
			$this->static_ids( '/post/12?from=%222026-01-01%22' )
		);
	}

	/**
	 * A location matching no route leaves the dependencies as the page built them.
	 */
	public function test_unknown_location_leaves_dependencies_untouched() {
		$_GET['p'] = '/post';

		$this->assertSame( $this->boot_dependencies(), Boot_Preload::filter_boot_dependencies( $this->boot_dependencies() ) );
	}
}
