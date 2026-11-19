<?php
/**
 * Tests for the default date format script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/date-format.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_date_format_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_date_format_script_data' )]
class Date_Format_Test extends TestCase {

	public function test_script_data_adds_the_locale_default_beside_existing_keys() {
		$data = inject_date_format_script_data( array( 'premium_analytics' => array( 'sections' => array() ) ) );

		$this->assertSame( array(), $data['premium_analytics']['sections'] );
		$this->assertSame( 'F j, Y', $data['premium_analytics']['default_date_format'] );
	}
}
