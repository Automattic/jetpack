<?php
/**
 * Tests for the dashboard date format.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/date-format.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\dashboard_date_format
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_date_format_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\dashboard_date_format' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_date_format_script_data' )]
class Date_Format_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		delete_option( 'date_format' );
		remove_all_filters( 'date_formats' );
	}

	/**
	 * @dataProvider provide_formats
	 *
	 * @param string $site_format The site's `date_format` option.
	 * @param string $expected    The format the dashboard should use.
	 */
	#[DataProvider( 'provide_formats' )]
	public function test_script_data_keeps_presets_and_replaces_custom_formats( $site_format, $expected ) {
		update_option( 'date_format', $site_format );

		$data = inject_date_format_script_data( array( 'premium_analytics' => array( 'sections' => array() ) ) );

		$this->assertSame( array(), $data['premium_analytics']['sections'] );
		$this->assertSame( $expected, $data['premium_analytics']['date_format'] );
	}

	/**
	 * @return array<string, array{string, string}>
	 */
	public static function provide_formats() {
		return array(
			'locale default' => array( 'F j, Y', 'F j, Y' ),
			'preset'         => array( 'd/m/Y', 'd/m/Y' ),
			'WP 6.8 preset'  => array( 'd.m.Y', 'd.m.Y' ),
			'custom'         => array( 'd/m', 'F j, Y' ),
		);
	}

	public function test_a_preset_added_through_the_core_filter_is_kept() {
		update_option( 'date_format', 'j M Y' );
		add_filter(
			'date_formats',
			static function ( $formats ) {
				$formats[] = 'j M Y';
				return $formats;
			}
		);

		$this->assertSame( 'j M Y', dashboard_date_format() );
	}
}
