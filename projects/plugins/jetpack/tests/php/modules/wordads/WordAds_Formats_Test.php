<?php

require __DIR__ . '/../../../../modules/wordads/php/class-wordads-formats.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Test WordAds_Formats.
 *
 * @covers \WordAds_Formats
 */
#[CoversClass( WordAds_Formats::class )]
class WordAds_Formats_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Gets the test data for test_get_format_slug().
	 *
	 * @return array The test data.
	 */
	public static function get_format_data() {
		return array(
			'gutenberg_rectangle'          => array(
				300,
				250,
				'gutenberg_rectangle',
			),
			'gutenberg_leaderboard'        => array(
				728,
				90,
				'gutenberg_leaderboard',
			),
			'gutenberg_mobile_leaderboard' => array(
				320,
				50,
				'gutenberg_mobile_leaderboard',
			),
			'gutenberg_skyscraper'         => array(
				160,
				600,
				'gutenberg_skyscraper',
			),
			'unknown_format'               => array(
				400,
				300,
				'',
			),
		);
	}

	/**
	 * Test the widget method that outputs the markup.
	 *
	 * @dataProvider get_format_data
	 * @param int    $width The block's width.
	 * @param int    $height The block's height.
	 * @param string $expected The expected format slug.
	 */
	#[DataProvider( 'get_format_data' )]
	public function test_get_format_slug( int $width, int $height, string $expected ): void {
		$this->assertEquals(
			$expected,
			WordAds_Formats::get_format_slug( $width, $height )
		);
	}
}
