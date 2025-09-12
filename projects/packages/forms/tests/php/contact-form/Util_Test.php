<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Util
 */
#[CoversClass( Util::class )]
class Util_Test extends BaseTestCase {

	public function test_get_version() {
		$version = Util::get_version();
		$this->assertIsString( $version );
		$this->assertGreaterThan( 0, strlen( $version ) );
	}
}
