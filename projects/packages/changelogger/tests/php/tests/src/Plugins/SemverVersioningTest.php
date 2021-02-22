<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the semver versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

namespace Automattic\Jetpack\Changelogger\Tests\Plugins;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\Plugins\SemverVersioning;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;

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
	 * @param string                          $expectOutput Expected output.
	 */
	public function testNextVersion( $version, array $changes, $expect, $expectOutput = '' ) {
		$obj = new SemverVersioning( array() );

		$out1 = $this->getMockBuilder( BufferedOutput::class )
			->setMethods( array( 'getErrorOutput' ) )
			->getMock();
		$out2 = new BufferedOutput();
		$out1->method( 'getErrorOutput' )->willReturn( $out2 );

		$obj->setIO( new ArrayInput( array() ), $out1 );

		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			$obj->nextVersion( $version, $changes );
		} else {
			$this->assertSame( $expect, $obj->nextVersion( $version, $changes ) );
			$this->assertSame( '', $out1->fetch() );
			$this->assertSame( $expectOutput, $out2->fetch() );
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

			'Non-major update for version 0'              => array(
				'0.1.2',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'0.2.0',
			),
			'Major update for version 0'                  => array(
				'0.1.2',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'major' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'0.2.0',
				"<warning>Semver does not automatically move version 0.y.z to 1.0.0.\n<warning>You will have to do that manually when you're ready for the first release.\n",
			),
		);
	}

	/**
	 * Test nextVersion, 0.x version major update with non-console output.
	 */
	public function testNextVersion_majorNonConsole() {
		$obj = new SemverVersioning( array() );
		$out = new BufferedOutput();
		$obj->setIO( new ArrayInput( array() ), $out );
		$this->assertSame(
			'0.2.0',
			$obj->nextVersion( '0.1.2', array( new ChangeEntry( array( 'significance' => 'major' ) ) ) )
		);
		$this->assertSame( '', $out->fetch() );
	}

}
