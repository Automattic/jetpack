<?php
/**
 * Tests for the Payload value object.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Payload;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Payload
 */
#[CoversClass( Payload::class )]
class Image_Metadata_Payload_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_exposes_segments() {
		$payload = new Payload( array( 'chunk-a', 'chunk-b' ) );
		$this->assertSame( array( 'chunk-a', 'chunk-b' ), $payload->get_segments() );
		$this->assertFalse( $payload->is_empty() );
	}

	public function test_is_empty_when_no_segments() {
		$this->assertTrue( ( new Payload( array() ) )->is_empty() );
	}
}
