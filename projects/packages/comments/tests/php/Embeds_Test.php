<?php
/**
 * Tests for Embeds.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Embeds
 */
#[CoversClass( Embeds::class )]
class Embeds_Test extends BaseTestCase {

	/**
	 * @dataProvider provide_sanitize_html
	 */
	#[DataProvider( 'provide_sanitize_html' )]
	public function test_sanitize_html( $html, $expected ) {
		$this->assertSame( $expected, Embeds::sanitize_html( $html ) );
	}

	public static function provide_sanitize_html() {
		return array(
			'iframe keeps listed attributes' => array( '<iframe src="https://a.test/v" width="10" onload="x()" style="a"></iframe>', '<iframe src="https://a.test/v" width="10"></iframe>' ),
			'protocol-relative src'          => array( '<img src="//a.test/i.png" alt="a">', '<img alt="a" src="https://a.test/i.png">' ),
			'script is dropped'              => array( '<script src="https://a.test/s.js"></script>', '' ), // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			'javascript src is dropped'      => array( '<iframe src="javascript:alert(1)"></iframe>', '' ),
			'not a string'                   => array( null, '' ),
		);
	}
}
