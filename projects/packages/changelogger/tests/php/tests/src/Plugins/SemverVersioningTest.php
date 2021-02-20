<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the semver versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests\Plugins;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\Plugins\SemverVersioning;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the semver versioning plugin.
 *
 * @covers \Automattic\Jetpack\Changelogger\Plugins\SemverVersioning
 */
class SemverVersioningTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test nextVersion.
	 *
	 * @dataProvider provideNextVersion
	 * @param string                          $version Version.
	 * @param ChangeEntry[]                   $changes Changes.
	 * @param string|InvalidArgumentException $expect Expected result.
	 */
	public function testNextVersion( $version, array $changes, $expect ) {
		$obj = new SemverVersioning( array() );

		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			$obj->nextVersion( $version, $changes );
		} else {
			$this->assertSame( $expect, $obj->nextVersion( $version, $changes ) );
		}
	}

	/**
	 * Data provider for testNextVersion.
	 */
	public function provideNextVersion() {
		return array(
			'No changes'                                  => array(
				'1.2.3',
				array(),
				'1.2.4',
			),
			'Patch changes'                               => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'1.2.4',
			),
			'Minor change'                                => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'1.3.0',
			),
			'Major change'                                => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'major' ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'2.0.0',
			),
			'Version number with extra components'        => array(
				'1.2.3-foo',
				array(),
				'1.2.4',
			),
			'Version number with extra components (2)'    => array(
				'1.2.9.123',
				array(),
				'1.2.10',
			),
			'Version number with extra components (3)'    => array(
				'1.2.3a',
				array(),
				'1.2.4',
			),

			'Version number with insufficient components' => array(
				'1.2',
				array(),
				new InvalidArgumentException( 'Invalid version number "1.2"' ),
			),
			'Version number with non-numeric components'  => array(
				'1.2.x',
				array(),
				new InvalidArgumentException( 'Invalid version number "1.2.x"' ),
			),
		);
	}

}
