<?php

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::jetpack_googlemaps_shortcode
 */
#[CoversFunction( 'jetpack_googlemaps_shortcode' )]
class Jetpack_Shortcodes_Googlemaps_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_googlemaps_exists() {
		$this->assertTrue( shortcode_exists( 'googlemaps' ) );
	}

	/**
	 * Gets the test data for test_shortcodes_googlemaps().
	 *
	 * @return array The test data.
	 */
	public static function get_shortcode_googlemaps_data() {
		return array(
			'non_amp'         => array(
				'[googlemaps https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA&amp;w=640&amp;h=480]',
				true,
				'<div class="googlemaps"><iframe width="640" height="480" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" sandbox="allow-popups allow-scripts allow-same-origin" src="https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA"></iframe></div>',
			),
			'amp'             => array(
				'[googlemaps https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA&amp;w=640&amp;h=480]',
				false,
				'<div class="googlemaps"><iframe width="640" height="480" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA"></iframe></div>',
			),
			'align_attribute' => array(
				'[googlemaps https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA align="center"]',
				false,
				'<div class="googlemaps aligncenter"><iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA"></iframe></div>',
			),
		);
	}

	/**
	 * Test the shortcode output.
	 *
	 * @dataProvider get_shortcode_googlemaps_data
	 * @author scotchfield
	 * @since 3.2
	 *
	 * @param string $shortcode The shortcode to render.
	 * @param bool   $is_amp    Whether this is an AMP endpoint.
	 * @param string $expected  The expected rendered shortcode.
	 */
	#[DataProvider( 'get_shortcode_googlemaps_data' )]
	public function test_shortcodes_googlemaps( $shortcode, $is_amp, $expected ) {
		if ( $is_amp && defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com is in the process of removing AMP plugin.' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		if ( $is_amp ) {
			add_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		$actual = preg_replace( '/\s+/', ' ', do_shortcode( $shortcode ) );
		$actual = preg_replace( '/(?<=>)\s+(?=<)/', '', trim( $actual ) );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * A URL-encoded ampersand (`%26`) inside a query value — e.g. a place
	 * name like "Hotel & Spa" — must survive the shortcode round-trip
	 * intact, otherwise Google's API treats the decoded `&` as a query
	 * separator and the embed 400s.
	 */
	public function test_shortcodes_googlemaps_preserves_encoded_ampersand_in_value() {
		$shortcode = '[googlemaps https://maps.google.com/maps?q=The%20Westin%20Doha%20Hotel%20%26%20Spa]';
		$rendered  = do_shortcode( $shortcode );

		$this->assertStringContainsString(
			'src="https://maps.google.com/maps?q=The%20Westin%20Doha%20Hotel%20%26%20Spa"',
			$rendered
		);
		$this->assertStringNotContainsString( 'Hotel%20&amp;%20Spa', $rendered );
		$this->assertStringNotContainsString( 'Hotel & Spa', $rendered );
	}

	/**
	 * An HTML-entity-encoded ampersand (`&amp;`) inside a query value should
	 * survive too. The lines that normalize `&amp;` separators must not split
	 * the value, and the rebuilt URL must encode the `&` as `%26`.
	 *
	 * @return void
	 */
	public function test_shortcodes_googlemaps_preserves_entity_encoded_ampersand_in_value() {
		$shortcode = '[googlemaps https://maps.google.com/maps?q=Hotel%20&amp;%20Spa]';
		$rendered  = do_shortcode( $shortcode );

		$this->assertStringContainsString(
			'src="https://maps.google.com/maps?q=Hotel%20%26%20Spa"',
			$rendered
		);
		$this->assertStringNotContainsString( 'Hotel%20&amp;%20Spa', $rendered );
	}

	/**
	 * A URL-encoded `#` (`%23`) in a value must stay encoded, otherwise the
	 * browser treats it as a fragment marker and drops the rest of the query.
	 *
	 * @return void
	 */
	public function test_shortcodes_googlemaps_preserves_encoded_hash_in_value() {
		$shortcode = '[googlemaps https://maps.google.com/maps?q=Schmidt%27s%20%231%20Pizza]';
		$rendered  = do_shortcode( $shortcode );

		$this->assertStringContainsString(
			'src="https://maps.google.com/maps?q=Schmidt%27s%20%231%20Pizza"',
			$rendered
		);
		$this->assertStringNotContainsString( '#1', $rendered );
	}

	/**
	 * A URL-encoded literal `%` (`%25`) must stay encoded so a value like
	 * "50% off" doesn't decay into an invalid percent escape.
	 *
	 * @return void
	 */
	public function test_shortcodes_googlemaps_preserves_encoded_percent_in_value() {
		$shortcode = '[googlemaps https://maps.google.com/maps?q=50%25%20off%20deals]';
		$rendered  = do_shortcode( $shortcode );

		$this->assertStringContainsString(
			'src="https://maps.google.com/maps?q=50%25%20off%20deals"',
			$rendered
		);
	}

	/**
	 * A `+` in a query value (form-urlencoded shorthand for a space) and a
	 * URL-encoded literal `+` (`%2B`) must round-trip to a URL Google's API
	 * still understands — i.e. spaces and pluses must be preserved as
	 * distinct characters.
	 *
	 * @return void
	 */
	public function test_shortcodes_googlemaps_distinguishes_plus_and_encoded_plus() {
		$shortcode = '[googlemaps https://maps.google.com/maps?q=C%2B%2B+Conference]';
		$rendered  = do_shortcode( $shortcode );

		// The two literal `+` chars must remain encoded as `%2B`, and the
		// space (`+` in form-urlencoded) must be encoded as `%20` or stay `+`.
		$this->assertMatchesRegularExpression(
			'@src="https://maps\.google\.com/maps\?q=C%2B%2B(\+|%20)Conference"@',
			$rendered
		);
	}

	/**
	 * The existing `mid` value contains a literal `.` — verify the dot in a
	 * value is not corrupted by parse_str() key mangling or by any rebuild
	 * encoding step.
	 *
	 * @return void
	 */
	public function test_shortcodes_googlemaps_preserves_dot_in_value() {
		$shortcode = '[googlemaps https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA]';
		$rendered  = do_shortcode( $shortcode );

		$this->assertStringContainsString(
			'src="https://mapsengine.google.com/map/embed?mid=zbBhkou4wwtE.kUmp8K6QJ7SA"',
			$rendered
		);
	}
}
