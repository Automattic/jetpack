<?php
/**
 * Tests for the dashboard layout defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-layout.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\seed_default_dashboard_layout
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\seed_default_dashboard_layout' )]
class Dashboard_Layout_Test extends BaseTestCase {

	/**
	 * The bundled dashboard layout includes the File Downloads widget.
	 */
	public function test_seed_default_dashboard_layout_adds_file_downloads_widget() {
		$layout = seed_default_dashboard_layout( array(), DASHBOARD_NAME );
		$widget = $this->find_widget_by_uuid( $layout, 'default-file-downloads-widget-instance' );

		$this->assertNotNull( $widget, 'The default layout should include File Downloads.' );
		$this->assertSame( 'jpa/file-downloads', $widget['type'] );
		$this->assertSame( array( 'max' => 10 ), $widget['attributes'] );
		$this->assertSame(
			array(
				'width'  => 1,
				'height' => 2,
				'order'  => 2,
			),
			$widget['placement']
		);
	}

	/**
	 * Existing File Downloads instances are preserved rather than duplicated.
	 */
	public function test_seed_default_dashboard_layout_does_not_duplicate_file_downloads_widget() {
		$existing_widget = array(
			'uuid'       => 'default-file-downloads-widget-instance',
			'type'       => 'jpa/file-downloads',
			'attributes' => array( 'max' => 5 ),
			'placement'  => array(
				'width'  => 2,
				'height' => 1,
				'order'  => 9,
			),
		);

		$layout  = seed_default_dashboard_layout( array( $existing_widget ), DASHBOARD_NAME );
		$matches = array();
		foreach ( $layout as $widget ) {
			if ( 'default-file-downloads-widget-instance' === ( $widget['uuid'] ?? '' ) ) {
				$matches[] = $widget;
			}
		}

		$this->assertCount( 1, $matches );
		$this->assertSame( $existing_widget, $matches[0] );
	}

	/**
	 * Finds a widget instance by UUID.
	 *
	 * @param array  $layout Dashboard layout entries.
	 * @param string $uuid   Widget instance UUID.
	 * @return array|null Matching widget instance, if present.
	 */
	private function find_widget_by_uuid( array $layout, $uuid ) {
		foreach ( $layout as $widget ) {
			if ( $uuid === ( $widget['uuid'] ?? '' ) ) {
				return $widget;
			}
		}

		return null;
	}
}
