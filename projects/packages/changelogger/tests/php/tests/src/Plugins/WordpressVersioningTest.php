<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the WordPress versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

namespace Automattic\Jetpack\Changelogger\Tests\Plugins;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\Plugins\WordpressVersioning;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\BufferedOutput;

/**
 * Tests for the WordPress versioning plugin.
 *
 * @covers \Automattic\Jetpack\Changelogger\Plugins\WordpressVersioning
 */
class WordpressVersioningTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;
	use \Yoast\PHPUnitPolyfills\Polyfills\ExpectException;

	/**
	 * Test getOptions.
	 */
	public function testGetOptions() {
		$obj  = new WordpressVersioning( array() );
		$opts = $obj->getOptions();
		$this->assertIsArray( $opts );
		foreach ( $opts as $opt ) {
			$this->assertInstanceOf( InputOption::class, $opt );
		}
	}

	/**
	 * Test normalizeVersion and parseVersion.
	 *
	 * @dataProvider provideNormalizeVersion
	 * @param string                          $version Version.
	 * @param string|InvalidArgumentException $expect Expected result.
	 */
	public function testNormalizeVersion( $version, $expect ) {
		$obj = new WordpressVersioning( array() );
		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			$obj->normalizeVersion( $version );
		} else {
			$this->assertSame( $expect, $obj->normalizeVersion( $version ) );
		}
	}

	/**
	 * Data provider for testNormalizeVersion.
	 */
	public function provideNormalizeVersion() {
		return array(
			array( '1.2', '1.2' ),
			array( '1000.2', '1000.2' ),
			array( '1000.2.999', '1000.2.999' ),
			array( '1.2.3', '1.2.3' ),
			array( '1.2.0', '1.2' ),
			array( '0.0.0', '0.0' ),
			array( '1.2-dev', '1.2-dev' ),
			array( '1.2.3-dev', '1.2.3-dev' ),
			array( '1.2.3-alpha', '1.2.3-alpha' ),
			array( '1.2-alpha1', '1.2-alpha1' ),
			array( '1.2.3-beta', '1.2.3-beta' ),
			array( '1.2-beta1', '1.2-beta1' ),
			array( '1.2.3-rc', '1.2.3-rc' ),
			array( '1.2-rc1', '1.2-rc1' ),
			array( '1.2.3-alpha+foobar', '1.2.3-alpha+foobar' ),
			array( '1.2.3-alpha1+foobar.2', '1.2.3-alpha1+foobar.2' ),
			array( '0001.2.0003-alpha0001+000foobar000....0002', '1.2.3-alpha0001+000foobar000....0002' ),
			array( '1.2.0-21091', '1.2-21091' ),

			array( '1.22', new InvalidArgumentException( 'Version number "1.22" is not in a recognized format.' ) ),
			array( '1.2.x', new InvalidArgumentException( 'Version number "1.2.x" is not in a recognized format.' ) ),
			array( '1.x.4', new InvalidArgumentException( 'Version number "1.x.4" is not in a recognized format.' ) ),
			array( '1..4', new InvalidArgumentException( 'Version number "1..4" is not in a recognized format.' ) ),
			array( '.2.3', new InvalidArgumentException( 'Version number ".2.3" is not in a recognized format.' ) ),
			array( '1.2.', new InvalidArgumentException( 'Version number "1.2." is not in a recognized format.' ) ),
			array( '1.2.-1', new InvalidArgumentException( 'Version number "1.2.-1" is not in a recognized format.' ) ),
			array( 'v1.2.3', new InvalidArgumentException( 'Version number "v1.2.3" is not in a recognized format.' ) ),
			array( '1.2.3.4', new InvalidArgumentException( 'Version number "1.2.3.4" is not in a recognized format.' ) ),
			array( '1.2-alpha.1', new InvalidArgumentException( 'Version number "1.2-alpha.1" is not in a recognized format.' ) ),
			array( '1.2-dev1', new InvalidArgumentException( 'Version number "1.2-dev1" is not in a recognized format.' ) ),
			array( '1.2-DEV', new InvalidArgumentException( 'Version number "1.2-DEV" is not in a recognized format.' ) ),
			array( '1.2-foo', new InvalidArgumentException( 'Version number "1.2-foo" is not in a recognized format.' ) ),
			array( '1.2-foo1', new InvalidArgumentException( 'Version number "1.2-foo1" is not in a recognized format.' ) ),
			array( '1.2.3-?', new InvalidArgumentException( 'Version number "1.2.3-?" is not in a recognized format.' ) ),
			array( '1.2.3+?', new InvalidArgumentException( 'Version number "1.2.3+?" is not in a recognized format.' ) ),
			array( '1.2.3-a..b', new InvalidArgumentException( 'Version number "1.2.3-a..b" is not in a recognized format.' ) ),
		);
	}

	/**
	 * Test nextVersion.
	 *
	 * @dataProvider provideNextVersion
	 * @param string                          $version Version.
	 * @param ChangeEntry[]                   $changes Changes.
	 * @param array                           $extra Extra components.
	 * @param string|InvalidArgumentException $expect Expected result.
	 * @param string                          $expectPoint Expected result for a point release.
	 */
	public function testNextVersion( $version, array $changes, array $extra, $expect, $expectPoint = null ) {
		$obj = new WordpressVersioning( array() );

		$out1 = $this->getMockBuilder( BufferedOutput::class )
			->setMethods( array( 'getErrorOutput' ) )
			->getMock();
		$out2 = new BufferedOutput();
		$out1->method( 'getErrorOutput' )->willReturn( $out2 );

		$def = new InputDefinition( $obj->getOptions() );
		$obj->setIO( new ArrayInput( array(), $def ), $out1 );

		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			$obj->nextVersion( $version, $changes, $extra );
		} else {
			$this->assertSame( $expect, $obj->nextVersion( $version, $changes, $extra ) );
			$this->assertSame( '', $out1->fetch() );
			$this->assertSame( '', $out2->fetch() );

			$obj->setIO( new ArrayInput( array( '--point-release' => true ), $def ), $out1 );
			$this->assertSame( $expectPoint, $obj->nextVersion( $version, $changes, $extra ) );
			$this->assertSame( '', $out1->fetch() );
			$this->assertSame( '', $out2->fetch() );
		}
	}

	/**
	 * Data provider for testNextVersion.
	 */
	public function provideNextVersion() {
		return array(
			'No changes'                               => array(
				'1.2.3',
				array(),
				array(),
				'1.3',
				'1.2.4',
			),
			'Patch changes'                            => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				array(),
				'1.3',
				'1.2.4',
			),
			'Minor change'                             => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				array(),
				'1.3',
				'1.2.4',
			),
			'Major change'                             => array(
				'1.2.3',
				array(
					new ChangeEntry( array( 'significance' => 'patch' ) ),
					new ChangeEntry( array( 'significance' => 'minor' ) ),
					new ChangeEntry( array( 'significance' => null ) ),
					new ChangeEntry( array( 'significance' => 'major' ) ),
					new ChangeEntry( array( 'significance' => 'patch' ) ),
				),
				array(),
				'1.3',
				'1.2.4',
			),
			'Version number with extra components'     => array(
				'1.2.3-dev',
				array(),
				array(),
				'1.3',
				'1.2.4',
			),
			'Version number with extra components (2)' => array(
				'1.2.9+123',
				array(),
				array(),
				'1.3',
				'1.2.10',
			),
			'Version number with extra components (3)' => array(
				'1.2.3-dev+bar',
				array(),
				array(),
				'1.3',
				'1.2.4',
			),
			'Roll over major component'                => array(
				'99.9.999',
				array(),
				array(),
				'100.0',
				'99.9.1000',
			),

			'Including extra components'               => array(
				'1.2.3',
				array(),
				array(
					'prerelease' => 'alpha2',
					'buildinfo'  => 'g12345678.003',
				),
				'1.3-alpha2+g12345678.003',
				'1.2.4-alpha2+g12345678.003',
			),
			'Including extra components (2)'           => array(
				'1.2.3-dev',
				array(),
				array( 'buildinfo' => 'g12345678' ),
				'1.3+g12345678',
				'1.2.4+g12345678',
			),

			'Invalid prerelease component'             => array(
				'1.2.3-dev',
				array(),
				array( 'prerelease' => 'delta' ),
				new InvalidArgumentException( 'Invalid prerelease data' ),
			),
			'Invalid buildinfo component'              => array(
				'1.2.3-dev',
				array(),
				array( 'buildinfo' => 'build?' ),
				new InvalidArgumentException( 'Invalid buildinfo data' ),
			),
		);
	}

	/**
	 * Test compareVersions.
	 *
	 * @dataProvider provideCompareVersions
	 * @param string $a Version A.
	 * @param string $expect Expected result converted to a string, '>', '==', or '<'.
	 * @param string $b Version B.
	 */
	public function testCompareVersions( $a, $expect, $b ) {
		$obj = new WordpressVersioning( array() );
		$ret = $obj->compareVersions( $a, $b );
		$this->assertIsInt( $ret );
		$ret = $ret < 0 ? '<' : ( $ret > 0 ? '>' : '==' );
		$this->assertSame( $expect, $ret );
	}

	/**
	 * Data provider for testCompareVersions.
	 */
	public function provideCompareVersions() {
		return array(
			array( '1.0', '==', '1.0' ),
			array( '1.0.0', '==', '1.0' ),
			array( '1.0', '<', '2.0' ),
			array( '2.0', '>', '1.0' ),
			array( '1.1', '>', '1.0' ),
			array( '1.0', '<', '1.1' ),
			array( '1.9.999', '<', '2.0' ),
			array( '1.1', '<', '1.1.1' ),
			array( '1.0.999', '<', '1.1' ),
			array( '1.1.2', '>', '1.1.1' ),
			array( '1.1.1', '>', '1.1.1-dev' ),
			array( '1.1.0', '<', '1.1.1-dev' ),
			array( '1.1.1-alpha', '<', '1.1.1-beta' ),
			array( '1.1.1-dev', '<', '1.1.1-alpha' ),
			array( '1.1.1-alpha9', '<', '1.1.1-beta1' ),
			array( '1.1.1-beta9', '>', '1.1.1-beta1' ),
			array( '1.1.1-beta9', '==', '1.1.1-beta9' ),
			array( '1.1.1-alpha2', '<', '1.1.1-alpha10' ),
			array( '1.1.1+beta.9.1', '==', '1.1.1+beta.9' ),
		);
	}

	/**
	 * Test firstVersion.
	 *
	 * @dataProvider provideFirstVersion
	 * @param array                           $extra Extra components.
	 * @param string|InvalidArgumentException $expect Expected result.
	 */
	public function testFirstVersion( array $extra, $expect ) {
		$obj = new WordpressVersioning( array() );

		if ( $expect instanceof InvalidArgumentException ) {
			$this->expectException( InvalidArgumentException::class );
			$this->expectExceptionMessage( $expect->getMessage() );
			$obj->firstVersion( $extra );
		} else {
			$this->assertSame( $expect, $obj->firstVersion( $extra ) );
		}
	}

	/**
	 * Data provider for testFirstVersion.
	 */
	public function provideFirstVersion() {
		return array(
			'Normal'             => array(
				array(),
				'0.0',
			),
			'Some extra'         => array(
				array( 'prerelease' => 'alpha' ),
				'0.0-alpha',
			),
			'Invalid prerelease' => array(
				array( 'prerelease' => 'delta' ),
				new InvalidArgumentException( 'Invalid prerelease data' ),
			),
			'Invalid buildinfo'  => array(
				array( 'buildinfo' => 'build?' ),
				new InvalidArgumentException( 'Invalid buildinfo data' ),
			),
		);
	}

}
