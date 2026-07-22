<?php
/**
 * Tests for the Image Metadata feature entry point.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Image_Metadata;
use Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Image_Metadata
 */
#[CoversClass( Image_Metadata::class )]
class Image_Metadata_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_init_registers_filter_at_max_priority() {
		Image_Metadata::init();
		$this->assertSame(
			PHP_INT_MAX,
			has_filter(
				'wp_generate_attachment_metadata',
				array( Metadata_Preserver::class, 'preserve' )
			)
		);
	}
}
