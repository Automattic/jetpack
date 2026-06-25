<?php
/**
 * Tests for Premium Analytics dashboard layout defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use WorDBless\BaseTestCase;
use WP_REST_Server;

require_once __DIR__ . '/../../src/dashboard-layout.php';
require_once __DIR__ . '/../../src/dashboard-sections.php';

/**
 * Tests for dashboard layout defaults.
 */
class Dashboard_Layout_Test extends BaseTestCase {

	/**
	 * Set up a fresh REST server for route registration checks.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );
	}

	/**
	 * Fresh users receive the flat layout and section layouts.
	 */
	public function test_fresh_user_gets_dashboard_and_section_layout_defaults() {
		$preferences = $this->get_preferences_for_fresh_user();
		$scope       = $preferences[ DASHBOARD_LAYOUT_SCOPE ];

		$this->assertSame( 'jpa/hello-world', $scope[ DASHBOARD_LAYOUT_KEY ][0]['type'] );
		$this->assertSame( 'jpa/stats-top-posts', $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ]['traffic'][0]['type'] );
		$this->assertSame( array(), $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ]['insights'] );
		$this->assertSame( array(), $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ]['subscribers'] );
		$this->assertSame( array(), $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ]['store'] );
	}

	/**
	 * A customized flat layout does not suppress section layout defaults.
	 */
	public function test_customized_dashboard_layout_is_preserved_while_section_layouts_are_seeded() {
		$user_id       = $this->create_user();
		$custom_layout = array(
			array(
				'uuid' => 'custom-dashboard-widget',
				'type' => 'jpa/custom',
			),
		);

		update_user_meta(
			$user_id,
			$this->preferences_meta_key(),
			array(
				DASHBOARD_LAYOUT_SCOPE => array(
					DASHBOARD_LAYOUT_KEY => $custom_layout,
				),
			)
		);

		$preferences = get_user_meta( $user_id, $this->preferences_meta_key(), true );
		$scope       = $preferences[ DASHBOARD_LAYOUT_SCOPE ];

		$this->assertSame( $custom_layout, $scope[ DASHBOARD_LAYOUT_KEY ] );
		$this->assertSame( 'jpa/stats-top-posts', $scope[ DASHBOARD_SECTION_LAYOUTS_KEY ]['traffic'][0]['type'] );
	}

	/**
	 * Existing section layout maps are never overwritten by bundled defaults.
	 */
	public function test_existing_section_layouts_are_preserved() {
		$user_id                = $this->create_user();
		$custom_section_layouts = array(
			'traffic'  => array(
				array(
					'uuid' => 'custom-traffic-widget',
					'type' => 'jpa/custom-traffic',
				),
			),
			'insights' => array(),
		);

		update_user_meta(
			$user_id,
			$this->preferences_meta_key(),
			array(
				DASHBOARD_LAYOUT_SCOPE => array(
					DASHBOARD_SECTION_LAYOUTS_KEY => $custom_section_layouts,
				),
			)
		);

		$preferences = get_user_meta( $user_id, $this->preferences_meta_key(), true );

		$this->assertSame(
			$custom_section_layouts,
			$preferences[ DASHBOARD_LAYOUT_SCOPE ][ DASHBOARD_SECTION_LAYOUTS_KEY ]
		);
	}

	/**
	 * Section layouts preserve explicit empty arrays and normalize widget arrays.
	 */
	public function test_section_layouts_preserve_empty_arrays_and_normalize_widget_arrays() {
		$filter = static function () {
			return array(
				'traffic'  => array(
					'custom-key' => array(
						'uuid' => 'custom-top-posts',
						'type' => 'jpa/stats-top-posts',
					),
				),
				'insights' => array(),
				''         => array(),
				'store'    => 'not-a-layout',
			);
		};

		add_filter( DASHBOARD_SECTION_LAYOUTS_FILTER, $filter, 20, 2 );
		try {
			$layouts = get_dashboard_section_layouts_for( DASHBOARD_NAME );
		} finally {
			remove_filter( DASHBOARD_SECTION_LAYOUTS_FILTER, $filter, 20 );
		}

		$this->assertSame( array( 'traffic', 'insights' ), array_keys( $layouts ) );
		$this->assertSame( 'custom-top-posts', $layouts['traffic'][0]['uuid'] );
		$this->assertSame( array(), $layouts['insights'] );
	}

	/**
	 * Section default resolution returns bundled section defaults when present.
	 */
	public function test_section_default_layout_resolver_returns_section_defaults() {
		$traffic_layout = get_dashboard_section_default_layout_for( DASHBOARD_NAME, 'traffic' );

		$this->assertSame( 'jpa/stats-top-posts', $traffic_layout[0]['type'] );
		$this->assertSame( array(), get_dashboard_section_default_layout_for( DASHBOARD_NAME, 'insights' ) );
		$this->assertSame( array(), get_dashboard_section_default_layout_for( DASHBOARD_NAME, 'subscribers' ) );
		$this->assertSame( array(), get_dashboard_section_default_layout_for( DASHBOARD_NAME, 'store' ) );
	}

	/**
	 * Unknown sections fall back to the flat dashboard default.
	 */
	public function test_section_default_layout_resolver_falls_back_for_unknown_sections() {
		$layout = get_dashboard_section_default_layout_for( DASHBOARD_NAME, 'unknown' );

		$this->assertSame( 'jpa/hello-world', $layout[0]['type'] );
	}

	/**
	 * Section default route is registered.
	 */
	public function test_section_default_layout_route_is_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/jetpack/v4/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)+)/sections/(?P<section>[a-z][a-z0-9-]*)/default-layout',
			$routes
		);
	}

	/**
	 * Reads persisted preferences for a new user.
	 *
	 * @return array Persisted preferences.
	 */
	private function get_preferences_for_fresh_user() {
		return get_user_meta( $this->create_user(), $this->preferences_meta_key(), true );
	}

	/**
	 * Creates a unique test user.
	 *
	 * @return int User ID.
	 */
	private function create_user() {
		return wp_insert_user(
			array(
				'user_login' => 'jpa_dashboard_layout_' . wp_generate_uuid4(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Gets the current blog's persisted preferences meta key.
	 *
	 * @global \wpdb $wpdb WordPress database abstraction object.
	 *
	 * @return string Meta key.
	 */
	private function preferences_meta_key() {
		global $wpdb;

		return $wpdb->get_blog_prefix() . 'persisted_preferences';
	}
}
