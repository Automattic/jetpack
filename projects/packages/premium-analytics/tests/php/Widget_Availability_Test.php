<?php
/**
 * Tests for the widget type availability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/widget-availability.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\get_available_widget_types
 * @covers \Automattic\Jetpack\PremiumAnalytics\filter_widget_types_by_environment
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_widget_types_by_environment
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_widget_types_by_environment' )]
#[CoversClass( filter_widget_types_by_environment::class )]
#[CoversClass( get_available_widget_types::class )]
class Widget_Availability_Test extends BaseTestCase {

	/**
	 * In production, developer-only widget types are dropped while the rest
	 * pass through untouched.
	 */
	public function test_filter_removes_dev_only_widget_in_production() {
		// WorDBless reports the environment type as 'production' by default.
		$this->assertSame( 'production', wp_get_environment_type() );

		$widget_types = array(
			'jpa/react-query-dev-tool' => new Widget_Type( 'jpa/react-query-dev-tool' ),
			'jpa/hello-world'          => new Widget_Type( 'jpa/hello-world' ),
		);

		$filtered = filter_widget_types_by_environment( $widget_types );

		$this->assertArrayNotHasKey( 'jpa/react-query-dev-tool', $filtered, 'Developer-only widgets must be hidden in production.' );
		$this->assertArrayHasKey( 'jpa/hello-world', $filtered, 'Regular widgets remain available.' );
	}

	/**
	 * Verifies get_available_widget_types() runs the registry through the
	 * WIDGET_TYPES_FILTER so any callback can scope the visible set.
	 */
	public function test_get_available_widget_types_applies_filter() {
		$registry = Widget_Type_Registry::get_instance();
		$registry->register( 'test/sentinel' );

		$callback = static function ( $widget_types ) {
			unset( $widget_types['test/sentinel'] );
			return $widget_types;
		};
		add_filter( WIDGET_TYPES_FILTER, $callback );

		$available = get_available_widget_types();

		remove_filter( WIDGET_TYPES_FILTER, $callback );
		$registry->unregister( 'test/sentinel' );

		$this->assertArrayNotHasKey( 'test/sentinel', $available, 'A filter callback can remove a widget type from the available set.' );
	}
}
