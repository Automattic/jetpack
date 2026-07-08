<?php
/**
 * Tests for the CSV export Report_Registry.
 *
 * Uses fixture controllers rather than concrete report controllers so the registry
 * (part of the export pipeline library) can be tested on its own.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/fixtures/class-fake-report-controller.php';
require_once __DIR__ . '/fixtures/class-fake-merge-controller.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Registry
 */
#[CoversClass( Report_Registry::class )]
class ReportRegistry_Test extends TestCase {

	/**
	 * A fresh registry for each test.
	 *
	 * @var Report_Registry
	 */
	private $registry;

	/**
	 * Fresh registry for each test.
	 *
	 * @before
	 */
	#[Before]
	public function reset_registry() {
		$this->registry = new Report_Registry();
	}

	public function test_register_controller_is_idempotent() {
		$controller = new Fake_Report_Controller( $this->registry );

		$this->assertTrue( $this->registry->register_controller( $controller ) );
		$this->assertTrue( $this->registry->is_registered( 'fakereport' ) );
		// Second registration of the same key is refused.
		$this->assertFalse( $this->registry->register_controller( $controller ) );
	}

	public function test_get_registered_reports_lists_keys() {
		$this->registry->register_controller( new Fake_Report_Controller( $this->registry ) );
		$this->registry->register_controller( new Fake_Merge_Controller( $this->registry ) );

		$this->assertEqualsCanonicalizing(
			array( 'fakereport', 'fakemerge' ),
			$this->registry->get_registered_reports()
		);
	}

	public function test_delegated_getters_return_controller_values() {
		$this->registry->register_controller( new Fake_Report_Controller( $this->registry ) );

		$this->assertSame( 'reports/fake-report', $this->registry->get_data_endpoint( 'fakereport' ) );
		$this->assertSame( 'Fake Report', $this->registry->get_label( 'fakereport' ) );
		$this->assertSame( 1000, $this->registry->get_batch_limit( 'fakereport' ) );
		$this->assertIsCallable( $this->registry->get_row_formatter( 'fakereport' ) );
	}

	public function test_get_columns_appends_comparison_columns_when_requested() {
		$this->registry->register_controller( new Fake_Report_Controller( $this->registry ) );

		$base = $this->registry->get_columns( 'fakereport' );
		$this->assertArrayHasKey( 'count', $base );
		$this->assertArrayNotHasKey( 'comparison_count', $base );

		$with_comparison = $this->registry->get_columns( 'fakereport', true );
		$this->assertArrayHasKey( 'count', $with_comparison );
		$this->assertArrayHasKey( 'comparison_count', $with_comparison );
		$this->assertStringContainsString( 'Previous Period', $with_comparison['comparison_count'] );
	}

	public function test_unknown_report_returns_wp_error() {
		$this->assertWPError( $this->registry->get_controller( 'nope' ) );
		$this->assertWPError( $this->registry->get_data_endpoint( 'nope' ) );
		$this->assertWPError( $this->registry->get_columns( 'nope' ) );
		$this->assertWPError( $this->registry->get_label( 'nope' ) );
		$this->assertWPError( $this->registry->get_batch_limit( 'nope' ) );
		$this->assertWPError( $this->registry->get_row_formatter( 'nope' ) );
	}

	/**
	 * Assert a value is a WP_Error with the invalid_report_type code.
	 *
	 * @param mixed $value The value to check.
	 */
	private function assertWPError( $value ) {
		$this->assertInstanceOf( \WP_Error::class, $value );
		$this->assertSame( 'invalid_report_type', $value->get_error_code() );
	}
}
