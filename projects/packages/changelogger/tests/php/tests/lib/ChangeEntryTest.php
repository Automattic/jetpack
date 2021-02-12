<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelog ChangeEntry class.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\ChangeEntry;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the changelog ChangeEntry class.
 *
 * @covers \Automattic\Jetpack\Changelog\ChangeEntry
 */
class ChangeEntryTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Need to write tests.
	 */
	public function testStuff() {
		$this->markAsRisky( 'Write tests!' );
		new ChangeEntry();
		new InvalidArgumentException();
	}

}
