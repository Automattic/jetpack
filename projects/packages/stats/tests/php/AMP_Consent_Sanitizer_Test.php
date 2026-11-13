<?php
/**
 * Tests AMP_Consent_Sanitizer class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class to test the AMP_Consent_Sanitizer class.
 *
 * @covers \Automattic\Jetpack\Stats\AMP_Consent_Sanitizer
 */
#[CoversClass( AMP_Consent_Sanitizer::class )]
class AMP_Consent_Sanitizer_Test extends StatsBaseTestCase {

	/**
	 * Pages with and without an `amp-consent`, and the pixels each should keep.
	 *
	 * @return array
	 */
	public static function pages() {
		$stats_pixel = '<amp-pixel data-block-on-consent src="' . Tracking_Pixel::AMP_PIXEL_URL . '?v=ext&amp;blog=1"></amp-pixel>';
		$other_pixel = '<amp-pixel src="https://example.com/p.gif"></amp-pixel>';

		return array(
			'banner on the page'                   => array(
				'<amp-consent id="c" layout="nodisplay"></amp-consent>' . $stats_pixel . $other_pixel,
				array( Tracking_Pixel::AMP_PIXEL_URL . '?v=ext&blog=1', 'https://example.com/p.gif' ),
			),
			'no banner on the page'                => array(
				$stats_pixel . $other_pixel,
				array( 'https://example.com/p.gif' ),
			),
			'no banner, two adjacent Stats pixels' => array(
				$stats_pixel . $stats_pixel . $other_pixel,
				array( 'https://example.com/p.gif' ),
			),
		);
	}

	/**
	 * @dataProvider pages
	 *
	 * @param string   $body     Body markup.
	 * @param string[] $expected Pixel sources left after sanitizing.
	 */
	#[DataProvider( 'pages' )]
	public function test_keeps_the_stats_pixel_only_with_an_amp_consent( $body, $expected ) {
		require_once __DIR__ . '/mocks/class-amp-base-sanitizer.php';

		$dom = new \DOMDocument();
		$dom->loadHTML( "<html><body>$body</body></html>", LIBXML_NOERROR );

		// @phan-suppress-next-line PhanTypeMismatchArgument -- The AMP stub types $dom as an unresolved `Document`, AMP's DOMDocument subclass.
		( new AMP_Consent_Sanitizer( $dom ) )->sanitize();

		$sources = array();
		foreach ( $dom->getElementsByTagName( 'amp-pixel' ) as $pixel ) {
			$sources[] = $pixel->getAttribute( 'src' );
		}
		$this->assertSame( $expected, $sources );
	}
}
