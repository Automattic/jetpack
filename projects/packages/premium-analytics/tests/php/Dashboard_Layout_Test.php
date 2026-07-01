<?php
/**
 * Tests for the dashboard default layout.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-layout.php';

/**
 * Tests for the dashboard default layout.
 *
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_layout_for
 * @covers ::Automattic\Jetpack\PremiumAnalytics\seed_default_dashboard_layout
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_layout_for' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\seed_default_dashboard_layout' )]
class Dashboard_Layout_Test extends BaseTestCase {

	/**
	 * The bundled dashboard layout includes the Clicks widget defaults.
	 */
	public function test_default_layout_includes_clicks_widget() {
		$layout = get_dashboard_default_layout_for( DASHBOARD_NAME );
		$clicks = $this->find_widget_by_uuid( $layout, 'default-clicks-widget-instance' );

		$this->assertIsArray( $clicks );
		$this->assertSame( 'jpa/clicks', $clicks['type'] );
		$this->assertSame( array( 'max' => 10 ), $clicks['attributes'] );
		$this->assertSame(
			array(
				'width'  => 1,
				'height' => 2,
				'order'  => 2,
			),
			$clicks['placement']
		);
	}

	/**
	 * Finds a widget in the layout by UUID.
	 *
	 * @param array  $layout Layout entries.
	 * @param string $uuid   Widget UUID.
	 * @return array|null Matching widget entry.
	 */
	private function find_widget_by_uuid( $layout, $uuid ) {
		foreach ( $layout as $widget ) {
			if ( isset( $widget['uuid'] ) && $uuid === $widget['uuid'] ) {
				return $widget;
			}
		}

		return null;
	}
}
