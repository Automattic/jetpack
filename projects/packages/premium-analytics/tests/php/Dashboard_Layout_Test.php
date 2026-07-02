<?php
/**
 * Tests for Premium Analytics dashboard layout defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-layout.php';

/**
 * Tests for Premium Analytics dashboard layout defaults.
 */
class Dashboard_Layout_Test extends TestCase {

	/**
	 * Non-Premium-Analytics dashboards are left untouched.
	 */
	public function test_seed_default_dashboard_layout_ignores_other_dashboards() {
		$layout = array(
			array(
				'uuid' => 'existing-widget',
				'type' => 'example/widget',
			),
		);

		$this->assertSame( $layout, seed_default_dashboard_layout( $layout, 'other_dashboard' ) );
	}

	/**
	 * The Premium Analytics dashboard receives the bundled default widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_utm_insights_widget() {
		$layout          = seed_default_dashboard_layout( array(), DASHBOARD_NAME );
		$layout_by_uuid  = array_column( $layout, null, 'uuid' );
		$utm_widget_uuid = 'default-utm-insights-widget-instance';

		$this->assertArrayHasKey( 'default-hello-world-widget-instance', $layout_by_uuid );
		$this->assertArrayHasKey( 'default-locations-widget-instance', $layout_by_uuid );
		$this->assertArrayHasKey( $utm_widget_uuid, $layout_by_uuid );

		$this->assertSame(
			array(
				'uuid'       => $utm_widget_uuid,
				'type'       => 'jpa/utm-insights',
				'attributes' => array(
					'utmParam' => 'utm_source,utm_medium',
					'max'      => 10,
				),
				'placement'  => array(
					'width'  => 1,
					'height' => 2,
					'order'  => 5,
				),
			),
			$layout_by_uuid[ $utm_widget_uuid ]
		);
	}

	/**
	 * An existing UTM Insights default instance is not duplicated.
	 */
	public function test_seed_default_dashboard_layout_does_not_duplicate_utm_insights_widget() {
		$existing_utm_widget = array(
			'uuid' => 'default-utm-insights-widget-instance',
			'type' => 'jpa/utm-insights',
		);

		$layout      = seed_default_dashboard_layout( array( $existing_utm_widget ), DASHBOARD_NAME );
		$utm_widgets = array_filter(
			$layout,
			static function ( $widget ) {
				return 'default-utm-insights-widget-instance' === $widget['uuid'];
			}
		);

		$this->assertCount( 1, $utm_widgets );
	}
}
