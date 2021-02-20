<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the WordPress versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests\Plugins;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\Plugins\WordpressVersioning;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\NullOutput;

/**
 * Tests for the WordPress versioning plugin.
 *
 * @covers \Automattic\Jetpack\Changelogger\Plugins\WordpressVersioning
 */
class WordpressVersioningTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test getOptions.
	 */
	public function testGetOptions() {
		$obj  = new WordpressVersioning( array() );
		$opts = $obj->getOptions();
		$this->assertCount( 1, $opts );
		foreach ( $opts as $opt ) {
			$this->assertInstanceOf( InputOption::class, $opt );
		}
	}

	/**
	 * Test nextVersion.
	 *
	 * @dataProvider provideNextVersion
	 * @param string                          $version Version.
	 * @param ChangeEntry[]                   $changes Changes.
	 * @param string|InvalidArgumentException $expect Expected result.
	 * @param bool                            $point_release Was `--point-release` passed?.
	 */
	public function testNextVersion( $version, array $changes, $expect, $point_release = false ) {
		$obj = new WordpressVersioning( array() );
		$obj->setIO(
			new ArrayInput(
				array( '--point-release' => $point_release ),
				new InputDefinition( $obj->getOptions() )
			),
			new NullOutput()
		);

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
				'1.2',
				array(),
				'1.3',
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
				'1.3',
			),
			'Version number with extra components'        => array(
				'1.2-foo',
				array(),
				'1.3',
			),
			'Version number with extra components (2)'    => array(
				'1.2.9.123',
				array(),
				'1.3',
			),
			'Version number with extra components (3)'    => array(
				'1.2a',
				array(),
				'1.3',
			),
			'Version X.9'                                 => array(
				'9.9',
				array(),
				'10.0',
			),

			'Version number with insufficient components' => array(
				'1',
				array(),
				new InvalidArgumentException( 'Invalid version number "1"' ),
			),
			'Version number with non-numeric components'  => array(
				'1.x',
				array(),
				new InvalidArgumentException( 'Invalid version number "1.x"' ),
			),

			'No changes, --point-release'                 => array(
				'1.2',
				array(),
				'1.2.1',
				true,
			),
			'Major change, --point-release'               => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'major' ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				'1.2.4',
				true,
			),
			'Version number with extra components, --point-release' => array(
				'1.2-foo',
				array(),
				'1.2.1',
				true,
			),
			'Version number with extra components (2), --point-release' => array(
				'1.2.9.123',
				array(),
				'1.2.10',
				true,
			),
			'Version number with extra components (3), --point-release' => array(
				'1.2a',
				array(),
				'1.2.1',
				true,
			),
			'Version X.9, --point-release'                => array(
				'9.9',
				array(),
				'9.9.1',
				true,
			),

			'Version number with insufficient components, --point-release' => array(
				'1',
				array(),
				new InvalidArgumentException( 'Invalid version number "1"' ),
				true,
			),
			'Version number with non-numeric components, --point-release' => array(
				'1.x',
				array(),
				new InvalidArgumentException( 'Invalid version number "1.x"' ),
				true,
			),
			'Version number with non-numeric components (2), --point-release' => array(
				'1.2.x',
				array(),
				new InvalidArgumentException( 'Invalid version number "1.2.x"' ),
				true,
			),
		);
	}

}
