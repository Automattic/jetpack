<?php
/**
 * Tests for the widget type availability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/widget-availability.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types' )]
class Widget_Availability_Test extends BaseTestCase {

	/**
	 * Candidate set shaped like the build manifest entries.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function widget_candidates() {
		return array(
			array( 'name' => 'jpa/react-query-dev-tool' ),
			array( 'name' => 'jpa/hello-world' ),
		);
	}

	/**
	 * In production, developer-only candidates are dropped; the rest pass through.
	 */
	public function test_dev_only_widget_removed_in_production() {
		$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), 'production' ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'Developer-only widgets must be hidden in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Outside production, candidates pass through (covers the non-production branch).
	 */
	public function test_dev_only_widget_kept_outside_production() {
		foreach ( array( 'local', 'development', 'staging' ) as $environment ) {
			$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), $environment ), 'name' );

			$this->assertContains( 'jpa/react-query-dev-tool', $names, "Developer-only widgets must remain available in the {$environment} environment." );
			$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
		}
	}

	/**
	 * The registry-time callback reads the env (production by default) and drops
	 * the developer-only candidate.
	 */
	public function test_registry_filter_callback_drops_dev_widget_by_default() {
		$this->assertSame( 'production', wp_get_environment_type() );

		$names = array_column( filter_registrable_widget_types_by_environment( $this->widget_candidates() ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'The registry-time callback must drop the developer widget in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Reading the available set runs the registry through WIDGET_TYPES_FILTER.
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
