<?php
/**
 * This file contains PHPUnit tests for the Breakdance compatibility functions.
 * To run the package unit tests, run jetpack test php packages/image-cdn
 *
 * @package automattic/jetpack-image-cdn
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require __DIR__ . '/../../src/compatibility/breakdance.php';

/**
 * @covers ::\Automattic\Jetpack\Image_CDN\Compatibility\load_breakdance_compat
 */
#[CoversFunction( '\\Automattic\\Jetpack\\Image_CDN\\Compatibility\\load_breakdance_compat' )]
class Breakdance_Compat_Test extends BaseTestCase {
	/**
	 * Test that CDN is enabled for Breakdance content by default.
	 */
	public function test_load_breakdance_compat_default() {
		\Automattic\Jetpack\Image_CDN\Compatibility\load_breakdance_compat();
		// By default we should hook into the Breakdance filters.
		$this->assertTrue( has_filter( 'breakdance_singular_content' ) );
	}
}
