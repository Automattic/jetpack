<?php
/**
 * Tests for Formatter_Registry.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Formatters\Formatter_Registry
 */
#[CoversClass( Formatter_Registry::class )]
class Formatter_Registry_Test extends BaseTestCase {

	public function test_returns_the_area_formatter_for_a_registered_endpoint() {
		$formatter = Formatter_Registry::for_endpoint( 'stats/top-posts' );

		$this->assertInstanceOf( Stats_Formatter::class, $formatter );
		$this->assertInstanceOf( Widget_Formatter::class, $formatter );
	}

	public function test_resolves_the_area_from_the_first_segment_regardless_of_sub_path() {
		// Any resource under a registered area resolves to that area's formatter.
		$this->assertInstanceOf( Stats_Formatter::class, Formatter_Registry::for_endpoint( 'stats/visits' ) );
		// The bare area (no resource) resolves too.
		$this->assertInstanceOf( Stats_Formatter::class, Formatter_Registry::for_endpoint( 'stats' ) );
	}

	public function test_ignores_surrounding_slashes_when_resolving_the_area() {
		$this->assertInstanceOf( Stats_Formatter::class, Formatter_Registry::for_endpoint( '/stats/top-posts/' ) );
	}

	public function test_returns_null_for_an_unregistered_area() {
		$this->assertNull( Formatter_Registry::for_endpoint( 'reports/totals' ) );
	}

	public function test_returns_null_for_an_empty_endpoint() {
		$this->assertNull( Formatter_Registry::for_endpoint( '' ) );
		$this->assertNull( Formatter_Registry::for_endpoint( '/' ) );
	}
}
